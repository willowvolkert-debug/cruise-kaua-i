import React from "react";

const cols = ["", "Cruise Hawaiʻi", "Uber", "Lyft", "Kauaʻi taxis", "Kauaʻi Bus"];

const rows = [
  ["What it is",
    "Neighbours sharing rides on Kauaʻi. Drivers post trips, riders ask for a seat.",
    "On-demand app. UberX started on Kauaʻi in March 2017 (Hawaiʻi Magazine).",
    "On-demand app. Has a Kauaʻi page (Lyft); how reliable service is was not verified.",
    "Licensed, metered cars with county-set rates (Kauaʻi Now).",
    "County bus (kauai.gov)."],
  ["Who sets the price",
    "The driver, per seat, inside a cap for the route. A resident’s cap is tied to the IRS mileage rate, so it stays cost-sharing.",
    "The app shows an upfront price that can go up when busy (Uber).",
    "Upfront price; its page says a high price “might be busier than usual” (Lyft).",
    "Meter: $3.50 to start, then $0.45 per tenth of a mile or 45 seconds waiting (Rate 1, as reported Nov 2025; check the county rate card).",
    "Day pass $5, month $50, year $550; half price for seniors, youth and ADA riders."],
  ["Surge or busy-time pricing",
    "None. The price is what the driver posted.",
    "Yes, automatic when there are more riders than drivers (Uber).",
    "Prices can be higher when busier (Lyft’s wording above).",
    "Set by county code.",
    "Fixed fares."],
  ["What the company keeps",
    "A flat fee per booking: $3 for a resident, $7 for a visitor, plus 3% card processing, plus $1.50 once for the ID check. The driver gets the full ride price (Naos to confirm Stripe’s own payout charges, if any).",
    "A share of each fare. Uber reports about 21% on average (Q3 2025, via a news report, not checked at the source). A 2025 Oxford study of UK drivers found a median of 29%. No Hawaiʻi figure (Oxford).",
    "A “commission” made of a fixed service fee plus a variable platform fee, so it differs ride to ride. No Hawaiʻi figure (Lyft terms).",
    "Not applicable.",
    "Not applicable."],
  ["Built for",
    "Hawaiʻi only. Kauaʻi first.",
    "Not Hawaiʻi-specific.",
    "Not Hawaiʻi-specific.",
    "Local operators.",
    "Kauaʻi County."],
  ["Community features",
    "Schoolpool (parents share school runs, on now), road alerts, Grey Skies disaster-relief board. Partypool (a safe ride home from events) and Foodpool (food deliveries) are built but switched off.",
    "None that we know of. Verify before publishing.",
    "None that we know of. Verify before publishing.",
    "No.",
    "No."],
  ["Who checks the driver",
    "ID check for every member (Stripe Identity), licence and insurance documents reviewed by an admin, vehicle photos. No criminal background check yet (undecided, see the Security page).",
    "Hawaiʻi law requires rideshare companies to run annual criminal background and driving-record checks (HRS §279J-9) and to carry insurance (HRS §431:10C-703).",
    "Same law applies.",
    "County permit rules (not researched).",
    "County bus (not researched)."],
];

export default function BetaComparison() {
  return (
    <section className="pb-6">
      <h2 className="text-3xl text-primary lowercase text-center">why cruise · the comparison</h2>
      <h3 className="text-2xl text-secondary lowercase tracking-widest text-center mt-1">feature comparison, with sources</h3>
      <div className="overflow-x-auto mt-3 border-2 border-foreground rounded-2xl bg-card">
        <table className="min-w-[900px] w-full text-left text-base align-top">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              {cols.map((c) => <th key={c} className="p-3 font-heading font-black">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border align-top">
                <td className="p-3 font-bold text-secondary">{r[0]}</td>
                {r.slice(1).map((c, i) => (
                  <td key={i} className={`p-3 ${i === 0 ? "bg-muted" : ""}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground mt-1">swipe sideways to see every column →</p>
    </section>
  );
}