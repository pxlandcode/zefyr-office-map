export async function getRoomEvents(
    client: any,
    roomEmail: string,
    startDate: Date,
    endDate: Date
) {
    return await client
        .api(`/users/${roomEmail}/calendarView`)
        .header('Prefer', 'outlook.timezone="W. Europe Standard Time"')
        .query({
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
        })
        .get();
}

export function processMeetingStatus(events: any, now: Date) {
    let status = 'Ledig';
    let currentMeeting: any = null;
    let nextMeeting: string | null = null;
    let currentMeetingOrganizer: string | null = null;
    let nextMeetingOrganizer: string | null = null;
    const todaysMeetings: any[] = [];

    events.value.forEach((event: any) => {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const organizerName = event.organizer?.emailAddress?.name ?? 'Okänd';
        const isPanelBooking = Boolean(event.categories?.includes('PanelBooking'));
        const panelBooker = isPanelBooking ? extractPanelBookingName(event) : null;
        const displayOrganizer = isPanelBooking ? (panelBooker ?? 'Bokat på panel') : organizerName;

        if (now >= start && now < end) {
            status = 'Upptagen';
            currentMeeting = {
                startDate: event.start.dateTime,
                endDate: event.end.dateTime,
                organizer: displayOrganizer,
            };
            currentMeetingOrganizer = currentMeeting.organizer;
        }

        todaysMeetings.push({
            startDate: event.start.dateTime,
            endDate: event.end.dateTime,
            organizer: displayOrganizer,
        });
    });

    const upcoming = todaysMeetings.filter((m) => new Date(m.startDate) > now);
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
        start: { dateTime: startTime, timeZone },
        end: { dateTime: endTime, timeZone },
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
            dateTime: newEndTime.toISOString(),
            timeZone: 'Europe/Stockholm',
        },
    });
}
