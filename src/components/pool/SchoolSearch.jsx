import React, { useEffect, useState } from "react";
import { pool as poolFn } from "@/functions/pool";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SchoolSearch({ island, onEnter }) {
  const [q, setQ] = useState("");
  const [schools, setSchools] = useState([]);
  const [target, setTarget] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      poolFn({ action: "searchSchools", query: q, island }).then((r) => setSchools(r.data.schools));
    }, 250);
    return () => clearTimeout(t);
  }, [q, island]);

  const pick = (s) => {
    if (s.joined) return onEnter(s);
    setTarget(s);
    setPassword("");
    setError("");
  };

  const join = async () => {
    setBusy(true);
    setError("");
    const res = await poolFn({ action: "joinSchool", school_id: target.id, password }).catch((e) => ({ error: e?.response?.data?.error || "Could not join" }));
    setBusy(false);
    if (res.error) return setError(res.error);
    onEnter(res.data.school);
  };

  return (
    <div>
      <Input className="h-16 text-xl" placeholder="search for your school" value={q} onChange={(e) => setQ(e.target.value)} />
      {!q && schools.length > 0 && <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-5">your schools</p>}
      {q && schools.length === 0 && (
        <p className="text-lg text-muted-foreground py-6">no registered school found. use “register a school” in the top right to add yours.</p>
      )}
      {schools.map((s) => (
        <button key={s.id} onClick={() => pick(s)} className="w-full text-left border-b-2 border-border py-4 select-none">
          <p className="cruise-head text-2xl text-secondary">{s.name}</p>
          <p className="text-muted-foreground">{s.location}{s.approx_students ? ` · ~${s.approx_students} students` : ""}</p>
        </button>
      ))}
      {target && (
        <div className="mt-6 space-y-3 border-2 border-primary p-4">
          <p className="cruise-head text-2xl text-secondary">join {target.name}</p>
          <p className="text-muted-foreground">Enter the password provided by your school.</p>
          <Input className="h-14 text-lg" type="password" placeholder="school password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button className="h-12 text-lg" disabled={!password || busy} onClick={join}>{busy ? "checking…" : "join"}</Button>
            <Button variant="outline" className="h-12 text-lg" onClick={() => setTarget(null)}>cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}