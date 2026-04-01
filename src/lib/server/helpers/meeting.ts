import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'Europe/Stockholm';

export async function getRoomEvents(
    client: any,
    roomEmail: string,
    startDate: Date,
    endDate: Date
) {
    const events = [] as any[];
    let response = await client
        .api(`/users/${roomEmail}/calendarView`)
        .header('Prefer', 'outlook.timezone="W. Europe Standard Time"')
        .query({
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
        })
        .get();

    events.push(...(response?.value ?? []));

    while (response?.['@odata.nextLink']) {
        response = await client
            .api(response['@odata.nextLink'])
            .header('Prefer', 'outlook.timezone="W. Europe Standard Time"')
            .get();
        events.push(...(response?.value ?? []));
    }

    return { value: events };
}

function normalizeEventDateTime(dateTime: string) {
    const hasExplicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateTime);
    const parsedDate = hasExplicitOffset ? new Date(dateTime) : fromZonedTime(dateTime, TIME_ZONE);
    return formatInTimeZone(parsedDate, TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function formatGraphDateTime(dateTime: string | Date, timeZone: string) {
    const parsedDate = dateTime instanceof Date ? dateTime : new Date(dateTime);
    return formatInTimeZone(parsedDate, timeZone, "yyyy-MM-dd'T'HH:mm:ss");
}

export function normalizeCalendarEvent(event: any) {
    const organizerName = event.organizer?.emailAddress?.name ?? 'Okänd';
    const isPanelBooking = Boolean(event.categories?.includes('PanelBooking'));
    const panelBooker = isPanelBooking ? extractPanelBookingName(event) : null;
    const displayOrganizer = isPanelBooking ? (panelBooker ?? 'Bokat på panel') : organizerName;

    return {
        id: event.id,
        startDate: normalizeEventDateTime(event.start.dateTime),
        endDate: normalizeEventDateTime(event.end.dateTime),
        organizer: displayOrganizer,
        isPanelBooking,
    };
}

export function normalizeCalendarEvents(events: any) {
    return (events?.value ?? [])
        .map((event: any) => normalizeCalendarEvent(event))
        .sort(
            (left: { startDate: string }, right: { startDate: string }) =>
                new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
        );
}

export function processMeetingStatus(events: any, now: Date) {
    let status = 'Ledig';
    let currentMeeting: any = null;
    let nextMeeting: string | null = null;
    let currentMeetingOrganizer: string | null = null;
    let nextMeetingOrganizer: string | null = null;
    const todaysMeetings = normalizeCalendarEvents(events);

    todaysMeetings.forEach((event: any) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (now >= start && now < end) {
            status = 'Upptagen';
            currentMeeting = {
                id: event.id,
                startDate: event.startDate,
                endDate: event.endDate,
                organizer: event.organizer,
                isPanelBooking: event.isPanelBooking,
            };
            currentMeetingOrganizer = currentMeeting.organizer;
        }
    });

    const upcoming = todaysMeetings.filter((m: { startDate: string }) => new Date(m.startDate) > now);
    if (upcoming.length > 0) {
        nextMeeting = upcoming[0].startDate;
        nextMeetingOrganizer = upcoming[0].organizer;
    }

    return {
        status,
        currentMeeting,
        nextMeeting,
        currentMeetingOrganizer,
        nextMeetingOrganizer,
        todaysMeetings,
    };
}

export async function getNextMeeting(client: any, roomEmail: string, now: Date, endOfDay: Date) {
    const events = await client
        .api(`/users/${roomEmail}/calendarView`)
        .header('Prefer', 'outlook.timezone="W. Europe Standard Time"')
        .query({
            startDateTime: now.toISOString(),
            endDateTime: endOfDay.toISOString(),
        })
        .get();
    return events.value;
}

function extractPanelBookingName(event: any): string | null {
    const subject = typeof event.subject === 'string' ? event.subject.trim() : '';
    const subjectMatch = subject.match(/^Panelbokning(?:\s*\([^)]*\))?[:\-]\s*(.+)$/i);
    if (subjectMatch) {
        return subjectMatch[1].trim();
    }

    const bodyPreview = typeof event.bodyPreview === 'string' ? event.bodyPreview : '';
    const bodyContent = typeof event.body?.content === 'string' ? event.body.content : '';

    for (const raw of [bodyPreview, bodyContent]) {
        if (!raw) continue;
        const normalized = raw
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const match =
            normalized.match(/Panelbokad av[:\s]+([^.;]+)/i) ||
            normalized.match(/Bokad(?:e)? av[:\s]+([^.;]+)/i);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

export async function createCalendarEvent(
    client: any,
    { subject, bodyContent, startTime, endTime, timeZone, roomEmail, category }: any
) {
    return client.api(`/users/${roomEmail}/events`).post({
        subject,
        body: { contentType: 'HTML', content: bodyContent },
        start: { dateTime: formatGraphDateTime(startTime, timeZone), timeZone },
        end: { dateTime: formatGraphDateTime(endTime, timeZone), timeZone },
        attendees: [
            {
                emailAddress: { address: roomEmail, name: 'Bokat på panel' },
                type: 'required',
            },
        ],
        categories: [category],
        location: { displayName: roomEmail },
    });
}

export async function updateMeetingEndTime(
    client: any,
    roomEmail: string,
    eventId: string,
    newEndTime: Date
) {
    return client.api(`/users/${roomEmail}/events/${eventId}`).patch({
        end: {
            dateTime: formatGraphDateTime(newEndTime, TIME_ZONE),
            timeZone: TIME_ZONE,
        },
    });
}
