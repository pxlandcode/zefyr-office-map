import type { Meeting } from './roomTypes';

export type CalendarMode = 'day' | 'week';
export type CalendarTransitionVariant = 'expand' | 'collapse' | 'forward' | 'backward';

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
