import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Bell, Calendar, ChevronLeft, ChevronRight, X, CheckCircle } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfToday } from "date-fns";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function MultiDateCalendar({ selectedDates, onToggleDate }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const today = startOfToday();

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPad = monthStart.getDay();
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const isSelected = (day) => {
    const str = format(day, "yyyy-MM-dd");
    return selectedDates.includes(str);
  };

  const isPast = (day) => isBefore(day, today);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-secondary text-sm">{format(viewMonth, "MMMM yyyy")}</span>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
        {paddedDays.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const past = isPast(day);
          const selected = isSelected(day);
          return (
            <button
              key={format(day, "yyyy-MM-dd")}
              type="button"
              disabled={past}
              onClick={() => !past && onToggleDate(format(day, "yyyy-MM-dd"))}
              className={`
                text-xs py-1.5 rounded-lg font-medium transition-colors
                ${past ? "text-gray-300 cursor-not-allowed" : ""}
                ${selected ? "bg-primary text-white" : !past ? "hover:bg-orange-100 text-gray-700" : ""}
                ${isToday(day) && !selected ? "ring-1 ring-primary text-primary" : ""}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyCalendarPicker({ selectedDay, onSelectDay }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();
  const paddedDays = [...Array(startPad).fill(null), ...days];

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-600">which day of the month should this ride post?</Label>
      <div className="border border-gray-200 rounded-2xl p-3 bg-white">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="font-semibold text-secondary text-sm">{format(viewMonth, "MMMM yyyy")}</span>
          <button
            type="button"
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {paddedDays.map((day, idx) => {
            if (!day) return <div key={`pad-${idx}`} />;
            const dayNum = day.getDate();
            const selected = selectedDay === dayNum;
            const today = isToday(day);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectDay(dayNum)}
                className={`
                  py-1.5 rounded-xl text-sm font-medium transition-colors
                  ${selected ? "bg-primary text-white" : "text-gray-700 hover:bg-orange-100"}
                  ${today && !selected ? "ring-1 ring-primary text-primary" : ""}
                `}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
      {selectedDay && (
        <p className="text-xs text-gray-500">
          This ride will auto-post on the <strong>{selectedDay}{selectedDay === 1 ? "st" : selectedDay === 2 ? "nd" : selectedDay === 3 ? "rd" : "th"}</strong> of each month.
        </p>
      )}
    </div>
  );
}

export default function RecurringAutoPostModal({ isOpen, onClose, trip, existingSchedule }) {
  const [scheduleType, setScheduleType] = useState("weekly");
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [specificDates, setSpecificDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingSchedule) {
      setScheduleType(existingSchedule.schedule_type || "weekly");
      setWeeklyDays(existingSchedule.weekly_days || []);
      setMonthlyDay(existingSchedule.monthly_day || 1);
      setSpecificDates(existingSchedule.specific_dates || []);
    } else {
      setScheduleType("weekly");
      setWeeklyDays([]);
      setMonthlyDay(1);
      setSpecificDates([]);
    }
    setSuccess(false);
  }, [existingSchedule, isOpen]);

  const toggleWeeklyDay = (dayIndex) => {
    setWeeklyDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const toggleSpecificDate = (dateStr) => {
    setSpecificDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSave = async () => {
    if (!trip) return;
    if (scheduleType === "weekly" && weeklyDays.length === 0) {
      alert("Please select at least one day of the week.");
      return;
    }
    if (scheduleType === "specific_dates" && specificDates.length === 0) {
      alert("Please select at least one date.");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const payload = {
        user_id: user.id,
        recurring_trip_id: trip.id,
        trip_name: trip.trip_name,
        schedule_type: scheduleType,
        weekly_days: scheduleType === "weekly" ? weeklyDays : [],
        monthly_day: scheduleType === "monthly" ? monthlyDay : null,
        specific_dates: scheduleType === "specific_dates" ? specificDates : [],
        is_active: true
      };

      if (existingSchedule) {
        await base44.entities.RecurringSchedule.update(existingSchedule.id, payload);
      } else {
        await base44.entities.RecurringSchedule.create(payload);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Error saving schedule. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-secondary">
            auto-post: {trip?.trip_name}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-semibold text-secondary text-lg">schedule saved!</p>
            <p className="text-gray-600 text-sm">your ride will be auto-posted based on your schedule. you'll get a confirmation email 48 hours before each posting.</p>
            <Button onClick={onClose} className="rounded-2xl bg-primary">done</Button>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Schedule Type */}
            <div className="space-y-2">
              <Label className="font-semibold">how often should this ride auto-post?</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">weekly (pick days of the week)</SelectItem>
                  <SelectItem value="monthly">monthly (pick a day of the month)</SelectItem>
                  <SelectItem value="specific_dates">specific dates (pick from calendar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weekly picker */}
            {scheduleType === "weekly" && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">select which days to auto-post</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_FULL.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeeklyDay(idx)}
                      className={`px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors border ${
                        weeklyDays.includes(idx)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-orange-50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly picker */}
            {scheduleType === "monthly" && (
              <MonthlyCalendarPicker selectedDay={monthlyDay} onSelectDay={setMonthlyDay} />
            )}

            {/* Specific dates calendar */}
            {scheduleType === "specific_dates" && (
              <div className="space-y-3">
                <Label className="text-sm text-gray-600">tap dates to select/deselect</Label>
                <MultiDateCalendar
                  selectedDates={specificDates}
                  onToggleDate={toggleSpecificDate}
                />
                {specificDates.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {specificDates.sort().map(d => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="bg-orange-50 border-orange-200 text-orange-700 text-xs flex items-center gap-1"
                      >
                        {format(new Date(d + "T00:00:00"), "MMM d")}
                        <button type="button" onClick={() => toggleSpecificDate(d)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 48hr confirmation notice */}
            <Alert className="rounded-2xl border-blue-200 bg-blue-50">
              <Bell className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>heads up:</strong> you'll receive an email 48 hours before each auto-posted ride. you must confirm the ride via email or in the app, or it will be automatically deleted.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl">cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="rounded-2xl bg-primary">
                {loading ? "saving..." : existingSchedule ? "update schedule" : "save schedule"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}