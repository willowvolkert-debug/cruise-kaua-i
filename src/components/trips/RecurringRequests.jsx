import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Repeat, ChevronDown, ChevronUp } from "lucide-react";
import RecurringRequestModal from "./RecurringRequestModal";
import { flowHeading, flowHint, flowToggleRow } from "./flowStyles";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "your recurring ride requests": works like recurring trips on the post-a-ride page.
// Tap one to fill the form, edit/delete it, or turn on auto-posting.
export default function RecurringRequests({ onSelect }) {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        setItems(await base44.entities.RecurringRideRequest.filter({ user_id: u.id }));
      })
      .catch(() => {});
  }, []);

  const handleSaved = (saved) => {
    setItems((prev) => prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]);
  };

  const handleDelete = async (r, e) => {
    e.stopPropagation();
    if (!confirm(`Delete ${r.departure_location} → ${r.destination}?`)) return;
    await base44.entities.RecurringRideRequest.delete(r.id);
    setItems((prev) => prev.filter((x) => x.id !== r.id));
  };

  const toggleAuto = async (r, e) => {
    e.stopPropagation();
    const is_active = !r.is_active;
    await base44.entities.RecurringRideRequest.update(r.id, { is_active });
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active } : x)));
  };

  if (!user) return null;

  return (
    <div className="space-y-4 pb-8 border-b-2 border-gray-200">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between select-none">
        <span className={`${flowHeading} flex items-center gap-2`}>
          <Repeat className="w-6 h-6 text-primary" /> your recurring ride requests
        </span>
        {open ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </button>

      {open && (
        <>
          <p className={flowHint}>
            have a ride you need every week? add a recurring ride request here. when you press on it, the details fill in below, and the only field left is the date.
          </p>
          <Button
            type="button"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="w-full h-14 text-lg rounded-lg bg-secondary hover:bg-secondary/90 text-white select-none"
          >
            <Plus className="w-5 h-5 mr-2" /> add recurring ride request
          </Button>

          {items.map((r) => (
            <div key={r.id} className={`${flowToggleRow} cursor-pointer hover:border-primary`} onClick={() => onSelect?.(r)}>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-secondary">{r.departure_location} → {r.destination}</p>
                <p className="text-base text-gray-500">
                  {(r.weekly_days || []).map((d) => DAY_NAMES[d]).join(", ")} • {r.departure_time} • {r.seats_needed} seat{r.seats_needed > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={(e) => { e.stopPropagation(); setEditing(r); setModalOpen(true); }}>
                    <Pencil className="w-5 h-5 text-gray-500" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={(e) => handleDelete(r, e)}>
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => toggleAuto(r, e)}
                  className={`h-10 px-3 text-sm rounded-lg border-2 select-none ${r.is_active ? "border-green-400 text-green-700 bg-green-50" : "border-secondary text-secondary"}`}
                >
                  <Repeat className="w-4 h-4 mr-1" />
                  {r.is_active ? "auto-posting ✓" : "post automatically?"}
                </Button>
              </div>
            </div>
          ))}
        </>
      )}

      <RecurringRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editRequest={editing}
        user={user}
        onSaved={handleSaved}
      />
    </div>
  );
}