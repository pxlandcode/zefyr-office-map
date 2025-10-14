export function getRoomStatus(currentMeetingEndsIn: number | null): string {
    if (currentMeetingEndsIn === null) {
        return 'Free'; // Free for the day
    }

    switch (true) {
        case currentMeetingEndsIn <= 15:
            return 'AlmostFree'; // Available soon
        case currentMeetingEndsIn > 15:
            return 'Occupied'; // Currently occupied
        default:
            return 'Unknown'; // Default or error state
    }
}

export function getBookingOrganizer(organizer: string) {
    return organizer === 'Bokat på panel' ? 'Bokad på panel' : `Bokat av: ${organizer}`;
}

export function getRoomDisplayName(email: string) {
    const roomMapping: Record<string, string> = {
        'avatar@zefyr.se': 'Avatar',
        'matrix@zefyr.se': 'Matrix',
        'billyelliot@zefyr.se': 'Billy Elliot',
        'nyckelntillfrihet@zefyr.se': 'Nyckeln till frihet',
        'phonebooth@zefyr.se': 'Phone Booth',
    };
    return roomMapping[email] || email;
}
