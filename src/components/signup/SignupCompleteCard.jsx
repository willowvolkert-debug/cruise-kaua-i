import React from "react";
import useImpactStats from "@/lib/useImpactStats";
import { ArrowRight, AlertTriangle, User, CheckCircle2, Circle } from "lucide-react";

/**
 * "You're all set!" completion card — shown after phone number capture.
 * Includes a post-signup checklist and gives the user two paths:
 * start browsing rides or finish their profile.
 */
export default function SignupCompleteCard({ onBrowse, onFinishProfile }) {
  const stats = useImpactStats();
  const checklist = [
    { done: true, label: "Account created" },
    { done: false, label: "Complete your profile" },
    { done: false, label: "Find your first ride" },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Dark green header */}
        <div className="bg-[#1B4332] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-2xl">
            🎉
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">you're all set!</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <p className="text-gray-700 text-sm leading-relaxed">
            Great! That's all we need for now. If you're in a rush for a ride, go
            ahead and start booking. If not, finish your profile here.
          </p>

          {stats && (
            <p className="text-center text-secondary font-bold text-base leading-snug">
              🚗 You are 1 of {stats.carsOffRoad.toLocaleString()} cars off the road when you use Cruise
            </p>
          )}

          {/* Post-signup checklist */}
          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <span className={`text-sm font-medium ${item.done ? "text-green-700" : "text-gray-600"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Yellow warning alert */}
          <div className="bg-[#FFF3E0] border border-[#F59F00] rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F59F00] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong>P.S:</strong> You will need to finish your profile &amp;
              upload your license before you can get in the car with anyone.
            </p>
          </div>

          <button
            onClick={onBrowse}
            className="w-full bg-[#2D6A4F] hover:bg-[#245540] text-white font-bold rounded-full py-3.5 text-base transition-colors flex items-center justify-center gap-1.5"
          >
            start browsing rides <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onFinishProfile}
            className="w-full bg-white border-2 border-gray-800 text-gray-800 font-bold rounded-full py-3.5 text-base transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            finish my profile
          </button>
        </div>
      </div>
    </div>
  );
}