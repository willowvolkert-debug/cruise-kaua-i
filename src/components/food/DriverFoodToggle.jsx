import React from "react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";

export default function DriverFoodToggle({ user, onChange }) {
  const toggle = async (v) => {
    await base44.auth.updateMe({ delivers_food: v });
    onChange({ ...user, delivers_food: v });
  };
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-border pb-4 mb-4">
      <div>
        <p className="cruise-head text-2xl text-secondary leading-tight">I'm willing to deliver food</p>
        <p className="text-muted-foreground">wholesale deliveries or groceries, like Mālama Kauaʻi</p>
      </div>
      <Switch checked={user.delivers_food === true} onCheckedChange={toggle} />
    </div>
  );
}