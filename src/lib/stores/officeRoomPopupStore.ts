import { writable } from 'svelte/store';
import type { OfficeRoom, OfficeRoomPopupOptions } from '$lib/types/officeRoomTypes';

export type OfficeRoomPopupState = {
    open: boolean;
    room: OfficeRoom | null;
    options: Required<OfficeRoomPopupOptions>;
};

const defaultOptions: Required<OfficeRoomPopupOptions> = {
    width: 'min(92vw, 520px)',
    height: 'auto',
};

const initialState: OfficeRoomPopupState = {
    open: false,
    room: null,
    options: { ...defaultOptions },
};

export const officeRoomPopup = writable<OfficeRoomPopupState>(initialState);

export function openOfficeRoomPopup(room: OfficeRoom, options: OfficeRoomPopupOptions = {}): void {
    officeRoomPopup.set({
        open: true,
        room,
        options: { ...defaultOptions, ...options },
    });
}

export function closeOfficeRoomPopup(): void {
    officeRoomPopup.set({ ...initialState });
}

export function updateOfficeRoomInPopup(room: OfficeRoom): void {
    officeRoomPopup.update((state) => {
        if (state.open && state.room?.id === room.id) {
            return { ...state, room };
        }
        return state;
    });
}
