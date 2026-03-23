type StubGraphEvent = {
    id: string;
    subject: string;
    categories?: string[];
    body?: { contentType?: string; content?: string };
    bodyPreview?: string;
    organizer?: { emailAddress?: { name?: string; address?: string } };
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{
        emailAddress?: { address?: string; name?: string };
        type?: string;
    }>;
    location?: { displayName?: string };
};

type CalendarViewQuery = {
    startDateTime?: string;
    endDateTime?: string;
};

type RoomStore = Map<string, StubGraphEvent[]>;

const roomEvents: RoomStore = new Map();
let nextEventId = 1;

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

function stripHtml(value: string | undefined) {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function sortEvents(events: StubGraphEvent[]) {
    events.sort(
        (left, right) =>
            new Date(left.start.dateTime).getTime() - new Date(right.start.dateTime).getTime()
    );
}

function getRoomBucket(roomEmail: string) {
    const existing = roomEvents.get(roomEmail);
    if (existing) return existing;
    const created: StubGraphEvent[] = [];
    roomEvents.set(roomEmail, created);
    return created;
}

function filterCalendarView(events: StubGraphEvent[], query: CalendarViewQuery) {
    const start = query.startDateTime ? new Date(query.startDateTime).getTime() : Number.NEGATIVE_INFINITY;
    const end = query.endDateTime ? new Date(query.endDateTime).getTime() : Number.POSITIVE_INFINITY;

    return events.filter((event) => {
        const eventStart = new Date(event.start.dateTime).getTime();
        const eventEnd = new Date(event.end.dateTime).getTime();
        return eventEnd >= start && eventStart <= end;
    });
}

function parsePath(path: string) {
    const calendarViewMatch = path.match(/^\/users\/([^/]+)\/calendarView$/);
    if (calendarViewMatch) {
        return { kind: 'calendarView' as const, roomEmail: decodeURIComponent(calendarViewMatch[1]) };
    }

    const eventsMatch = path.match(/^\/users\/([^/]+)\/events$/);
    if (eventsMatch) {
        return { kind: 'events' as const, roomEmail: decodeURIComponent(eventsMatch[1]) };
    }

    const eventMatch = path.match(/^\/users\/([^/]+)\/events\/([^/]+)$/);
    if (eventMatch) {
        return {
            kind: 'event' as const,
            roomEmail: decodeURIComponent(eventMatch[1]),
            eventId: decodeURIComponent(eventMatch[2]),
        };
    }

    throw new Error(`Unsupported Microsoft Graph stub path: ${path}`);
}

class StubGraphRequestBuilder {
    private requestHeaders: Record<string, string> = {};
    private requestQuery: CalendarViewQuery = {};

    constructor(private readonly path: string) {}

    header(name: string, value: string) {
        this.requestHeaders[name] = value;
        return this;
    }

    query(params: CalendarViewQuery) {
        this.requestQuery = { ...this.requestQuery, ...params };
        return this;
    }

    async get() {
        const parsed = parsePath(this.path);
        if (parsed.kind !== 'calendarView') {
            throw new Error(`GET not supported for path ${this.path}`);
        }

        const events = filterCalendarView(getRoomBucket(parsed.roomEmail), this.requestQuery);
        sortEvents(events);
        return { value: clone(events) };
    }

    async post(body: any) {
        const parsed = parsePath(this.path);
        if (parsed.kind !== 'events') {
            throw new Error(`POST not supported for path ${this.path}`);
        }

        const bucket = getRoomBucket(parsed.roomEmail);
        const event: StubGraphEvent = {
            id: String(nextEventId++),
            subject: body?.subject ?? '',
            categories: Array.isArray(body?.categories) ? body.categories : [],
            body: body?.body,
            bodyPreview: stripHtml(body?.body?.content),
            organizer: body?.organizer ?? {
                emailAddress: { name: 'Bokat på panel', address: parsed.roomEmail },
            },
            start: body?.start,
            end: body?.end,
            attendees: body?.attendees,
            location: body?.location,
        };

        bucket.push(event);
        sortEvents(bucket);
        return clone(event);
    }

    async patch(body: any) {
        const parsed = parsePath(this.path);
        if (parsed.kind !== 'event') {
            throw new Error(`PATCH not supported for path ${this.path}`);
        }

        const bucket = getRoomBucket(parsed.roomEmail);
        const event = bucket.find((candidate) => candidate.id === parsed.eventId);
        if (!event) {
            throw new Error(`Stub Graph event not found: ${parsed.eventId}`);
        }

        if (body?.end) {
            event.end = { ...event.end, ...body.end };
        }
        if (body?.start) {
            event.start = { ...event.start, ...body.start };
        }
        if (typeof body?.subject === 'string') {
            event.subject = body.subject;
        }
        if (body?.body) {
            event.body = { ...event.body, ...body.body };
            event.bodyPreview = stripHtml(event.body?.content);
        }
        if (Array.isArray(body?.categories)) {
            event.categories = body.categories;
        }

        sortEvents(bucket);
        return clone(event);
    }

    async delete() {
        const parsed = parsePath(this.path);
        if (parsed.kind !== 'event') {
            throw new Error(`DELETE not supported for path ${this.path}`);
        }

        const bucket = getRoomBucket(parsed.roomEmail);
        const index = bucket.findIndex((candidate) => candidate.id === parsed.eventId);
        if (index === -1) {
            throw new Error(`Stub Graph event not found: ${parsed.eventId}`);
        }

        bucket.splice(index, 1);
        return undefined;
    }
}

export function createStubGraphClient() {
    return {
        api(path: string) {
            return new StubGraphRequestBuilder(path);
        },
    };
}

export function resetStubGraphState() {
    roomEvents.clear();
    nextEventId = 1;
}

export function seedStubGraphRoomEvents(roomEmail: string, events: StubGraphEvent[]) {
    const bucket = getRoomBucket(roomEmail);
    bucket.splice(0, bucket.length, ...clone(events));
    sortEvents(bucket);

    for (const event of bucket) {
        const numericId = Number(event.id);
        if (Number.isFinite(numericId)) {
            nextEventId = Math.max(nextEventId, numericId + 1);
        }
        event.bodyPreview = stripHtml(event.body?.content ?? event.bodyPreview);
    }
}

export function getStubGraphSnapshot() {
    return Object.fromEntries(Array.from(roomEvents.entries()).map(([roomEmail, events]) => [roomEmail, clone(events)]));
}

