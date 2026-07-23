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

/**
 * Normalize server-returned datetime strings to UTC.
 *
 * The platform stores built-in fields (created_date, updated_date) as naive
 * ISO datetimes WITHOUT a timezone designator, e.g.
 *   "2026-07-23T15:37:16.345000"
 * Per the ECMAScript spec, new Date() parses a timezone-less datetime string
 * as the browser's LOCAL time. For an admin in Hawai'i that means the value is
 * read as HST wall-clock, and the Intl Pacific/Honolulu conversion then
 * shifts it again — producing a time ~10 hours in the future.
 *
 * App-generated timestamps (e.g. chat message timestamps) already carry a "Z"
 * and are left untouched.
 */
const toUTCString = (dateInput) => {
    if (typeof dateInput !== "string") return dateInput;
    const s = dateInput.trim();
    // ISO datetime with no timezone designator (no trailing Z and no ±HH:MM offset)
    if (s.includes("T") && !s.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(s)) {
        return s + "Z";
    }
    return s;
};

export const toHST = (dateInput) => {
    const utcMs = new Date(toUTCString(dateInput)).getTime();
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
    for (const p of dtf.formatToParts(new Date(toUTCString(dateInput)))) {
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