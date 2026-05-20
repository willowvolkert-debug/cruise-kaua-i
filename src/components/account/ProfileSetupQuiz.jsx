import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ChevronRight, CheckCircle } from "lucide-react";

const STEPS = [
  {
    id: "username",
    title: "What should we call you?",
    subtitle: "Choose a username others will see on the platform (no spaces).",
    type: "text",
    placeholder: "e.g. kaleo_808",
    field: "username",
  },
  {
    id: "age",
    title: "How old are you?",
    subtitle: "Riders and drivers can see your age to feel comfortable sharing a ride.",
    type: "number",
    placeholder: "e.g. 28",
    field: "age",
    min: 18,
  },
  {
    id: "gender",
    title: "What's your gender?",
    subtitle: "This helps people feel safe knowing who they're riding with.",
    type: "select",
    field: "gender",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "non-binary", label: "Non-binary" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  {
    id: "bio",
    title: "Tell us a little about yourself",
    subtitle: "A sentence or two about who you are and why you're using Cruise Kauaʻi.",
    type: "textarea",
    placeholder: "e.g. Local Kauaʻi resident, love hiking and beach days. Trying to reduce my carbon footprint!",
    field: "bio",
  },
  {
    id: "profile_picture",
    title: "Add a profile photo",
    subtitle: "A clear photo of your face helps build trust in our community.",
    type: "photo",
    field: "profile_picture_url",
  },
];

export default function ProfileSetupQuiz({ user, onComplete }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    username: user?.username || "",
    age: user?.age || "",
    gender: user?.gender || "",
    bio: user?.bio || "",
    profile_picture_url: user?.profile_picture_url || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profile_picture_url || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef();

  const current = STEPS[step];

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setAnswers((a) => ({ ...a, profile_picture_url: "pending" }));
      setError("");
    }
  };

  const validate = () => {
    const val = answers[current.field];
    if (current.type === "photo") {
      if (!photoFile && !user?.profile_picture_url) {
        setError("Oops! You have to complete this step before moving on. If you're having trouble, fill out the contact us form on the sidebar.");
        return false;
      }
    } else if (!val || String(val).trim() === "") {
      setError("Oops! You have to complete this step before moving on. If you're having trouble, fill out the contact us form on the sidebar.");
      return false;
    } else if (current.type === "number" && (isNaN(Number(val)) || Number(val) < 18)) {
      setError("Please enter a valid age (18 or older).");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError("");
    if (!validate()) return;

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Final save
      setSaving(true);
      let profilePicUrl = user?.profile_picture_url || "";
      if (photoFile) {
        const result = await base44.integrations.Core.UploadFile({ file: photoFile });
        profilePicUrl = result.file_url;
      }

      const saveData = {
        username: answers.username,
        age: Number(answers.age),
        gender: answers.gender,
        bio: answers.bio,
        profile_picture_url: profilePicUrl,
        profile_complete: !!(answers.username && answers.age && answers.gender && answers.bio && profilePicUrl),
        has_completed_profile_quiz: true,
      };

      await base44.auth.updateMe(saveData);
      setSaving(false);
      setDone(true);
      setTimeout(() => onComplete(), 1800);
    }
  };

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center gap-6 text-center">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Kauaʻi"
            className="w-20 h-20 rounded-2xl object-cover shadow-md"
          />
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-2">let's build your profile 🌺</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              It only takes 2 minutes. We'll ask you a few quick questions so drivers and riders know who you are.
            </p>
          </div>
          <Button
            onClick={() => setStarted(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 py-6 text-lg font-bold shadow-lg"
          >
            go →
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center gap-4 text-center">
          <CheckCircle className="w-16 h-16 text-primary" />
          <h2 className="text-2xl font-bold text-secondary">profile complete! 🎉</h2>
          <p className="text-gray-500 text-sm">Mahalo! You're ready to start booking rides.</p>
        </div>
      </div>
    );
  }

  const progress = ((step) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-widest">
            {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-secondary mb-1">{current.title}</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{current.subtitle}</p>

          {/* Input */}
          {current.type === "text" && (
            <Input
              value={answers[current.field]}
              onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })}
              placeholder={current.placeholder}
              className="rounded-2xl text-base py-5"
              autoFocus
            />
          )}

          {current.type === "number" && (
            <Input
              type="number"
              min={current.min || 1}
              value={answers[current.field]}
              onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })}
              placeholder={current.placeholder}
              className="rounded-2xl text-base py-5 max-w-[140px]"
              autoFocus
            />
          )}

          {current.type === "textarea" && (
            <textarea
              value={answers[current.field]}
              onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })}
              placeholder={current.placeholder}
              rows={4}
              className="w-full rounded-2xl border border-input px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              autoFocus
            />
          )}

          {current.type === "select" && (
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers({ ...answers, [current.field]: opt.value })}
                  className={`py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                    answers[current.field] === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {current.type === "photo" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-28 h-28">
                  <AvatarImage src={photoPreview} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white text-3xl font-bold">
                    {(user?.full_name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary/90"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-primary text-primary hover:bg-primary/10"
              >
                <Camera className="w-4 h-4 mr-2" />
                {photoFile ? "change photo" : "choose photo"}
              </Button>
              {photoFile && (
                <p className="text-xs text-gray-500">📎 {photoFile.name}</p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-2xl p-3 leading-relaxed">
              {error}
            </p>
          )}

          <Button
            onClick={handleNext}
            disabled={saving}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-base font-bold"
          >
            {saving ? "saving..." : step === STEPS.length - 1 ? "finish & save ✓" : (
              <span className="flex items-center justify-center gap-2">next <ChevronRight className="w-4 h-4" /></span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}