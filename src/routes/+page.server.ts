import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const res = await fetch('/api/rooms/status'); // uses event.fetch under the hood
        if (!res.ok) throw new Error('Room status API returned ' + res.status);
        const { rooms, ongoingMeetings, upcomingMeetings, errors } = await res.json();
        return { rooms, ongoingMeetings, upcomingMeetings, errors };
    } catch (err: any) {
        return {
            rooms: [],
            ongoingMeetings: [],
            upcomingMeetings: [],
            error: err?.message ?? 'Unknown error',
        };
    }
};
