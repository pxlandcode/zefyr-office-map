import type { Meeting, MeetingRoom } from '$lib/types/roomTypes';
import {
    getCurrentMinuteOfDay,
    formatMinuteOfDay,
    getAvailableMinutesAtStart,
    getNearbyValidStartMinutes,
} from '$lib/utils/helpers/bookingSelectionHelpers';
import { createDateKey } from '$lib/utils/helpers/calendarHelpers';
import { MIN_BOOKING_MINUTES } from '$lib/utils/helpers/bookingHelpers';

export interface BookingSelectOption {
    value: number;
    label: string;
}

export const selectedMeetingCancelHelpText =
    'För att avboka den här bokningen, kontakta den som bokade rummet.';

export function getStartTimeOptions(
    dateKey: string,
    selectedStartMinuteOfDay: number | null,
    meetings: Meeting[],
    now = new Date()
) {
    const currentMinuteOfDay = getCurrentMinuteOfDay(now);
    const isToday = dateKey === createDateKey(now);

    return getNearbyValidStartMinutes(dateKey, selectedStartMinuteOfDay, meetings, now).map(
        (minuteOfDay) => ({
            value: minuteOfDay,
            label: isToday && minuteOfDay === currentMinuteOfDay ? 'Nu' : formatMinuteOfDay(minuteOfDay),
        })
    );
}

export function getAvailableMinutesForBooking(
    dateKey: string,
    meetings: Meeting[],
    selectedStartMinuteOfDay: number | null,
    now = new Date()
) {
    return getAvailableMinutesAtStart(dateKey, selectedStartMinuteOfDay, meetings, now);
}

export function getSelectedOption(options: BookingSelectOption[], selectedValue: number | null) {
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

export function canBookSelectedSlot(
    selectedStartMinuteOfDay: number | null,
    bookingOptions: BookingSelectOption[]
) {
    return selectedStartMinuteOfDay != null && bookingOptions.length > 0;
}

export function canExtendRoom(room: MeetingRoom | null, selectedExtendOption: number) {
    return (
        room?.currentMeetingEndsIn != null &&
        room.currentMeetingEndsIn <= 15 &&
        selectedExtendOption <= (room.minutesUntilNextMeeting ?? 24 * 60)
    );
}

export function canCancelSelectedMeeting(
    selectedMeeting: Meeting | null,
    selectedDateKey: string,
    now = new Date()
) {
    if (!selectedMeeting?.id) {
        return false;
    }

    const meetingEnd = new Date(selectedMeeting.endDate);
    if (meetingEnd <= now) {
        return false;
    }

    if (selectedDateKey === createDateKey(now)) {
        return true;
    }

    return Boolean(selectedMeeting.isPanelBooking);
}

export function getSelectedMeetingCancelMessage(
    selectedMeeting: Meeting | null,
    selectedDateKey: string,
    now = new Date()
) {
    if (!selectedMeeting) {
        return null;
    }

    const meetingStart = new Date(selectedMeeting.startDate);
    const meetingEnd = new Date(selectedMeeting.endDate);

    if (meetingEnd <= now || selectedDateKey === createDateKey(now)) {
        return null;
    }

    return meetingStart > now && !selectedMeeting.isPanelBooking
        ? selectedMeetingCancelHelpText
        : null;
}
