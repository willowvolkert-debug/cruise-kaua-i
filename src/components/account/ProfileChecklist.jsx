import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export function getProfileChecklist(user) {
  const isDriver = user.user_type === "driver" || (!!user.vehicle_make && !!user.vehicle_model);
  const items = [
    { label: "username", done: !!user.username },
    { label: "age", done: !!user.age },
    { label: "gender", done: !!user.gender },
    { label: "bio", done: !!user.bio },
    { label: "profile photo", done: !!user.profile_picture_url },
    { label: "terms of service", done: !!user.terms_accepted },
    { label: "privacy policy", done: !!user.privacy_policy_accepted },
    { label: "ID / license upload", done: !!(user.drivers_license_front_url || user.drivers_license_verified) },
  ];
  if (isDriver) {
    items.push(
      { label: "vehicle info", done: !!(user.vehicle_make && user.vehicle_model) },
      { label: "vehicle & insurance photos", done: !!user.vehicle_exterior_photo_url },
      { label: "driver agreement", done: !!user.driver_agreement_accepted },
    );
  }
  return items;
}

export default function ProfileChecklist({ items }) {
  const left = items.filter((i) => !i.done).length;
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-left">
      <p className="text-xs font-bold tracking-widest uppercase text-blue-700 mb-2">
        {left} of {items.length} steps left
      </p>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.label} className={`flex items-center gap-2 text-sm ${i.done ? "text-gray-400 line-through" : "text-gray-800 font-semibold"}`}>
            {i.done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-blue-400 shrink-0" />}
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}