export function calculateMinutesUntil(time: string | Date) {
    const now = new Date();
    const t = new Date(time);
    return Math.floor((t.getTime() - now.getTime()) / (1000 * 60));
}

export function getEndOfDay(date: Date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
}

export function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60000);
}

export async function calculateMaxExtension(currentEndTime: Date, events: any[]) {
    let maxEnd = new Date(currentEndTime);
    const nextEvent = events.find((e) => new Date(e.start.dateTime) > currentEndTime);

    if (nextEvent) {
        const nextStart = new Date(nextEvent.start.dateTime);
        if (nextStart.getTime() - currentEndTime.getTime() < 2 * 60 * 60 * 1000) {
            maxEnd = nextStart;
        } else {
            maxEnd.setHours(currentEndTime.getHours() + 2);
        }
    } else {
        maxEnd.setHours(currentEndTime.getHours() + 2);
    }
    return maxEnd;
}
