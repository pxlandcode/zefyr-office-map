import type { Meeting, MeetingRoom } from '$lib/types/roomTypes';
import { MIN_BOOKING_MINUTES } from '$lib/utils/helpers/bookingHelpers';

export interface BookingSelectOption {
    value: number;
    label: string;
}

const timeFormatter = new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

export function getStartTimeOptions(minutesUntilNextMeeting: number | null, now = new Date()) {
    const options: BookingSelectOption[] = [];
    const maxAvailableMinutes = minutesUntilNextMeeting ?? Number.POSITIVE_INFINITY;

    if (minutesUntilNextMeeting !== null && maxAvailableMinutes < MIN_BOOKING_MINUTES) {
        return options;
    }

    options.push({ value: 0, label: 'Nu' });

    const remainder = now.getMinutes() % 15;
    const firstOffset = remainder === 0 ? 15 : 15 - remainder;
    const offsets = [firstOffset, firstOffset + 15];

    for (const offset of offsets) {
        if (offset >= maxAvailableMinutes) continue;
        if (maxAvailableMinutes - offset < MIN_BOOKING_MINUTES) continue;

        const futureDate = new Date(now.getTime() + offset * 60 * 1000);
        options.push({ value: offset, label: timeFormatter.format(futureDate) });
    }

    return options;
}

export function getAvailableMinutesForBooking(
    minutesUntilNextMeeting: number | null,
    selectedStartOffset: number
) {
    const base = minutesUntilNextMeeting ?? 24 * 60;
    const remaining = base - selectedStartOffset;
    return remaining >= MIN_BOOKING_MINUTES ? remaining : 0;
}

export function getSelectedOption(
    options: BookingSelectOption[],
    selectedValue: number
) {
    return options.find((option) => option.value === selectedValue) ?? options[0] ?? null;
}

export function getNextMeeting(todaysMeetings: Meeting[] = [], now = new Date()) {
    return todaysMeetings.find((meeting) => new Date(meeting.startDate) > now) ?? null;
}

export function canBookRoom(
    room: MeetingRoom | null,
    startTimeOptions: BookingSelectOption[],
    bookingOptions: BookingSelectOption[]
) {
    return (
        (room?.minutesUntilNextMeeting == null ||
            room.minutesUntilNextMeeting >= MIN_BOOKING_MINUTES) &&
        startTimeOptions.length > 0 &&
        bookingOptions.length > 0
    );
}

export function canExtendRoom(room: MeetingRoom | null, selectedExtendOption: number) {
    return (
        room?.currentMeetingEndsIn != null &&
        room.currentMeetingEndsIn <= 15 &&
        selectedExtendOption <= (room.minutesUntilNextMeeting ?? 24 * 60)
    );
}
