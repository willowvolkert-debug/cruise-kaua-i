import React, { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400); // wait for fade-out
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-400"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <img
        src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
        alt="Cruise Kauaʻi"
        className="w-36 h-36 object-cover rounded-3xl shadow-2xl mb-6"
      />
      <h1 className="text-3xl font-extrabold text-primary tracking-wide">welcome!</h1>
    </div>
  );
}