import { format } from 'date-fns-tz';
import type { Room } from '$lib/types/roomTypes';
import { AppNotificationType } from '$lib/types/notificationTypes';
import { addNotification } from '../../../stores/notificationStore';
import { bookRoom, cancelRoomBooking, extendRoomBooking } from '$lib/utils/api/api.js';
import { runWithPin } from '$lib/stores/pinPromptStore'; // ✅ new

export const bookingOptions: Record<number, string> = {
    30: '30 min',
    60: '60 min',
    90: '90 min',
    120: '120 min',
};

/** Client-side validator used by the PIN modal.
 *  Returns true on 200 OK, otherwise a short error string.
 */
async function verifyPinClient(pin: string): Promise<boolean | string> {
    try {
        const res = await fetch('/api/auth/pin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        });
        return res.ok || 'Fel PIN';
    } catch {
        return 'Fel PIN';
    }
}

export function generateTimeBookingOptions(
    maxTime: number,
    remainingTime: number | null = null,
    minutesUntilNextMeeting: number | null = null
) {
    const options = Object.entries(bookingOptions)
        .filter(([minutes]) => {
            const time = Number(minutes);
            return (
                time <= maxTime &&
                (remainingTime === null || remainingTime <= 15 || time <= remainingTime)
            );
        })
        .map(([value, label]) => ({ value: Number(value), label }));

    if (minutesUntilNextMeeting && minutesUntilNextMeeting < 120) {
        options.push({ value: minutesUntilNextMeeting, label: `${minutesUntilNextMeeting} min` });
    }
    return options;
}

// BOOK
export async function handleBooking(
    room: Room,
    selectedBookingOption: number,
    dispatch: (event: string) => void
) {
    const ok = await runWithPin({
        title: 'Bekräfta bokning',
        confirmIcon: 'CheckMeeting',
        validate: verifyPinClient,
        actionLabel: 'Bokar…',
        runSuccessDelay: 300,
        run: async (pin) => {
            await bookRoom(room.email, selectedBookingOption, pin);
            dispatch('bookingUpdated'); // refresh behind the modal
        },
    });
    if (!ok) return;

    addNotification({
        type: AppNotificationType.SUCCESS,
        message: 'Bokning genomförd',
        description: `Rummet ${room.name} har bokats i ${selectedBookingOption} minuter.`,
    });
}

// CANCEL
export async function handleCancel(room: Room, dispatch: (event: string) => void) {
    const ok = await runWithPin({
        title: 'Bekräfta avbokning',
        confirmIcon: 'CrossMeeting',
        validate: verifyPinClient,
        actionLabel: 'Avbokar…',
        runSuccessDelay: 300,
        run: async (pin) => {
            await cancelRoomBooking(room.email, pin);
            dispatch('bookingUpdated');
        },
    });
    if (!ok) return;

    if (room.currentMeeting) {
        addNotification({
            type: AppNotificationType.CANCEL,
            message: 'Bokning avslutad',
            description: `Tiden ${format(new Date(room.currentMeeting.startDate), 'HH:mm')} - ${format(
                new Date(room.currentMeeting.endDate),
                'HH:mm'
            )} har avbokats för rummet ${room.name}.`,
        });
    }
}

// EXTEND
export async function handleExtend(
    room: Room,
    selectedExtendOption: number,
    dispatch: (event: string) => void
) {
    const ok = await runWithPin({
        title: 'Bekräfta förlängning',
        confirmIcon: 'MoreTime',
        validate: verifyPinClient,
        actionLabel: 'Förlänger…',
        runSuccessDelay: 300,
        run: async (pin) => {
            await extendRoomBooking(room.email, selectedExtendOption, pin);
            dispatch('bookingUpdated');
        },
    });
    if (!ok) return;

    if (room.currentMeeting) {
        addNotification({
            type: AppNotificationType.NOTE,
            message: 'Bokning har förlängts',
            description: `Bokningen på rum ${room.name} har förlängts med ${selectedExtendOption} minuter.`,
        });
    }
}
