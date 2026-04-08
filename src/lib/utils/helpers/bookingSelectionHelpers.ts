import type { Meeting } from '$lib/types/roomTypes';
import {
    createDateKey,
    createDateTimeFromDateKeyAndMinute,
    getMinutesFromDateTime,
} from '$lib/utils/helpers/calendarHelpers';
import { MIN_BOOKING_MINUTES } from '$lib/utils/helpers/bookingHelpers';

const TIME_STEP_MINUTES = 15;
const DAY_MINUTES = 24 * 60;

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function clampMinuteOfDay(minuteOfDay: number) {
    return Math.max(0, Math.min(DAY_MINUTES - TIME_STEP_MINUTES, minuteOfDay));
}

export function getCurrentMinuteOfDay(now = new Date()) {
    return now.getHours() * 60 + now.getMinutes();
}

function getMinimumSelectableMinute(dateKey: string, now = new Date()) {
    if (dateKey !== createDateKey(now)) {
        return 0;
    }

    const minutes = getCurrentMinuteOfDay(now);
    return Math.min(DAY_MINUTES, Math.ceil(minutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES);
}

export function getMeetingIdentity(meeting: Meeting) {
    return `${meeting.startDate}|${meeting.endDate}|${meeting.organizer}`;
}

export function mergeMeetings(...groups: Meeting[][]) {
    const merged = new Map<string, Meeting>();

    for (const group of groups) {
        for (const meeting of group) {
            merged.set(getMeetingIdentity(meeting), meeting);
        }
    }

    return Array.from(merged.values()).sort(
        (left, right) =>
            new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
    );
}

export function getAvailableMinutesAtStart(
    dateKey: string,
    startMinuteOfDay: number | null,
    meetings: Meeting[],
    now = new Date()
) {
    if (startMinuteOfDay == null || startMinuteOfDay < 0 || startMinuteOfDay >= DAY_MINUTES) {
        return 0;
    }

    const minimumSelectableMinute =
        dateKey === createDateKey(now) ? getCurrentMinuteOfDay(now) : 0;
    if (startMinuteOfDay < minimumSelectableMinute) {
        return 0;
    }

    let availableMinutes = DAY_MINUTES - startMinuteOfDay;

    for (const meeting of meetings) {
        const meetingStart = getMinutesFromDateTime(meeting.startDate);
        const meetingEnd = getMinutesFromDateTime(meeting.endDate);

        if (meetingStart <= startMinuteOfDay && startMinuteOfDay < meetingEnd) {
            return 0;
        }

        if (meetingStart > startMinuteOfDay) {
            availableMinutes = Math.min(availableMinutes, meetingStart - startMinuteOfDay);
        }
    }

    return availableMinutes >= MIN_BOOKING_MINUTES ? availableMinutes : 0;
}

export function getValidStartMinutes(dateKey: string, meetings: Meeting[], now = new Date()) {
    const minimumSelectableMinute = getMinimumSelectableMinute(dateKey, now);
    const validMinutes: number[] = [];

    for (let minuteOfDay = minimumSelectableMinute; minuteOfDay < DAY_MINUTES; minuteOfDay += TIME_STEP_MINUTES) {
        if (getAvailableMinutesAtStart(dateKey, minuteOfDay, meetings, now) >= MIN_BOOKING_MINUTES) {
            validMinutes.push(minuteOfDay);
        }
    }

    return validMinutes;
}

export function getNearestValidStartMinute(
    requestedMinuteOfDay: number,
    validStartMinutes: number[]
) {
    if (validStartMinutes.length === 0) {
        return null;
    }

    const clampedMinute = clampMinuteOfDay(requestedMinuteOfDay);

    return validStartMinutes.reduce((closestMinute, currentMinute) => {
        if (closestMinute === null) {
            return currentMinute;
        }

        const currentDistance = Math.abs(currentMinute - clampedMinute);
        const closestDistance = Math.abs(closestMinute - clampedMinute);

        if (currentDistance < closestDistance) {
            return currentMinute;
        }

        if (currentDistance === closestDistance && currentMinute < closestMinute) {
            return currentMinute;
        }

        return closestMinute;
    }, null as number | null);
}

export function formatMinuteOfDay(minuteOfDay: number) {
    const date = createDateTimeFromDateKeyAndMinute('2000-01-01', minuteOfDay);
    return new Intl.DateTimeFormat('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

export function createMeetingFromSelection(
    dateKey: string,
    startMinuteOfDay: number,
    durationMinutes: number,
    organizer: string
): Meeting {
    const startDate = createDateTimeFromDateKeyAndMinute(dateKey, startMinuteOfDay);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    return {
        startDate: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}T${pad(startDate.getHours())}:${pad(startDate.getMinutes())}:00`,
        endDate: `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`,
        organizer,
    };
}

export function getNearbyValidStartMinutes(
    dateKey: string,
    selectedStartMinuteOfDay: number | null,
    meetings: Meeting[],
    now = new Date()
) {
    if (selectedStartMinuteOfDay == null) {
        return [];
    }

    const selectedIsValid =
        getAvailableMinutesAtStart(dateKey, selectedStartMinuteOfDay, meetings, now) >=
        MIN_BOOKING_MINUTES;

    if (!selectedIsValid) {
        return [];
    }

    const validStartMinutes = getValidStartMinutes(dateKey, meetings, now);
    const sortedMinutes = Array.from(
        new Set([...validStartMinutes, selectedStartMinuteOfDay])
    ).sort((left, right) => left - right);
    const selectedIndex = sortedMinutes.indexOf(selectedStartMinuteOfDay);
    const nearbyMinutes = [selectedStartMinuteOfDay];
    let previousIndex = selectedIndex - 1;
    let nextIndex = selectedIndex + 1;

    while (nearbyMinutes.length < 5 && (previousIndex >= 0 || nextIndex < sortedMinutes.length)) {
        if (previousIndex >= 0) {
            nearbyMinutes.push(sortedMinutes[previousIndex]);
            previousIndex -= 1;
        }

        if (nearbyMinutes.length >= 5) {
            break;
        }

        if (nextIndex < sortedMinutes.length) {
            nearbyMinutes.push(sortedMinutes[nextIndex]);
            nextIndex += 1;
        }
    }

    return nearbyMinutes.sort((left, right) => left - right);
}

export function getMeetingByIdentity(meetings: Meeting[], meetingIdentity: string | null) {
    if (!meetingIdentity) {
        return null;
    }

    return meetings.find((meeting) => getMeetingIdentity(meeting) === meetingIdentity) ?? null;
}

export function getSnappedMinuteOfDayFromOffset(offsetY: number, hourHeight: number) {
    const minuteOfDay = Math.round((offsetY / hourHeight) * 60 / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
    return clampMinuteOfDay(minuteOfDay);
}
