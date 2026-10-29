import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIDE_TOWNS, SIDE_LABELS } from "@/components/notifications/notificationOptions";

export default function TownSelect({ value, onChange, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-14 text-lg"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {Object.entries(SIDE_TOWNS).map(([side, towns]) => (
          <SelectGroup key={side}>
            <SelectLabel>{SIDE_LABELS[side]}</SelectLabel>
            {towns.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}