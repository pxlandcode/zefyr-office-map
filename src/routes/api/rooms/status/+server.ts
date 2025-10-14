import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import { rooms } from '$lib/server/config/rooms';
import { getRoomEvents, processMeetingStatus } from '$lib/server/helpers/meeting';
import { formatRoomStatus } from '$lib/server/helpers/format';
import { REQUIRE_AUTH } from '$env/static/private';

export const GET = async ({ locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const client = await getClient();

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const roomStatuses = await Promise.all(
            rooms.map(async (room) => {
                const events = await getRoomEvents(client, room.email, startOfDay, endOfDay);
                console.log(`Hämtade ${events} möten för rum ${room.email}`);
                const statusData = processMeetingStatus(events, now);
                console.log('Statusdata för rum', room.email, statusData);
                return formatRoomStatus(room, statusData, now);
            })
        );

        const ongoingMeetings: any[] = [];
        const upcomingMeetings: any[] = [];

        for (const room of roomStatuses) {
            (room.todaysMeetings ?? []).forEach((meeting: any) => {
                const start = new Date(meeting.startDate);
                const end = new Date(meeting.endDate);
                (meeting as any).roomName = room.name;

                if (now >= start && now < end) ongoingMeetings.push(meeting);
                else if (start > now) upcomingMeetings.push(meeting);
            });
        }

        return json({ rooms: roomStatuses, ongoingMeetings, upcomingMeetings });
    } catch (error: any) {
        console.error('Fel vid hämtning av rumstatus:', error);
        return new Response('Fel vid hämtning av rumstatus: ' + error.message, { status: 500 });
    }
};
