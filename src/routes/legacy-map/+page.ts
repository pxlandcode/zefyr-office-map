import { getRoomStatus } from '$lib/utils/api/api.js';

export async function load() {
    try {
        const { rooms, ongoingMeetings, upcomingMeetings } = await getRoomStatus();
        return { rooms, ongoingMeetings, upcomingMeetings };
    } catch (err) {
        return { error: err.message };
    }
}
