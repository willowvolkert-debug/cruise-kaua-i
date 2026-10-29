import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIDE_TOWNS } from "@/components/notifications/notificationOptions";

export default function TownSelect({ value, onChange, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-14 text-lg"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {Object.values(SIDE_TOWNS).flat().map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}