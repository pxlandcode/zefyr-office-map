export const roomDisplayNames: Record<string, string> = {
    'avatar@zefyr.se': 'Avatar',
    'matrix@zefyr.se': 'Matrix',
    'billyelliot@zefyr.se': 'Billy Elliot',
    'nyckelntillfrihet@zefyr.se': 'Nyckeln till frihet',
    'phonebooth@zefyr.se': 'Phone Booth',
};

export interface Room {
    name: string;
    email: string;
    capacity: number;
    status: string;
    currentMeetingOrganizer: string;
    currentMeetingEndsIn: number;
    currentMeeting: Meeting | null;
    nextMeetingInfo: string;
    minutesUntilNextMeeting: number | null;
    todaysMeetings: Meeting[];
}

export interface Meeting {
    id?: string;
    startDate: string;
    endDate: string;
    organizer: string;
    roomName?: string;
}

export interface RoomBookingOverview {
    rooms: Room[];
    ongoingMeetings: Meeting[];
    upcomingMeetings: Meeting[];
}
