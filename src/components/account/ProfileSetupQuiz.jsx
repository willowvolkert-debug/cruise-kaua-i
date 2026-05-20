import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ChevronRight, CheckCircle, Upload, Car, MapPin, X } from "lucide-react";

const BASE_STEPS = [
  { id: "username", title: "What should we call you?", subtitle: "Choose a username others will see on the platform (no spaces).", type: "text", placeholder: "e.g. kaleo_808", field: "username" },
  { id: "age", title: "How old are you?", subtitle: "Riders and drivers can see your age to feel comfortable sharing a ride.", type: "number", placeholder: "e.g. 28", field: "age", min: 18 },
  { id: "gender", title: "What's your gender?", subtitle: "This helps people feel safe knowing who they're riding with.", type: "select", field: "gender", options: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ]},
  { id: "bio", title: "Tell us a little about yourself", subtitle: "A sentence or two about who you are and why you're using Cruise Kauaʻi.", type: "textarea", placeholder: "e.g. Local Kauaʻi resident, love hiking and beach days!", field: "bio" },
  { id: "profile_picture", title: "Add a profile photo", subtitle: "A clear photo of your face helps build trust in our community.", type: "photo", field: "profile_picture_url" },
  { id: "license", title: "Verify your driver's license", subtitle: "Upload both sides of your license so our team can verify your identity. Required to book or post rides.", type: "license", field: "license" },
  { id: "driver_choice", title: "Are you interested in driving?", subtitle: "Drivers earn money by sharing rides they're already making. Riders book seats on posted trips.", type: "driver_choice", field: "driver_choice" },
];

const DRIVER_STEPS = [
  { id: "vehicle_info", title: "Tell us about your vehicle", subtitle: "Year, make, model, color, and license plate.", type: "vehicle_info", field: "vehicle_info" },
  { id: "vehicle_photos", title: "Upload vehicle & insurance photos", subtitle: "Clear photos of the outside, inside, and your insurance card.", type: "vehicle_photos", field: "vehicle_photos" },
  { id: "driver_agreement", title: "Driver Agreement", subtitle: "Read and sign our driver agreement to complete your setup.", type: "driver_agreement", field: "driver_agreement" },
];

const AGREEMENT_BOXES = [
  { key: 'notTransportProvider', label: 'I understand Cruise Kauaʻi is not a transportation provider' },
  { key: 'notEmployee', label: 'I understand I am not an employee or agent' },
  { key: 'solelyResponsible', label: 'I understand I am solely responsible for my actions' },
  { key: 'incidentalTravel', label: 'My rides are incidental to my own travel' },
  { key: 'noProfit', label: 'I will not make a profit from rides' },
  { key: 'noForHire', label: 'I will not provide transportation for hire' },
  { key: 'validLicense', label: "I hold a valid Hawaii driver's license" },
  { key: 'vehicleRegistered', label: 'My vehicle is legally registered' },
  { key: 'vehicleSafe', label: 'My vehicle is safe and roadworthy' },
  { key: 'willRemoveUnsafe', label: 'I will remove my vehicle if unsafe' },
  { key: 'hasInsurance', label: 'I maintain legally required auto insurance' },
  { key: 'noInsuranceProvided', label: 'I understand Cruise Kauaʻi provides NO insurance' },
  { key: 'insuranceDenial', label: 'I understand my insurer may deny coverage' },
  { key: 'confirmedCoverage', label: 'I have confirmed coverage with my insurer' },
  { key: 'inherentRisk', label: 'Driving involves inherent risk' },
  { key: 'passengersIndependent', label: 'Passengers are independent individuals' },
  { key: 'accidentsMayOccur', label: 'Accidents and injuries may occur' },
  { key: 'noBackgroundChecks', label: 'I understand Cruise Kauaʻi does not conduct background checks' },
  { key: 'responsibleInteractions', label: 'I am responsible for my interactions with passengers' },
  { key: 'indemnify', label: 'I understand I may be required to indemnify Cruise Kauaʻi' },
  { key: 'financialResponsibility', label: 'I accept financial responsibility for my actions' },
  { key: 'accurateInfo', label: 'All information I provided is accurate' },
  { key: 'violationRemoval', label: 'I understand violations may result in removal' },
  { key: 'voluntaryParticipation', label: 'I voluntarily agree to participate' },
];

