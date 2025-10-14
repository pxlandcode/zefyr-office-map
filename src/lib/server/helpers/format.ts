import { calculateMinutesUntil } from './timeUtils';
import { getRoomDisplayName } from './roomUtils';

export function formatTime(dateTime: string | Date, timeZone = 'Europe/Stockholm') {
    const options: Intl.DateTimeFormatOptions = { timeZone, hour: '2-digit', minute: '2-digit' };
    const fmt = new Intl.DateTimeFormat('sv-SE', options);
    return `Idag, ${fmt.format(new Date(dateTime))}`;
}

export function formatRoomStatus(room: any, statusData: any, _now: Date) {
    console.log('formatRoomStatus:', { room, statusData });
    const displayName = getRoomDisplayName(room.email);

    const nextMeetingInfo = statusData.nextMeeting
        ? `${formatTime(statusData.nextMeeting)}, ${statusData.nextMeetingOrganizer}`
        : 'Ledig resten av dagen';

    return {
        name: displayName,
        email: room.email,
        capacity: room.capacity,
        status: statusData.status,
        currentMeetingOrganizer: statusData.currentMeetingOrganizer,
        currentMeetingEndsIn: statusData.currentMeeting
            ? calculateMinutesUntil(statusData.currentMeeting.endDate)
            : null,
        currentMeeting: statusData.currentMeeting,
        nextMeetingInfo,
        minutesUntilNextMeeting: statusData.nextMeeting
            ? calculateMinutesUntil(statusData.nextMeeting)
            : null,
        todaysMeetings: statusData.todaysMeetings,
    };
}
