import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getClient } from '$lib/server/msgraph';
import { rooms } from '$lib/server/config/rooms';
import { getRoomEvents, normalizeCalendarEvents } from '$lib/server/helpers/meeting';
import { getRoomDisplayName } from '$lib/server/helpers/roomUtils';
import { REQUIRE_AUTH } from '$env/static/private';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { FreeSlot } from '$lib/types/roomTypes';

const TIME_ZONE = 'Europe/Stockholm';
const WORK_START_HOUR = 7;
const WORK_END_HOUR = 18;
const MAX_RANGE_DAYS = 7;

interface TimeInterval {
	start: number;
	end: number;
}

function computeFreeSlots(
	meetings: { startDate: string; endDate: string }[],
	dateKey: string,
	minDurationMs: number,
	now: Date
): { start: Date; end: Date }[] {
	const windowStartDate = fromZonedTime(
		`${dateKey}T${String(WORK_START_HOUR).padStart(2, '0')}:00:00`,
		TIME_ZONE
	);
	const windowEndDate = fromZonedTime(
		`${dateKey}T${String(WORK_END_HOUR).padStart(2, '0')}:00:00`,
		TIME_ZONE
	);

	let windowStart = windowStartDate.getTime();
	const windowEnd = windowEndDate.getTime();

	const todayKey = formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd');
	if (dateKey === todayKey) {
		const fiveMin = 5 * 60 * 1000;
		const rounded = Math.ceil(now.getTime() / fiveMin) * fiveMin;
		windowStart = Math.max(windowStart, rounded);
	}

	if (windowStart >= windowEnd) return [];

	const occupied: TimeInterval[] = meetings
		.map((m) => ({
			start: Math.max(new Date(m.startDate).getTime(), windowStart),
			end: Math.min(new Date(m.endDate).getTime(), windowEnd),
		}))
		.filter((i) => i.start < i.end)
		.sort((a, b) => a.start - b.start);

	const merged: TimeInterval[] = [];
	for (const interval of occupied) {
		const last = merged[merged.length - 1];
		if (last && interval.start <= last.end) {
			last.end = Math.max(last.end, interval.end);
		} else {
			merged.push({ ...interval });
		}
	}

	const gaps: { start: Date; end: Date }[] = [];
	let cursor = windowStart;

	for (const interval of merged) {
		if (cursor < interval.start) {
			const gapMs = interval.start - cursor;
			if (gapMs >= minDurationMs) {
				gaps.push({ start: new Date(cursor), end: new Date(interval.start) });
			}
		}
		cursor = Math.max(cursor, interval.end);
	}

	if (cursor < windowEnd) {
		const gapMs = windowEnd - cursor;
		if (gapMs >= minDurationMs) {
			gaps.push({ start: new Date(cursor), end: new Date(windowEnd) });
		}
	}

	return gaps;
}

function dateKeysInRange(startDate: string, endDate: string): string[] {
	const keys: string[] = [];
	const current = new Date(startDate + 'T00:00:00');
	const end = new Date(endDate + 'T00:00:00');
	while (current <= end) {
		keys.push(current.toISOString().slice(0, 10));
		current.setDate(current.getDate() + 1);
	}
	return keys;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	if (REQUIRE_AUTH === 'true' && !locals.session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');
	const minDurationParam = url.searchParams.get('minDuration');

	if (!startDate || !endDate || !minDurationParam) {
		return new Response('Missing required query parameters: startDate, endDate, minDuration', {
			status: 400,
		});
	}

	const minDuration = parseInt(minDurationParam, 10);
	if (isNaN(minDuration) || minDuration <= 0) {
		return new Response('minDuration must be a positive integer', { status: 400 });
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
		return new Response('Dates must be in YYYY-MM-DD format', { status: 400 });
	}

	if (startDate > endDate) {
		return json({ slots: [], searchRange: { start: startDate, end: endDate }, minDuration });
	}

	const dayCount =
		(new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) /
			(24 * 60 * 60 * 1000) +
		1;
	if (dayCount > MAX_RANGE_DAYS) {
		return new Response(`Date range must not exceed ${MAX_RANGE_DAYS} days`, { status: 400 });
	}

	try {
		const client = await getClient();
		const now = new Date();
		const minDurationMs = minDuration * 60 * 1000;
		const dateKeys = dateKeysInRange(startDate, endDate);

		const rangeStart = fromZonedTime(`${startDate}T00:00:00`, TIME_ZONE);
		const rangeEnd = fromZonedTime(`${endDate}T23:59:59`, TIME_ZONE);

		const roomResults = await Promise.allSettled(
			rooms.map(async (room) => {
				const events = await getRoomEvents(client, room.email, rangeStart, rangeEnd);
				const normalized = normalizeCalendarEvents(events);

				const eventsByDate = new Map<string, typeof normalized>();
				for (const event of normalized) {
					const key = event.startDate.slice(0, 10);
					if (!eventsByDate.has(key)) eventsByDate.set(key, []);
					eventsByDate.get(key)!.push(event);
				}

				const roomSlots: FreeSlot[] = [];
				for (const dateKey of dateKeys) {
					const dayEvents = eventsByDate.get(dateKey) ?? [];
					const freeGaps = computeFreeSlots(dayEvents, dateKey, minDurationMs, now);
					for (const gap of freeGaps) {
						roomSlots.push({
							roomName: getRoomDisplayName(room.email),
							roomEmail: room.email,
							capacity: room.capacity,
							start: formatInTimeZone(gap.start, TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss"),
							end: formatInTimeZone(gap.end, TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss"),
							durationMinutes: Math.round(
								(gap.end.getTime() - gap.start.getTime()) / 60000
							),
						});
					}
				}
				return roomSlots;
			})
		);

		const allSlots: FreeSlot[] = [];
		for (const result of roomResults) {
			if (result.status === 'fulfilled') {
				allSlots.push(...result.value);
			}
		}

		allSlots.sort((a, b) => a.start.localeCompare(b.start));

		return json({ slots: allSlots, searchRange: { start: startDate, end: endDate }, minDuration });
	} catch (error: any) {
		console.error('Fel vid sökning av lediga rum:', error);
		return new Response('Fel vid sökning av lediga rum', { status: 500 });
	}
};