export default function ProfileSetupQuiz({ user, onComplete }) {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [isDriverPath, setIsDriverPath] = useState(false);
  const [showRiderTips, setShowRiderTips] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Profile answers
  const [answers, setAnswers] = useState({ username: user?.username || "", age: user?.age || "", gender: user?.gender || "", bio: user?.bio || "", profile_picture_url: user?.profile_picture_url || "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profile_picture_url || "");
  const fileInputRef = useRef();

  // License
  const [licenseFront, setLicenseFront] = useState(null);
  const [licenseBack, setLicenseBack] = useState(null);
  const licenseFrontRef = useRef();
  const licenseBackRef = useRef();

  // Vehicle info
  const [vehicleInfo, setVehicleInfo] = useState({ make: "", model: "", year: "", color: "", license_plate: "", seats_available: "4" });

  // Vehicle photos
  const [vehicleExterior, setVehicleExterior] = useState(null);
  const [vehicleInterior, setVehicleInterior] = useState([]);
  const [insurancePhoto, setInsurancePhoto] = useState(null);
  const vehicleExtRef = useRef();
  const vehicleIntRef = useRef();
  const insuranceRef = useRef();

  // Driver agreement
  const [agreementBoxes, setAgreementBoxes] = useState(() => Object.fromEntries(AGREEMENT_BOXES.map(b => [b.key, false])));
  const [agreedFinal, setAgreedFinal] = useState(false);
  const allAgreementChecked = Object.values(agreementBoxes).every(v => v) && agreedFinal;

  const steps = isDriverPath ? [...BASE_STEPS, ...DRIVER_STEPS] : BASE_STEPS;
  const current = steps[step];

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); setAnswers(a => ({ ...a, profile_picture_url: "pending" })); setError(""); }
  };

  const validate = () => {
    const val = answers[current.field];
    if (current.type === "photo") {
      if (!photoFile && !user?.profile_picture_url) { setError("Oops! You have to complete this step before moving on."); return false; }
    } else if (current.type === "license") {
      if (!licenseFront || !licenseBack) { setError("Please upload both sides of your license."); return false; }
    } else if (current.type === "driver_choice") {
      return true;
    } else if (current.type === "vehicle_info") {
      if (!vehicleInfo.make || !vehicleInfo.model || !vehicleInfo.year || !vehicleInfo.color || !vehicleInfo.license_plate) { setError("Please fill in all vehicle fields."); return false; }
    } else if (current.type === "vehicle_photos") {
      if (!vehicleExterior) { setError("Please upload a photo of the outside of your vehicle."); return false; }
      if (vehicleInterior.length === 0) { setError("Please upload at least one interior photo."); return false; }
      if (!insurancePhoto) { setError("Please upload your insurance card photo."); return false; }
    } else if (current.type === "driver_agreement") {
      if (!allAgreementChecked) { setError("Please check all boxes and the final agreement checkbox to continue."); return false; }
    } else if (!val || String(val).trim() === "") {
      setError("Oops! You have to complete this step before moving on. If you're having trouble, fill out the contact us form on the sidebar."); return false;
    } else if (current.type === "number" && (isNaN(Number(val)) || Number(val) < 18)) {
      setError("Please enter a valid age (18 or older)."); return false;
    }
    return true;
  };

  const saveProfileAndLicense = async () => {
    let profilePicUrl = user?.profile_picture_url || "";
    if (photoFile) {
      const result = await base44.integrations.Core.UploadFile({ file: photoFile });
      profilePicUrl = result.file_url;
    }
    await base44.auth.updateMe({
      username: answers.username, age: Number(answers.age), gender: answers.gender, bio: answers.bio,
      profile_picture_url: profilePicUrl,
      profile_complete: !!(answers.username && answers.age && answers.gender && answers.bio && profilePicUrl),
      has_completed_profile_quiz: true,
    });
    if (licenseFront && licenseBack) {
      const [fr, br] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: licenseFront }),
        base44.integrations.Core.UploadFile({ file: licenseBack }),
      ]);
      const u = await base44.auth.me();
      await base44.auth.updateMe({ drivers_license_front_url: fr.file_url, drivers_license_back_url: br.file_url, drivers_license_pending_review: true, license_submitted_date: new Date().toISOString() });
      await base44.entities.UserEdit.create({ user_id: u.id, user_name: u.full_name, user_email: u.email, change_type: "license", change_description: "Uploaded driver's license via profile setup quiz", old_values: {}, new_values: { license_front_url: fr.file_url, license_back_url: br.file_url } });
      await base44.entities.AdminMessage.create({ recipient_id: 'admin', recipient_name: 'Admin', subject: `License Pending Review: ${u.full_name}`, message: `${u.full_name} (${u.email}) uploaded their license via the setup quiz.`, message_type: 'action_required' });
    }
  };

  const saveVehicle = async () => {
    const u = await base44.auth.me();
    const [extResult, ...intResults] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: vehicleExterior }),
      ...vehicleInterior.map(f => base44.integrations.Core.UploadFile({ file: f })),
    ]);
    const insResult = await base44.integrations.Core.UploadFile({ file: insurancePhoto });
    await base44.auth.updateMe({
      vehicle_make: vehicleInfo.make, vehicle_model: vehicleInfo.model, vehicle_year: vehicleInfo.year,
      vehicle_color: vehicleInfo.color, license_plate: vehicleInfo.license_plate,
      seats_available: parseInt(vehicleInfo.seats_available),
      vehicle_exterior_photo_url: extResult.file_url,
      vehicle_interior_photo_urls: intResults.map(r => r.file_url),
      auto_policy_photo_url: insResult.file_url,
      insurance_submitted_date: new Date().toISOString(),
      vehicle_pending_review: true, vehicle_verified: false,
    });
    await base44.entities.UserEdit.create({ user_id: u.id, user_name: u.full_name, user_email: u.email, change_type: "vehicle", change_description: "Submitted vehicle via profile setup quiz", old_values: {}, new_values: vehicleInfo });
    await base44.entities.AdminMessage.create({ recipient_id: 'admin', recipient_name: 'Admin', subject: `Vehicle Pending Review: ${u.full_name}`, message: `${u.full_name} (${u.email}) submitted their vehicle (${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}) via the setup quiz.`, message_type: 'action_required' });
  };

  const saveDriverAgreement = async () => {
    await base44.auth.updateMe({ driver_agreement_accepted: true, driver_agreement_timestamp: new Date().toISOString() });
  };

  const handleNext = async () => {
    setError("");
    if (!validate()) return;

    // Driver choice step
    if (current.type === "driver_choice") return; // handled by buttons

    const isLastStep = step === steps.length - 1;
    if (!isLastStep) { setStep(step + 1); return; }

    // Final step — save everything
    setSaving(true);
    await saveProfileAndLicense();
    if (isDriverPath) {
      await saveVehicle();
      await saveDriverAgreement();
    }
    setSaving(false);
    setDone(true);
    setTimeout(() => onComplete(), 1800);
  };

  const handleDriverChoice = async (wantsDriver) => {
    setError("");
    if (wantsDriver) {
      setIsDriverPath(true);
      setStep(step + 1);
    } else {
      // Save profile/license first, then show tips card
      setSaving(true);
      await saveProfileAndLicense();
      setSaving(false);
      setShowRiderTips(true);
    }
  };

  const handleRiderTipsDone = () => {
    navigate(createPageUrl("Trips"));
    onComplete();
  };

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center gap-6 text-center">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauaʻi" className="w-20 h-20 rounded-2xl object-cover shadow-md" />
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-2">let's build your profile 🌺</h2>
            <p className="text-gray-500 text-sm leading-relaxed">It only takes 2 minutes. We'll ask you a few quick questions so drivers and riders know who you are.</p>
          </div>
          <Button onClick={() => setStarted(true)} className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 py-6 text-lg font-bold shadow-lg">go →</Button>
        </div>
      </div>
    );
  }

  if (showRiderTips) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-br from-primary to-green-400 p-6 text-white text-center">
            <div className="text-4xl mb-2">🌺</div>
            <h2 className="text-xl font-bold">here's how cruise kauaʻi works!</h2>
            <p className="text-green-100 text-sm mt-1">if you ever forget, you can rewatch the welcome tutorial in your account.</p>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {[
              { icon: "🔍", title: "find a ride", desc: "Go to Trips → Find a Ride. Browse available rides by date. Filter by island, date, and route." },
              { icon: "📋", title: "book a seat", desc: "Tap a ride card → click 'Book Ride'. Tell the driver why you need the ride and pay securely in the app." },
              { icon: "⏳", title: "wait for confirmation", desc: "The driver will accept or decline within a few hours. You'll get a notification either way." },
              { icon: "🗺️", title: "meet your driver", desc: "Once confirmed, coordinate pickup details in the Inbox. Show up on time!" },
              { icon: "⭐", title: "rate your experience", desc: "After the ride, rate your driver. It helps keep our community safe and trustworthy." },
              { icon: "🙋", title: "request a ride", desc: "Can't find a ride? Post a Ride Request under Trips → Request a Ride. Drivers who see it may reach out." },
              { icon: "✅", title: "stay safe", desc: "Always verify who you're riding with. Check their profile, ratings, and photos before booking." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-secondary text-sm">{title}</p>
                  <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Button onClick={handleRiderTipsDone} className="w-full bg-primary hover:bg-primary/90 rounded-full py-5 font-bold text-base">
              <MapPin className="w-4 h-4 mr-2" /> view all rides →
            </Button>
          </div>
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
          <p className="text-gray-500 text-sm">{isDriverPath ? "Mahalo! Your vehicle & agreement are submitted for review. You'll hear from us soon." : "Mahalo! You're ready to start booking rides."}</p>
        </div>
      </div>
    );
  }

  const progress = ((step) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 shrink-0">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-widest">{step + 1} of {steps.length}</p>
          <h2 className="text-xl font-bold text-secondary mb-1">{current.title}</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">{current.subtitle}</p>

          {/* TEXT */}
          {current.type === "text" && (
            <Input value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} className="rounded-2xl text-base py-5" autoFocus />
          )}

          {/* NUMBER */}
          {current.type === "number" && (
            <Input type="number" min={current.min || 1} value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} className="rounded-2xl text-base py-5 max-w-[140px]" autoFocus />
          )}

          {/* TEXTAREA */}
          {current.type === "textarea" && (
            <textarea value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} rows={4} className="w-full rounded-2xl border border-input px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none" autoFocus />
          )}

          {/* SELECT */}
          {current.type === "select" && (
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((opt) => (
                <button key={opt.value} onClick={() => setAnswers({ ...answers, [current.field]: opt.value })} className={`py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all ${answers[current.field] === opt.value ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50"}`}>{opt.label}</button>
              ))}
            </div>
          )}

          {/* PHOTO */}
          {current.type === "photo" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-28 h-28">
                  <AvatarImage src={photoPreview} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white text-3xl font-bold">{(user?.full_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary/90"><Camera className="w-4 h-4" /></button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-2xl border-primary text-primary hover:bg-primary/10">
                <Camera className="w-4 h-4 mr-2" />{photoFile ? "change photo" : "choose photo"}
              </Button>
              {photoFile && <p className="text-xs text-gray-500">📎 {photoFile.name}</p>}
            </div>
          )}

          {/* LICENSE */}
          {current.type === "license" && (
            <div className="space-y-4">
              {[{ label: "Front of license *", file: licenseFront, ref: licenseFrontRef, set: setLicenseFront }, { label: "Back of license *", file: licenseBack, ref: licenseBackRef, set: setLicenseBack }].map(({ label, file, ref, set }) => (
                <div key={label} className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input ref={ref} type="file" accept="image/*" onChange={(e) => { set(e.target.files[0]); setError(""); }} className="hidden" />
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-500">{file ? <span className="text-primary font-medium">✓ {file.name}</span> : "tap to upload"}</span>
                  </div>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">What you'll need:</p>
                <ul className="space-y-0.5"><li>• A valid driver's license</li><li>• Clear, well-lit photos of both sides</li><li>• All text must be readable</li></ul>
              </div>
              <p className="text-xs text-gray-400 text-center">🔒 Encrypted and secure.</p>
            </div>
          )}

          {/* DRIVER CHOICE */}
          {current.type === "driver_choice" && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <button onClick={() => handleDriverChoice(true)} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary/60 hover:bg-primary/5 transition-all text-left">
                  <Car className="w-8 h-8 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-secondary text-base">yes, help me set up my driver account</p>
                    <p className="text-gray-500 text-sm mt-0.5">Upload your vehicle info, insurance, and sign the driver agreement. Earn money on trips you're already making.</p>
                  </div>
                </button>
                <button onClick={() => handleDriverChoice(false)} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary/60 hover:bg-primary/5 transition-all text-left">
                  <MapPin className="w-8 h-8 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-secondary text-base">no, take me to view all rides</p>
                    <p className="text-gray-500 text-sm mt-0.5">I just want to find rides for now. I can always set up as a driver later from my account.</p>
                  </div>
                </button>
              </div>
              {saving && <p className="text-center text-sm text-gray-400">saving your profile...</p>}
            </div>
          )}

          {/* VEHICLE INFO */}
          {current.type === "vehicle_info" && (
            <div className="space-y-3">
              {[
                { field: "make", label: "Make", placeholder: "e.g. Toyota" },
                { field: "model", label: "Model", placeholder: "e.g. Camry" },
                { field: "year", label: "Year", placeholder: "e.g. 2020" },
                { field: "color", label: "Color", placeholder: "e.g. Silver" },
                { field: "license_plate", label: "License Plate", placeholder: "e.g. ABC-123" },
              ].map(({ field, label, placeholder }) => (
                <div key={field} className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <Input value={vehicleInfo[field]} onChange={(e) => setVehicleInfo(v => ({ ...v, [field]: e.target.value }))} placeholder={placeholder} className="rounded-2xl" />
                </div>
              ))}
            </div>
          )}

          {/* VEHICLE PHOTOS */}
          {current.type === "vehicle_photos" && (
            <div className="space-y-4">
              {[
                { label: "Outside of vehicle *", file: vehicleExterior, ref: vehicleExtRef, set: setVehicleExterior, multiple: false },
                { label: "Inside of vehicle * (select multiple)", file: vehicleInterior.length > 0 ? { name: `${vehicleInterior.length} photo(s) selected` } : null, ref: vehicleIntRef, set: (files) => setVehicleInterior(Array.from(files)), multiple: true },
                { label: "Insurance card * (front & back)", file: insurancePhoto, ref: insuranceRef, set: setInsurancePhoto, multiple: false },
              ].map(({ label, file, ref, set, multiple }) => (
                <div key={label} className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <div onClick={() => ref.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input ref={ref} type="file" accept="image/*" multiple={multiple} onChange={(e) => { multiple ? set(e.target.files) : set(e.target.files[0]); setError(""); }} className="hidden" />
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-500">{file ? <span className="text-primary font-medium">✓ {file.name}</span> : "tap to upload"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DRIVER AGREEMENT */}
          {current.type === "driver_agreement" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">📋 Summary of what you're agreeing to:</p>
                <ul className="space-y-1 text-xs">
                  <li>• You're an independent driver, not an employee</li>
                  <li>• Rides are cost-sharing only, not for profit</li>
                  <li>• You maintain valid license, registration & insurance</li>
                  <li>• Cruise Kauaʻi provides no insurance coverage</li>
                  <li>• You assume all risks of driving and passenger transport</li>
                </ul>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-2xl p-4 border border-gray-200">
                {AGREEMENT_BOXES.map(({ key, label }) => (
                  <div key={key} className="flex items-start gap-2">
                    <Checkbox id={key} checked={agreementBoxes[key]} onCheckedChange={() => { setAgreementBoxes(prev => ({ ...prev, [key]: !prev[key] })); setError(""); }} className="mt-0.5 shrink-0" />
                    <Label htmlFor={key} className="cursor-pointer text-xs leading-tight text-gray-700">{label}</Label>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl">
                <Checkbox id="agreedFinal" checked={agreedFinal} onCheckedChange={() => { setAgreedFinal(v => !v); setError(""); }} className="mt-0.5 shrink-0" />
                <Label htmlFor="agreedFinal" className="cursor-pointer text-sm font-semibold text-green-800 leading-tight">I have read and agree to the full Driver Agreement</Label>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-2xl p-3 leading-relaxed">{error}</p>
          )}

          <div className={`flex gap-3 mt-5 ${current.type === "driver_choice" ? "justify-start" : ""}`}>
            {step > 0 && (
              <Button variant="outline" onClick={() => { setError(""); setStep(step - 1); }} className="rounded-full px-6 py-6 font-bold border-gray-300 text-gray-600">
                ← back
              </Button>
            )}
            {current.type !== "driver_choice" && (
              <Button onClick={handleNext} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-base font-bold">
                {saving ? "saving..." : step === steps.length - 1 ? "finish & save ✓" : <span className="flex items-center justify-center gap-2">next <ChevronRight className="w-4 h-4" /></span>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}