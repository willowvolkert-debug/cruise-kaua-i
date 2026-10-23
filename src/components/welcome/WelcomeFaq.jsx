import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqItems } from "@/lib/faqItems";

function FaqRow({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-[#2b1a1a]/20">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 py-4 text-left select-none">
        <span className="cruise-body text-[#2b1a1a] text-xl md:text-2xl">{q}</span>
        <ChevronDown className={`w-6 h-6 text-[#C64D50] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="cruise-body text-[#2b1a1a]/80 text-lg md:text-xl leading-snug pb-5">{a}</p>}
    </div>
  );
}

export default function WelcomeFaq() {
  return (
    <section className="bg-[#F1EDE1] px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="cruise-head text-[#2b1a1a] text-5xl md:text-6xl text-center mb-8">FAQs</h2>
        {faqItems.map((item) => <FaqRow key={item.q} {...item} />)}
      </div>
    </section>
  );
}