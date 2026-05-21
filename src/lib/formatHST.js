/**
 * Format a UTC timestamp (ISO string or Date) as Hawaii Standard Time (UTC-10).
 * Usage: formatHST(dateStr, "MMM d, h:mm a")
 */
import { format } from "date-fns";

// Hawaii is always UTC-10 (no daylight saving)
const HST_OFFSET_MS = 10 * 60 * 60 * 1000;

export const toHST = (dateInput) => {
    const utcMs = new Date(dateInput).getTime();
    return new Date(utcMs - HST_OFFSET_MS);
};

export const formatHST = (dateInput, formatStr) => {
    if (!dateInput) return '';
    return format(toHST(dateInput), formatStr);
};