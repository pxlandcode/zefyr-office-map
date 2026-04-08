import { format } from 'date-fns-tz';
import type { Meeting, MeetingRoom } from '$lib/types/roomTypes';
import { AppNotificationType } from '$lib/types/notificationTypes';
import { addNotification } from '../../../stores/notificationStore';
import { bookRoom, cancelRoomBooking, extendRoomBooking } from '$lib/utils/api/api.js';
import { runWithPin } from '$lib/stores/pinPromptStore'; // ✅ new
import { createDateTimeFromDateKeyAndMinute } from '$lib/utils/helpers/calendarHelpers';

export const MIN_BOOKING_MINUTES = 15;

export const bookingOptions: Record<number, string> = {
    30: '30 min',
    60: '60 min',
    90: '90 min',
    120: '120 min',
};

const bookingDateFormatter = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Stockholm',
});

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

    if (
        minutesUntilNextMeeting &&
        minutesUntilNextMeeting < 120 &&
        minutesUntilNextMeeting >= MIN_BOOKING_MINUTES
    ) {
        options.push({ value: minutesUntilNextMeeting, label: `${minutesUntilNextMeeting} min` });
    }
    return options;
}

// BOOK
export async function handleBooking(
    room: MeetingRoom,
    selectedBookingOption: number,
    selectedDateKey: string,
    selectedStartMinuteOfDay: number,
    dispatch: (event: string) => void
) {
    let bookedMeeting: Meeting | null = null;

    const ok = await runWithPin({
        title: 'Bekräfta bokning',
        confirmIcon: 'CheckMeeting',
        validate: verifyPinClient,
        actionLabel: 'Bokar…',
        runSuccessDelay: 300,
        run: async (pin) => {
            const response = await bookRoom(
                room.email,
                selectedBookingOption,
                selectedDateKey,
                selectedStartMinuteOfDay,
                pin
            );

            if (typeof response !== 'string') {
                bookedMeeting = response.meeting;
            }

            dispatch('bookingUpdated'); // refresh behind the modal
        },
    });
    if (!ok) return null;

    const startTime = createDateTimeFromDateKeyAndMinute(
        selectedDateKey,
        selectedStartMinuteOfDay
    );
    const formattedStartTime = format(startTime, 'HH:mm', { timeZone: 'Europe/Stockholm' });
    const formattedDate = bookingDateFormatter.format(startTime);

    addNotification({
        type: AppNotificationType.SUCCESS,
        message: 'Bokning genomförd',
        description: `Rummet ${room.name} har bokats ${formattedDate} från ${formattedStartTime} i ${selectedBookingOption} minuter.`,
    });

    return bookedMeeting;
}

// CANCEL
export async function handleCancel(
    room: MeetingRoom,
    dispatch: (event: string) => void,
    meetingToCancel: Meeting | null = room.currentMeeting
) {
    const ok = await runWithPin({
        title: 'Bekräfta avbokning',
        confirmIcon: 'CrossMeeting',
        validate: verifyPinClient,
        actionLabel: 'Avbokar…',
        runSuccessDelay: 300,
        run: async (pin) => {
            await cancelRoomBooking(room.email, pin, meetingToCancel?.id);
            dispatch('bookingUpdated');
        },
    });
    if (!ok) return;

    if (meetingToCancel) {
        addNotification({
            type: AppNotificationType.CANCEL,
            message: 'Bokning avslutad',
            description: `Tiden ${format(new Date(meetingToCancel.startDate), 'HH:mm')} - ${format(
                new Date(meetingToCancel.endDate),
                'HH:mm'
            )} har avbokats för rummet ${room.name}.`,
        });
    }

    return meetingToCancel;
}

// EXTEND
export async function handleExtend(
    room: MeetingRoom,
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
