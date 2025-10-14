import { format } from 'date-fns';

// Calculates the top offset for a meeting start time in pixels
function getTopOffset(startDate: string, startHour: number, hourHeight: number) {
    const start = new Date(startDate);
    const startHourMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
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
    const dateObj = new Date(date);
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
    getTopOffset,
    getMeetingHeight,
    getCurrentTimeOffset,
    formatTime,
    formatTimeInHoursAndMinutes,
};
