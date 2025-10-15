import { writable } from 'svelte/store';
import type { MeetingRoom } from '$lib/types/roomTypes';

type State = {
    open: boolean;
    room: MeetingRoom | null;
    onBookingUpdated?: () => void;
};

export const roomPopup = writable<State>({ open: false, room: null });

export function openRoomPopup(room: MeetingRoom, opts?: { onBookingUpdated?: () => void }) {
    roomPopup.set({ open: true, room, onBookingUpdated: opts?.onBookingUpdated });
}

export function closeRoomPopup() {
    roomPopup.set({ open: false, room: null, onBookingUpdated: undefined });
}

/** call this after you refresh rooms to keep the popup in sync */
export function updateRoomInPopupIfOpen(updatedRoom: MeetingRoom) {
    roomPopup.update((s) => {
        if (s.open && s.room && s.room.email === updatedRoom.email) {
            return { ...s, room: updatedRoom };
        }
        return s;
    });
}
