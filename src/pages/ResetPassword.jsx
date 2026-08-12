import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) setResetToken(token);
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!resetToken) {
      setError("missing reset token. please use the link from your reset email.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      setDone(true);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "";
      if (msg.toLowerCase().includes("expire") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("token")) {
        setError("this reset link is invalid or expired. please request a new one.");
      } else {
        setError(msg || "couldn't reset password. please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <a href="/join?login=true" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Kauaʻi"
            className="w-9 h-9 rounded-xl object-cover"
          />
        </a>
        <a
          href="/join?login=true"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          back to login
        </a>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">set new password</h1>

        {done ? (
          <div className="mt-6 bg-primary/10 border border-primary/20 rounded-xl px-4 py-4">
            <p className="text-sm text-primary font-medium mb-2">password updated ✅</p>
            <p className="text-sm text-gray-600 mb-4">
              your password has been reset. you can now log in with your new password.
            </p>
            <a
              href="/join?login=true"
              className="inline-block text-sm text-primary underline font-semibold hover:text-primary/80"
            >
              go to login →
            </a>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-base mb-6">
              choose a new password for your account.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">new password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="at least 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="rounded-xl h-12 pr-10"
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">confirm password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-12"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-xl h-12 text-base font-bold"
              >
                {loading ? "saving..." : "set new password"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}