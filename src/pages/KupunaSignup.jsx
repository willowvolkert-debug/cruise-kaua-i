import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function KupunaSignupPage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!name || !phoneNumber) {
      setError("please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await base44.entities.KupunaSignup.create({ name, phone_number: phoneNumber });
      setSubmitted(true);
    } catch (e) {
      setError("something went wrong. please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      <div className="flex items-center px-5 py-4 border-b border-gray-100">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise logo"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <a href="/join" className="ml-auto text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2">
          back to sign up
        </a>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {!submitted ? (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Mahalo for joining Cruise Hawaiʻi!</h1>
              <p className="text-xl text-gray-600 leading-relaxed font-semibold">
                Please put your phone number and name below and we will give you a call soon to help you set up your account.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">name</label>
                <Input
                  placeholder="your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">phone number</label>
                <Input
                  type="tel"
                  placeholder="(808) 555-1234"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base mt-8"
            >
              {loading ? "submitting..." : "submit →"}
            </Button>
          </>
        ) : (
          <div className="text-center space-y-6 mt-12">
            <div className="text-6xl">🌺</div>
            <h1 className="text-3xl font-extrabold text-gray-900">mahalo, {name.split(" ")[0]}!</h1>
            <p className="text-xl text-gray-600 leading-relaxed font-semibold">
              We'll give you a call soon to help you set up your account. Talk to you soon! 🤙
            </p>
            <a
              href="/welcome"
              className="inline-block mt-4 text-primary underline underline-offset-2 font-medium"
            >
              back to welcome page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}