import React from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ISLAND_KEYS, ISLAND_MAP, getIsland, switchIsland } from "@/lib/island";

export default function IslandSwitcher() {
  const current = getIsland();

  const choose = async (island) => {
    if (island === current) return;
    await base44.auth.updateMe({ preferred_island: island }).catch(() => {});
    switchIsland(island);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-0.5 whitespace-nowrap rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-primary select-none outline-none">
        <MapPin className="w-4 h-4" />
        <span className="max-w-[5.5rem] truncate">{ISLAND_MAP[current].label}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {ISLAND_KEYS.map((k) => (
          <DropdownMenuItem key={k} onClick={() => choose(k)} className="flex items-center justify-between gap-3 select-none">
            {ISLAND_MAP[k].label}
            {k === current && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}