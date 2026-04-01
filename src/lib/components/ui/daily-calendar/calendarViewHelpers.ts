import type {
    CalendarDayColumn,
    CalendarMode,
    CalendarModeOption,
    CalendarTransitionVariant,
} from '$lib/types/calendarTypes';
import type { Meeting } from '$lib/types/roomTypes';
import {
    addDays,
    createDateKey,
    formatDayNumber,
    getStartOfWeekMonday,
    isToday,
    parseDateKey,
    toDateKeyFromDateTime,
} from '$lib/utils/helpers/calendarHelpers';
import { getMeetingIdentity, mergeMeetings } from '$lib/utils/helpers/bookingSelectionHelpers';

export const START_HOUR = 0;
export const TOTAL_HOURS = 24;
export const HOUR_HEIGHT = 60;
export const TIME_GUTTER_WIDTH = 64;
export const DAY_COLUMN_WIDTH = 320;
export const DEFAULT_WEEK_COLUMN_WIDTH = 208;
export const MIN_WEEK_COLUMN_WIDTH = 152;
export const TRACK_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
export const MEETING_HORIZONTAL_INSET = 8;
export const SWIPE_THRESHOLD = 56;
export const SWIPE_AXIS_LOCK_THRESHOLD = 14;
export const HOURS = Array.from({ length: TOTAL_HOURS }, (_, index) => index);

export const MODE_OPTIONS: CalendarModeOption[] = [
    { value: 'day', label: 'Dag' },
    { value: 'week', label: 'Vecka' },
];

type WeekCache = Map<string, Meeting[]>;

interface GetMeetingsForDateArgs {
    dateKey: string;
    cachedWeeks: WeekCache;
    todaysMeetings: Meeting[];
    optimisticMeetings?: Meeting[];
    hiddenMeetingIdentities?: string[];
    todayDateKey: string;
}

interface CreateDayColumnsArgs {
    dateKeys: string[];
    mode: CalendarMode;
    weekColumnWidth: number;
    cachedWeeks: WeekCache;
    todaysMeetings: Meeting[];
    optimisticMeetings?: Meeting[];
    hiddenMeetingIdentities?: string[];
    todayDateKey: string;
}

export function getWeekKeyForDate(dateKey: string) {
    return createDateKey(getStartOfWeekMonday(parseDateKey(dateKey)));
}

export function getWeekDistance(fromDateKey: string, toDateKey: string) {
    const fromWeekStart = parseDateKey(getWeekKeyForDate(fromDateKey));
    const toWeekStart = parseDateKey(getWeekKeyForDate(toDateKey));
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return Math.round((toWeekStart.getTime() - fromWeekStart.getTime()) / weekMs);
}

export function getMeetingsForDate({
    dateKey,
    cachedWeeks,
    todaysMeetings,
    optimisticMeetings = [],
    hiddenMeetingIdentities = [],
    todayDateKey,
}: GetMeetingsForDateArgs) {
    const hiddenMeetingIdentitySet = new Set(hiddenMeetingIdentities);
    const weekMeetings = cachedWeeks.get(getWeekKeyForDate(dateKey));
    const optimisticDayMeetings = optimisticMeetings.filter(
        (meeting) => toDateKeyFromDateTime(meeting.startDate) === dateKey
    );
    const filterHiddenMeetings = (meetings: Meeting[]) =>
        meetings.filter((meeting) => !hiddenMeetingIdentitySet.has(getMeetingIdentity(meeting)));

    if (weekMeetings) {
        return filterHiddenMeetings(
            mergeMeetings(
            weekMeetings.filter((meeting) => toDateKeyFromDateTime(meeting.startDate) === dateKey),
            optimisticDayMeetings
            )
        );
    }

    if (dateKey === todayDateKey) {
        return filterHiddenMeetings(mergeMeetings(todaysMeetings, optimisticDayMeetings));
    }

    return filterHiddenMeetings(optimisticDayMeetings);
}

export function getSelectedWeekLabel(weekStartKey: string) {
    const weekStart = parseDateKey(weekStartKey);
    const weekEnd = addDays(weekStart, 6);
    return `${formatDayNumber(weekStart)} till ${formatDayNumber(weekEnd)}`;
}

export function getWeekColumnWidth(weekViewportWidth: number) {
    if (weekViewportWidth <= 0) {
        return DEFAULT_WEEK_COLUMN_WIDTH;
    }

    return Math.max(
        MIN_WEEK_COLUMN_WIDTH,
        Math.min(DEFAULT_WEEK_COLUMN_WIDTH, Math.floor(weekViewportWidth / 7))
    );
}

export function createDayColumns({
    dateKeys,
    mode,
    weekColumnWidth,
    cachedWeeks,
    todaysMeetings,
    optimisticMeetings = [],
    hiddenMeetingIdentities = [],
    todayDateKey,
}: CreateDayColumnsArgs): CalendarDayColumn[] {
    return dateKeys.map((dateKey, index) => {
        const date = parseDateKey(dateKey);
        const width = mode === 'week' ? weekColumnWidth : DAY_COLUMN_WIDTH;

        return {
            dateKey,
            date,
            width,
            left: index * width,
            isToday: isToday(date),
            meetings: getMeetingsForDate({
                dateKey,
                cachedWeeks,
                todaysMeetings,
                optimisticMeetings,
                hiddenMeetingIdentities,
                todayDateKey,
            }),
        };
    });
}

export function getContainerFlyOffset(variant: CalendarTransitionVariant) {
    switch (variant) {
        case 'expand':
            return 72;
        case 'collapse':
            return -72;
        case 'forward':
            return 48;
        case 'backward':
            return -48;
    }
}

export function getDayPaneFlyOffset(
    variant: CalendarTransitionVariant,
    dayViewportWidth: number
) {
    const distance = Math.max(dayViewportWidth, DAY_COLUMN_WIDTH);

    switch (variant) {
        case 'forward':
            return distance;
        case 'backward':
            return -distance;
        default:
            return 0;
    }
}

export function getWeekPaneFlyOffset(
    variant: CalendarTransitionVariant,
    weekViewportWidth: number
) {
    const distance = Math.max(weekViewportWidth, DEFAULT_WEEK_COLUMN_WIDTH * 4);

    switch (variant) {
        case 'forward':
            return distance;
        case 'backward':
            return -distance;
        default:
            return 0;
    }
}
