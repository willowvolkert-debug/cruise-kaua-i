/**
 * Format a UTC timestamp (ISO string or Date) as Hawaii Standard Time (UTC-10).
 *
 * Uses Intl with timeZone 'Pacific/Honolulu' so the result is correct regardless
 * of the browser's local timezone (the previous implementation shifted the epoch
 * and let date-fns read it in the browser's local TZ, which double-applied the
 * offset for users in Hawai'i — e.g. a 2:39 PM message showed as 4:39 AM).
 *
 * Supports the format tokens used in the app:
 *   "MMM d, h:mm a"  ->  "Jul 21, 4:39 PM"
 *   "MMM d, yyyy"    ->  "Jul 21, 2026"
 */
import { format } from "date-fns";

const HST_OFFSET_MS = 10 * 60 * 60 * 1000;

export const toHST = (dateInput) => {
    const utcMs = new Date(dateInput).getTime();
    return new Date(utcMs - HST_OFFSET_MS);
};

const getHSTParts = (dateInput) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: "Pacific/Honolulu",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        year: "numeric",
    });
    const parts = {};
    for (const p of dtf.formatToParts(new Date(dateInput))) {
        parts[p.type] = p.value;
    }
    return parts;
};

export const formatHST = (dateInput, formatStr) => {
    if (!dateInput) return "";

    if (formatStr === "MMM d, h:mm a") {
        const p = getHSTParts(dateInput);
        return `${p.month} ${p.day}, ${p.hour}:${p.minute} ${p.dayPeriod || (Number(p.hour) >= 12 ? "PM" : "AM")}`;
    }
    if (formatStr === "MMM d, yyyy") {
        const p = getHSTParts(dateInput);
        return `${p.month} ${p.day}, ${p.year}`;
    }

    // Fallback for any other format string (legacy behavior)
    return format(toHST(dateInput), formatStr);
};