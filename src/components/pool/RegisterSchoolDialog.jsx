import React, { useState } from "react";
import { pool as poolFn } from "@/functions/pool";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterSchoolDialog({ open, onOpenChange, island, onRegistered }) {
  const [f, setF] = useState({ name: "", location: "", approx_students: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setSaving(true);
    setError("");
    const res = await poolFn({ action: "registerSchool", island, ...f }).catch((e) => ({ error: e?.response?.data?.error || "Something went wrong" }));
    setSaving(false);
    if (res.error) return setError(res.error);
    setF({ name: "", location: "", approx_students: "", password: "" });
    onRegistered(res.data.school);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="cruise-head text-3xl text-secondary">register a school</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input className="h-14 text-lg" placeholder="school name" value={f.name} onChange={set("name")} />
          <Input className="h-14 text-lg" placeholder="location (town / address)" value={f.location} onChange={set("location")} />
          <Input className="h-14 text-lg" type="number" placeholder="approx. number of students" value={f.approx_students} onChange={set("approx_students")} />
          <Input className="h-14 text-lg" placeholder="password for parents to join" value={f.password} onChange={set("password")} />
          <p className="text-sm text-muted-foreground">Share this password with the school's parents so they can join.</p>
          {error && <p className="text-destructive">{error}</p>}
          <Button className="h-14 text-lg w-full" disabled={saving || !f.name || !f.location || f.password.length < 4} onClick={submit}>
            {saving ? "registering…" : "register school"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}