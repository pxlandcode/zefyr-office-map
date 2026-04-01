import { writable } from 'svelte/store';

type CalendarInfoPopupOptions = {
	title?: string;
	width?: string;
};

export type CalendarInfoPopupState = {
	open: boolean;
	options: Required<CalendarInfoPopupOptions>;
};

const defaultOptions: Required<CalendarInfoPopupOptions> = {
	title: 'Så fungerar systemet',
	width: '520px'
};

const initialState: CalendarInfoPopupState = {
	open: false,
	options: { ...defaultOptions }
};

export const calendarInfoPopup = writable<CalendarInfoPopupState>(initialState);

export function openCalendarInfoPopup(options: CalendarInfoPopupOptions = {}) {
	calendarInfoPopup.set({
		open: true,
		options: { ...defaultOptions, ...options }
	});
}

export function closeCalendarInfoPopup() {
	calendarInfoPopup.set({ ...initialState });
}
