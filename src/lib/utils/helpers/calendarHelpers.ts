import { format } from 'date-fns';

const swedishWeekdaysShort = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function cloneDateAtStartOfDay(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function getDateParts(dateTime: string | Date) {
    if (dateTime instanceof Date) {
        return {
            year: dateTime.getFullYear(),
            month: dateTime.getMonth() + 1,
            day: dateTime.getDate(),
            hours: dateTime.getHours(),
            minutes: dateTime.getMinutes(),
        };
    }

    const localDateTimeMatch = dateTime.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
    );

    if (localDateTimeMatch) {
        return {
            year: Number(localDateTimeMatch[1]),
            month: Number(localDateTimeMatch[2]),
            day: Number(localDateTimeMatch[3]),
            hours: Number(localDateTimeMatch[4]),
            minutes: Number(localDateTimeMatch[5]),
        };
    }

    const fallback = new Date(dateTime);
    return {
        year: fallback.getFullYear(),
        month: fallback.getMonth() + 1,
        day: fallback.getDate(),
        hours: fallback.getHours(),
        minutes: fallback.getMinutes(),
    };
}

function createDateKey(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey: string) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toDateKeyFromDateTime(dateTime: string | Date) {
    const parts = getDateParts(dateTime);
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function addDays(date: Date, amount: number) {
    const next = cloneDateAtStartOfDay(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function getStartOfWeekMonday(date: Date) {
    const next = cloneDateAtStartOfDay(date);
    const dayOffset = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - dayOffset);
    return next;
}

function getWeekDates(date: Date) {
    const start = getStartOfWeekMonday(date);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function isSameDay(left: Date, right: Date) {
    return createDateKey(left) === createDateKey(right);
}

function isToday(date: Date) {
    return isSameDay(date, new Date());
}

function formatWeekdayShort(date: Date) {
    return swedishWeekdaysShort[(date.getDay() + 6) % 7];
}

function formatDayNumber(date: Date) {
    return new Intl.DateTimeFormat('sv-SE', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}

function formatDayOfMonth(date: Date) {
    return new Intl.DateTimeFormat('sv-SE', {
        day: 'numeric',
    }).format(date);
}

function formatSelectedDayLabel(date: Date) {
    if (isToday(date)) {
        return `idag, ${new Intl.DateTimeFormat('sv-SE', {
            day: 'numeric',
            month: 'long',
        }).format(date)}`;
    }

    return new Intl.DateTimeFormat('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(date);
}

function formatWeekHeaderLabel(date: Date) {
    if (isToday(date)) {
        return `idag, ${formatDayNumber(date)}`;
    }

    return `${formatWeekdayShort(date)} ${formatDayNumber(date)}`;
}

// Calculates the top offset for a meeting start time in pixels
function getTopOffset(startDate: string, startHour: number, hourHeight: number) {
    const start = getDateParts(startDate);
    const startHourMinutes = (start.hours - startHour) * 60 + start.minutes;
    return (startHourMinutes / 60) * hourHeight;
}

// Calculates the height of a meeting based on its duration in minutes, using hour height as reference
function getMeetingHeight(startDate: string, endDate: string, hourHeight: number) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60); // duration in minutes
    return (durationMinutes / 60) * hourHeight;
}

// Calculates the top offset for the current time in pixels
function getCurrentTimeOffset(startHour: number, hourHeight: number) {
    const now = new Date();
    const totalMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
    return (totalMinutes / 60) * hourHeight;
}

function formatTime(date: string) {
    const dateParts = getDateParts(date);
    const dateObj = new Date(
        dateParts.year,
        dateParts.month - 1,
        dateParts.day,
        dateParts.hours,
        dateParts.minutes
    );
    return format(dateObj, 'HH:mm');
}

function formatTimeInHoursAndMinutes(minutes: number, short: boolean = false) {
    minutes = minutes + 1; // Add 1 minute to round up
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
        return `${hours} timm${hours > 1 ? 'ar' : 'e'}, ${remainingMinutes} minuter`;
    } else if (hours > 0) {
        return `${hours} timm${hours > 1 ? 'ar' : 'e'}`;
    } else {
        return `${remainingMinutes} minuter`;
    }
}

export {
    addDays,
    cloneDateAtStartOfDay,
    createDateKey,
    formatDayOfMonth,
    formatDayNumber,
    formatSelectedDayLabel,
    formatWeekHeaderLabel,
    formatWeekdayShort,
    getTopOffset,
    getMeetingHeight,
    getCurrentTimeOffset,
    getStartOfWeekMonday,
    getWeekDates,
    isSameDay,
    isToday,
    parseDateKey,
    toDateKeyFromDateTime,
    formatTime,
    formatTimeInHoursAndMinutes,
};
