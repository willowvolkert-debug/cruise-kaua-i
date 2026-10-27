import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A date picker that displays a friendly label like "June 5th"
 * and opens a calendar popover. Value/onChange use "yyyy-MM-dd" strings.
 * The popover closes automatically when a date is selected, giving
 * immediate visual feedback.
 */
export default function DatePickerButton({ value, onChange, placeholder = "pick a date", className = "" }) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : null;

  const label = selectedDate
    ? format(selectedDate, "MMMM do")
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-semibold rounded-2xl h-12 border-2 border-gray-200 bg-white hover:border-primary focus:border-primary transition-colors", !label ? "text-gray-400 font-normal" : "text-gray-800", className)}
        >
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
          {label || placeholder}
          {label && <Check className="w-4 h-4 ml-auto text-primary shrink-0" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}