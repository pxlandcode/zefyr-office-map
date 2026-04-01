import type { Meeting } from './roomTypes';

export type CalendarMode = 'day' | 'week';
export type CalendarTransitionVariant = 'expand' | 'collapse' | 'forward' | 'backward';
export type CalendarSelectionSource = 'day' | 'week';

export interface CalendarModeOption {
    value: CalendarMode;
    label: string;
}

export interface CalendarDayColumn {
    dateKey: string;
    date: Date;
    width: number;
    left: number;
    isToday: boolean;
    meetings: Meeting[];
}

export interface RoomCalendarResponse {
    roomEmail: string;
    startDate: string;
    endDate: string;
    meetings: Meeting[];
}

export interface CalendarSelectionChangeDetail {
    dateKey: string;
    isToday: boolean;
    mode: CalendarMode;
    meetings: Meeting[];
    meetingsLoaded: boolean;
}

export interface CalendarSlotSelection {
    dateKey: string;
    requestedMinuteOfDay: number;
    startMinuteOfDay: number;
    source: CalendarSelectionSource;
}

export interface CalendarMeetingSelection {
    dateKey: string;
    meeting: Meeting;
    meetingIdentity: string;
    source: CalendarSelectionSource;
}
