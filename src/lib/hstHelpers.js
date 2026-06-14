// Shared Hawaii time helpers — used by Inbox, ConfirmedRides, and any page needing HST-aware date/time parsing

// Parse a "YYYY-MM-DD" date string without timezone shift (treats it as Hawaii local)
export const parseDateString = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Parse time strings in various formats (e.g., "19:30", "7:30pm", "730pm")
export const parseTimeString = (timeStr) => {
  if (!timeStr) return { hours: 23, minutes: 59 };
  const normalized = timeStr.toLowerCase().trim();

  if (normalized.includes(':')) {
    const [h, m] = normalized.replace(/[ap]m/i, '').split(':').map(Number);
    let hours = h;
    if (normalized.includes('pm') && hours < 12) hours += 12;
    if (normalized.includes('am') && hours === 12) hours = 0;
    return { hours, minutes: m || 0 };
  }

  const match = normalized.match(/^(\d{1,4})(am|pm)?$/);
  if (match) {
    const numPart = match[1];
    const period = match[2];
    let hours, minutes;
    if (numPart.length <= 2) { hours = parseInt(numPart); minutes = 0; }
    else if (numPart.length === 3) { hours = parseInt(numPart[0]); minutes = parseInt(numPart.substring(1)); }
    else { hours = parseInt(numPart.substring(0, 2)); minutes = parseInt(numPart.substring(2)); }
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return { hours, minutes };
  }
  return { hours: 23, minutes: 59 };
};

// Get current Hawaii time as a comparable object (UTC-10)
export const getHawaiiNow = () => {
  const now = new Date();
  const hawaiiTime = new Date(now.getTime() - (10 * 60 * 60 * 1000));
  return {
    year: hawaiiTime.getUTCFullYear(),
    month: hawaiiTime.getUTCMonth() + 1,
    day: hawaiiTime.getUTCDate(),
    hour: hawaiiTime.getUTCHours(),
    minute: hawaiiTime.getUTCMinutes(),
    toComparable: function() {
      return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute;
    }
  };
};

// Parse a ride's date+time into a comparable HST object
export const parseRideDateTimeHST = (dateStr, timeStr) => {
  if (!dateStr) return { toComparable: () => 0, addHours: () => ({ toComparable: () => 0 }) };
  const [year, month, day] = dateStr.split('-').map(Number);
  const { hours, minutes } = parseTimeString(timeStr);

  const addHours = function(h) {
    let newHour = hours + h;
    let newDay = day;
    let newMonth = month;
    let newYear = year;
    while (newHour >= 24) { newHour -= 24; newDay++; }
    return {
      year: newYear, month: newMonth, day: newDay, hour: newHour, minute: minutes,
      toComparable: function() { return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute; }
    };
  };

  return {
    year, month, day, hour: hours, minute: minutes,
    toComparable: function() { return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute; },
    addHours
  };
};

// Convert 24-hour time to 12-hour format with AM/PM
export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};