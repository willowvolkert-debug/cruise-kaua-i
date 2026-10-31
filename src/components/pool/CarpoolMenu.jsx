import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CarpoolMenu() {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-0.5 whitespace-nowrap text-xs font-bold rounded-full px-2 py-1 border-2 border-primary bg-card text-primary select-none outline-none">
        carpool 🚗 <ChevronDown className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[10rem]">
        <DropdownMenuItem onClick={() => navigate("/schoolpool")} className="select-none text-base">🎒 schoolpool</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/partypool")} className="select-none text-base">🎉 partypool</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/foodpool")} className="select-none text-base">🥬 foodpool</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}