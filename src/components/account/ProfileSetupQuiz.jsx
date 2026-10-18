import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { sendOnboardingEmail } from "@/functions/sendOnboardingEmail";
import { sendUserLifecycleEmail } from "@/functions/sendUserLifecycleEmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, ChevronRight, CheckCircle, Upload, Car, MapPin, X, FileText, Shield, Bell, Info } from "lucide-react";
import { requestNotificationPermission } from "@/components/utils/notifications";

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
  { id: "phone", title: "What's your phone number?", subtitle: "Optional. We'll text you when someone messages you or books your ride. We'll never send promotions.", type: "phone", field: "phone_number" },
  { id: "push_notifications", title: "Enable push notifications", subtitle: "Get notified when a rider books your ride, a driver accepts your request, or someone sends you a message.", type: "push_notifications", field: "push_notifications" },
  { id: "profile_picture", title: "Add a profile photo", subtitle: "A clear photo of your face helps build trust in our community.", type: "photo", field: "profile_picture_url" },
  { id: "terms_of_service", title: "Terms of Service", subtitle: "Please read and agree to our Terms of Service before continuing.", type: "terms_of_service", field: "terms_of_service" },
  { id: "privacy_policy", title: "Privacy Policy", subtitle: "Please read and agree to our Privacy Policy before continuing.", type: "privacy_policy", field: "privacy_policy" },
  { id: "license", title: "Verify your ID or license", subtitle: "Upload both sides of your driver's license or a government-issued ID so our team can verify your identity. Don't have a license? A state ID or passport works too. You can skip this for now and upload it later from your account — you'll need it verified before your first ride.", type: "license", field: "license" },
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

export default function ProfileSetupQuiz({ user, onComplete, initialStep = 0 }) {
  const navigate = useNavigate();

  // Read island + role from URL params (set by JoinUs signup flow)
  const _urlParams = new URLSearchParams(window.location.search);
  const _prefilledIsland = _urlParams.get('island') || '';
  const _prefilledRole = _urlParams.get('role') || ''; // 'driver' or 'rider'

  const [started, setStarted] = useState(initialStep > 0); // skip welcome if resuming
  const [step, setStep] = useState(initialStep);
  // Show founders screen for non-Kauai islands pre-filled from signup flow
  const [foundersChecked, setFoundersChecked] = useState(false);
  const [isDriverPath, setIsDriverPath] = useState(_prefilledRole === 'driver' || user?.user_type === 'driver' || (!!user?.vehicle_make && !!user?.vehicle_model));
  const [showRiderTips, setShowRiderTips] = useState(false);
  const [showFoundersScreen, setShowFoundersScreen] = useState(false);
  const [done, setDone] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);
  const [licenseSaved, setLicenseSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Profile answers — pre-fill island from URL param if available
  const [answers, setAnswers] = useState({ username: user?.username || "", age: user?.age || "", gender: user?.gender || "", bio: user?.bio || "", phone_number: user?.phone_number || "", profile_picture_url: user?.profile_picture_url || "", preferred_island: user?.preferred_island || _prefilledIsland || "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profile_picture_url || "");
  const fileInputRef = useRef();

  // License
  const [licenseFront, setLicenseFront] = useState(null);
  const [licenseBack, setLicenseBack] = useState(null);
  const licenseFrontRef = useRef();
  const licenseBackRef = useRef();

  // Vehicle info — pre-fill from any previously saved data so a returning user
  // doesn't lose what they already entered/submitted.
  const [vehicleInfo, setVehicleInfo] = useState({ make: user?.vehicle_make || "", model: user?.vehicle_model || "", year: user?.vehicle_year || "", color: user?.vehicle_color || "", license_plate: user?.license_plate || "", seats_available: String(user?.seats_available || 4) });

  // Vehicle photos
  const [vehicleExterior, setVehicleExterior] = useState(null);
  const [vehicleInterior, setVehicleInterior] = useState([]);
  const [insurancePhoto, setInsurancePhoto] = useState(null);
  const vehicleExtRef = useRef();
  const vehicleIntRef = useRef();
  const insuranceRef = useRef();

  // Push notifications
  const [notifStatus, setNotifStatus] = useState('idle'); // 'idle' | 'granted' | 'denied'

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifStatus('granted');
      await base44.auth.updateMe({ notifications_enabled: true });
    } else {
      setNotifStatus('denied');
    }
  };

  // ToS / Privacy Policy
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Driver agreement
  const [agreementBoxes, setAgreementBoxes] = useState(() => Object.fromEntries(AGREEMENT_BOXES.map(b => [b.key, false])));
  const [agreedFinal, setAgreedFinal] = useState(false);
  const allAgreementChecked = Object.values(agreementBoxes).every(v => v) && agreedFinal;

  const scrollRef = useRef(null);
  const steps = isDriverPath ? [...BASE_STEPS, ...DRIVER_STEPS] : BASE_STEPS;
  const safeStep = Math.min(Math.max(step, 0), steps.length - 1);
  const current = steps[safeStep];

  // Scroll modal content to top whenever step changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [step]);

  // On open, skip past steps the user has already completed so we never
  // re-ask for info (profile, license, agreements, vehicle) they've already
  // provided. This is what stops a returning user from being told to re-upload
  // a license or re-enter a bio they already saved.
  useEffect(() => {
    const list = isDriverPath ? [...BASE_STEPS, ...DRIVER_STEPS] : BASE_STEPS;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      let complete = false;
      if (s.type === 'text' && s.field === 'username' && user?.username) complete = true;
      else if (s.type === 'number' && s.field === 'age' && user?.age) complete = true;
      else if (s.type === 'select' && s.field === 'gender' && user?.gender) complete = true;
      else if (s.type === 'textarea' && s.field === 'bio' && user?.bio) complete = true;
      else if (s.type === 'phone' && user?.phone_number) complete = true;
      else if (s.type === 'push_notifications') complete = true;
      else if (s.type === 'photo' && user?.profile_picture_url) complete = true;
      else if (s.type === 'terms_of_service' && user?.terms_accepted) complete = true;
      else if (s.type === 'privacy_policy' && user?.privacy_policy_accepted) complete = true;
      else if (s.type === 'license' && (user?.drivers_license_front_url || user?.drivers_license_verified)) complete = true;
      else if (s.type === 'driver_choice' && isDriverPath) complete = true;
      else if (s.type === 'vehicle_info' && user?.vehicle_make && user?.vehicle_model) complete = true;
      else if (s.type === 'vehicle_photos' && user?.vehicle_exterior_photo_url) complete = true;
      else if (s.type === 'driver_agreement' && user?.driver_agreement_accepted) complete = true;
      if (!complete) { setStep(i); setStarted(true); return; }
    }
    // Every step was already completed — land on the last step so the user
    // can just hit "finish & save" and mark the quiz done.
    setStep(list.length - 1);
    setStarted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); setAnswers(a => ({ ...a, profile_picture_url: "pending" })); setError(""); }
  };

  const validate = () => {
    const val = answers[current.field];
    if (current.type === "terms_of_service") {
      if (!termsAgreed) { setError("Please read and accept the Terms of Service to continue."); return false; }
      return true;
    } else if (current.type === "privacy_policy") {
      if (!privacyAgreed) { setError("Please read and accept the Privacy Policy to continue."); return false; }
      return true;
    } else if (current.type === "island") {
      if (!val) { setError("Please select your island."); return false; }
      return true;
    } else if (current.type === "phone") {
      return true; // optional step
    } else if (current.type === "push_notifications") {
      return true; // optional step
    } else if (current.type === "photo") {
      if (!photoFile && !user?.profile_picture_url) { setError("Oops! You have to complete this step before moving on."); return false; }
    } else if (current.type === "license") {
      // License is optional during onboarding — user can upload later from account page
      return true;
    } else if (current.type === "driver_choice") {
      return true;
    } else if (current.type === "vehicle_info") {
      if (!vehicleInfo.make || !vehicleInfo.model || !vehicleInfo.year || !vehicleInfo.color || !vehicleInfo.license_plate) { setError("Please fill in all vehicle fields."); return false; }
    } else if (current.type === "vehicle_photos") {
      // A returning user who already saved vehicle photos (resume) can proceed without re-uploading.
      const hasSavedPhotos = !!user?.vehicle_exterior_photo_url;
      if (!vehicleExterior && !hasSavedPhotos) { setError("Please upload a photo of the outside of your vehicle."); return false; }
      if (vehicleInterior.length === 0 && !hasSavedPhotos) { setError("Please upload at least one interior photo."); return false; }
      if (!insurancePhoto && !hasSavedPhotos) { setError("Please upload your insurance card photo."); return false; }
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
      phone_number: answers.phone_number || '',
      preferred_island: answers.preferred_island || 'Kauai',
      sms_notifications_enabled: !!(answers.phone_number),
      profile_complete: !!(answers.username && answers.age && answers.gender && answers.bio && profilePicUrl),
      has_completed_profile_quiz: true,
      terms_accepted: true,
      privacy_policy_accepted: true,
    });
    if (licenseFront && licenseBack && !licenseSaved) {
      const [fr, br] = await Promise.all([
        base44.integrations.Core.UploadPrivateFile({ file: licenseFront }),
        base44.integrations.Core.UploadPrivateFile({ file: licenseBack }),
      ]);
      const u = await base44.auth.me();
      await base44.auth.updateMe({ drivers_license_front_url: fr.file_uri, drivers_license_back_url: br.file_uri, drivers_license_pending_review: true, license_submitted_date: new Date().toISOString() });
      await base44.entities.UserEdit.create({ user_id: u.id, user_name: u.full_name, user_email: u.email, change_type: "license", change_description: "Uploaded driver's license via profile setup quiz", old_values: {}, new_values: { license_front_url: fr.file_url, license_back_url: br.file_url } });
      await base44.entities.AdminMessage.create({ recipient_id: 'admin', recipient_name: 'Admin', subject: `License Pending Review: ${u.full_name}`, message: `${u.full_name} (${u.email}) uploaded their license via the setup quiz.`, message_type: 'action_required' });
      setLicenseSaved(true);
      // Send license submitted email
      sendUserLifecycleEmail({ emailType: 'license_submitted' }).catch(() => null);
    }
  };

  const saveVehicle = async () => {
    const u = await base44.auth.me();
    // Upload only newly-selected photos; fall back to already-persisted URLs so a
    // returning user who changes just one photo doesn't lose the others, and we
    // never try to upload a null file (which would throw and break the save).
    const uploadIfPresent = (file) => file ? base44.integrations.Core.UploadPrivateFile({ file }).then(r => r.file_uri) : Promise.resolve(null);
    const [extUrl, ...intUrls] = await Promise.all([
      uploadIfPresent(vehicleExterior),
      ...vehicleInterior.map(f => uploadIfPresent(f)),
    ]);
    const insUrl = await uploadIfPresent(insurancePhoto);
    await base44.auth.updateMe({
      vehicle_make: vehicleInfo.make, vehicle_model: vehicleInfo.model, vehicle_year: vehicleInfo.year,
      vehicle_color: vehicleInfo.color, license_plate: vehicleInfo.license_plate,
      seats_available: parseInt(vehicleInfo.seats_available),
      vehicle_exterior_photo_url: extUrl || u.vehicle_exterior_photo_url || "",
      vehicle_interior_photo_urls: intUrls.length ? intUrls : (u.vehicle_interior_photo_urls || []),
      auto_policy_photo_url: insUrl || u.auto_policy_photo_url || "",
      insurance_submitted_date: new Date().toISOString(),
      vehicle_pending_review: true, vehicle_verified: false,
    });
    await base44.entities.UserEdit.create({ user_id: u.id, user_name: u.full_name, user_email: u.email, change_type: "vehicle", change_description: "Submitted vehicle via profile setup quiz", old_values: {}, new_values: vehicleInfo });
    await base44.entities.AdminMessage.create({ recipient_id: 'admin', recipient_name: 'Admin', subject: `Vehicle Pending Review: ${u.full_name}`, message: `${u.full_name} (${u.email}) submitted their vehicle (${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}) via the setup quiz.`, message_type: 'action_required' });
    // Send vehicle submitted email
    sendUserLifecycleEmail({ emailType: 'vehicle_submitted' }).catch(() => null);
  };

  const saveDriverAgreement = async () => {
    await base44.auth.updateMe({ driver_agreement_accepted: true, driver_agreement_timestamp: new Date().toISOString() });
  };

  // When quiz starts, if island was pre-filled from signup and it's non-Kauai, show founders screen
  useEffect(() => {
    if (started && !foundersChecked && _prefilledIsland && _prefilledIsland !== "Kauai") {
      setFoundersChecked(true);
      base44.auth.updateMe({ preferred_island: _prefilledIsland, is_founders_group: true }).catch(() => null);
      setShowFoundersScreen(true);
    } else if (started && !foundersChecked) {
      setFoundersChecked(true);
      if (_prefilledIsland) {
        base44.auth.updateMe({ preferred_island: _prefilledIsland }).catch(() => null);
      }
    }
  }, [started]);

  const handleNext = async () => {
    setError("");
    if (!validate()) return;

    // Driver choice step
    if (current.type === "driver_choice") return; // handled by buttons

    // Persist vehicle data the moment the user clears the vehicle_photos step.
    // Previously this only saved on the final "finish & save", so if a user
    // abandoned the quiz (or the final save failed) after uploading their
    // vehicle + insurance photos, ALL of that data was lost and the quiz asked
    // for it again. Saving here guarantees the docs reach the admin even if the
    // user never finishes the quiz.
    if (current.type === "vehicle_photos" && vehicleExterior && !vehicleSaved) {
      setSaving(true);
      try {
        await saveVehicle();
        setVehicleSaved(true);
      } catch (e) {
        setError("couldn't save your vehicle photos — please check your connection and try again.");
        setSaving(false);
        return; // stay on this step so they can retry
      }
      setSaving(false);
    }

    const isLastStep = safeStep === steps.length - 1;
    if (!isLastStep) { setStep(safeStep + 1); return; }

    // Final step — save everything
    setSaving(true);
    try {
      await saveProfileAndLicense();
      if (isDriverPath) {
        if (vehicleExterior && !vehicleSaved) await saveVehicle();
        await saveDriverAgreement();
      }
      // Fire onboarding email once (non-blocking)
      sendOnboardingEmail({}).catch(() => null);
      base44.analytics.track({
        eventName: "profile_setup_completed",
        properties: { path: isDriverPath ? "driver" : "rider", island: answers.preferred_island || "Kauai" }
      });
      setDone(true);
      setTimeout(() => onComplete(), 1800);
    } catch (saveErr) {
      setError("couldn't save your profile — please check your connection and try again. if the problem continues, use the contact us form.");
    }
    setSaving(false);
  };

  const handleDriverChoice = async (wantsDriver) => {
    setError("");
    if (wantsDriver) {
      setIsDriverPath(true);
      setStep(safeStep + 1);
    } else {
      // Save profile/license first, then show tips card
      setSaving(true);
      try {
        await saveProfileAndLicense();
        setShowRiderTips(true);
      } catch (saveErr) {
        setError("couldn't save your profile — please check your connection and try again.");
      }
      setSaving(false);
    }
  };

  const handleRiderTipsDone = () => {
    // Fire onboarding email once (non-blocking)
    sendOnboardingEmail({}).catch(() => null);
    base44.analytics.track({
      eventName: "profile_setup_completed",
      properties: { path: "rider", island: answers.preferred_island || "Kauai" }
    });
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

  if (showFoundersScreen) {
    const islandName = answers.preferred_island;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-br from-secondary to-blue-400 p-8 text-white text-center">
            <div className="text-5xl mb-3">🌺</div>
            <h2 className="text-2xl font-bold">right on, {islandName}!</h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <p className="text-gray-700 text-base leading-relaxed mb-6">
              You can finish signing up as a driver and will be a part of our founder's group for {islandName === "Oahu" ? "Oʻahu" : islandName}. We will reach out to you shortly to build the service on your island with you!
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-amber-800 text-sm font-semibold mb-1">🏆 You're a founder!</p>
              <p className="text-amber-700 text-sm">As a founding member, you'll help shape how Cruise works on {islandName === "Oahu" ? "Oʻahu" : islandName}. We'll be in touch soon.</p>
            </div>
            <Button
              onClick={() => { setShowFoundersScreen(false); setStep(step + 1); }}
              className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-full py-6 text-base font-bold"
            >
              continue signing up →
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

  const handleSaveAndComeBack = async () => {
    setSaving(true);
    try {
      // Upload a new profile picture if one was selected
      let profilePicUrl = user?.profile_picture_url || "";
      if (photoFile) {
        const result = await base44.integrations.Core.UploadFile({ file: photoFile });
        profilePicUrl = result.file_url;
      }
      // Upload license photos only if BOTH are selected (a partial license isn't useful)
      let licensePatch = {};
      if (licenseFront && licenseBack && !licenseSaved) {
        const [fr, br] = await Promise.all([
          base44.integrations.Core.UploadPrivateFile({ file: licenseFront }),
          base44.integrations.Core.UploadPrivateFile({ file: licenseBack }),
        ]);
        licensePatch = { drivers_license_front_url: fr.file_uri, drivers_license_back_url: br.file_uri, drivers_license_pending_review: true, license_submitted_date: new Date().toISOString() };
        setLicenseSaved(true);
        const u = await base44.auth.me();
        await base44.entities.AdminMessage.create({ recipient_id: 'admin', recipient_name: 'Admin', subject: `License Pending Review: ${u.full_name}`, message: `${u.full_name} (${u.email}) uploaded their license via the setup quiz.`, message_type: 'action_required' }).catch(() => null);
      }
      // Upload whichever vehicle photos are present, individually. This never crashes
      // on a partial set — previously calling saveVehicle() here threw if the driver
      // had uploaded the exterior but not yet the insurance/interior photos.
      const uploadIfPresent = (file) => file ? base44.integrations.Core.UploadPrivateFile({ file }).then(r => r.file_uri) : Promise.resolve(null);
      const [extUrl, ...intUrls] = await Promise.all([
        uploadIfPresent(vehicleExterior),
        ...vehicleInterior.map(f => uploadIfPresent(f)),
      ]);
      const insUrl = await uploadIfPresent(insurancePhoto);
      const vehiclePatch = {};
      if (isDriverPath) {
        if (extUrl) vehiclePatch.vehicle_exterior_photo_url = extUrl;
        if (intUrls.length) vehiclePatch.vehicle_interior_photo_urls = intUrls;
        if (insUrl) vehiclePatch.auto_policy_photo_url = insUrl;
      }
      // Persist everything entered so far — profile text, license, and any vehicle
      // photos/info — so nothing is lost when the user saves and comes back later.
      await base44.auth.updateMe({
        username: answers.username || user?.username || '',
        age: answers.age ? Number(answers.age) : (user?.age || undefined),
        gender: answers.gender || user?.gender || '',
        bio: answers.bio || user?.bio || '',
        phone_number: answers.phone_number || user?.phone_number || '',
        profile_picture_url: profilePicUrl,
        profile_quiz_saved_step: step,
        // Mark the quiz as completed so the user isn't permanently blocked
        // from booking/requesting rides by the "complete your profile" check.
        // This was the root cause of the "I did everything but still get told
        // to complete my profile" bug — the save-and-come-back path never
        // set has_completed_profile_quiz, so users who saved progress were
        // stuck in an infinite loop.
        has_completed_profile_quiz: true,
        profile_complete: !!(answers.username && answers.age && answers.gender && answers.bio && profilePicUrl),
        terms_accepted: true,
        privacy_policy_accepted: true,
        ...(isDriverPath && vehicleInfo.make ? {
          vehicle_make: vehicleInfo.make,
          vehicle_model: vehicleInfo.model,
          vehicle_year: vehicleInfo.year,
          vehicle_color: vehicleInfo.color,
          license_plate: vehicleInfo.license_plate,
          seats_available: parseInt(vehicleInfo.seats_available) || 4,
        } : {}),
        ...licensePatch,
        ...vehiclePatch,
      });
    } catch (e) {
      setError("couldn't save your progress — please try again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    // Fire onboarding email once (non-blocking)
    sendOnboardingEmail({}).catch(() => null);
    onComplete();
  };

  const progress = ((safeStep) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 shrink-0">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div ref={scrollRef} className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold tracking-widest uppercase text-primary">step {safeStep + 1} of {steps.length}</p>
            <button
              onClick={handleSaveAndComeBack}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium underline underline-offset-2 transition-colors"
            >
              save & come back later
            </button>
          </div>
          <h2 className="text-xl font-bold text-secondary mb-1">{current.title}</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">{current.subtitle}</p>

          {/* TERMS OF SERVICE */}
          {current.type === "terms_of_service" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary mb-1">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Cruise Kauaʻi Terms of Service</span>
              </div>
              <ScrollArea className="h-56 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 space-y-3">
                <div className="space-y-3 pr-2">
                  {[
                    ["1. Acceptance of Terms", "By accessing or using Cruise Kauaʻi, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, you must not access or use the platform."],
                    ["2. Platform Description", "Cruise Kauaʻi is a technology platform for voluntary, cost-sharing carpools. It is NOT a transportation provider, does not employ drivers, and does not own vehicles. All transportation is provided by independent users."],
                    ["3. No Agency or Employment", "No employment, agency, or partnership exists between Cruise Kauaʻi and any user. Drivers are independent individuals solely responsible for their conduct, vehicles, insurance, and legal compliance."],
                    ["4. Assumption of Risk", "USE OF THE PLATFORM INVOLVES INHERENT RISKS including personal injury, vehicle accidents, and property damage. By using Cruise Kauaʻi, you VOLUNTARILY ASSUME ALL SUCH RISKS to the fullest extent permitted by Hawaii law."],
                    ["5. Limitation of Liability", "Cruise Kauaʻi is not responsible for acts or omissions of users, vehicle condition, or outcomes of arrangements between community members. To the extent permitted by Hawaii law, Cruise Kauaʻi is not liable for claims from transportation activities."],
                    ["6. Driver Responsibilities", "Drivers must: maintain a safe, registered vehicle; hold a valid license; comply with all Hawaii laws; maintain required insurance; and ensure rides are cost-sharing only (not for profit or hire)."],
                    ["7. Passenger Responsibilities", "Passengers must act lawfully, responsibly, and respectfully; follow driver safety instructions; and refrain from illegal or unsafe conduct."],
                    ["8. Cost-Sharing Only", "Cruise Kauaʻi is for voluntary cost-sharing only. Drivers may only request reimbursement for actual trip costs. Commercial use is strictly prohibited."],
                    ["9. Waiver & Release", "To the fullest extent permitted by Hawaii law, you WAIVE AND RELEASE Cruise Kauaʻi from all claims arising from use of the platform or carpooling activities."],
                    ["10. Indemnification", "You agree to indemnify and hold harmless Cruise Kauaʻi from claims arising from your use of the platform, violations of these Terms, or your carpooling activities."],
                    ["11. Governing Law", "These Terms are governed by the laws of the State of Hawaii. Disputes are resolved through binding arbitration in Kauaʻi County, Hawaii."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="font-semibold text-secondary">{title}</p>
                      <p className="leading-relaxed mt-0.5">{body}</p>
                    </div>
                  ))}
                  <p className="italic text-gray-400 pt-2">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>
              </ScrollArea>
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl">
                <Checkbox id="termsAgreed" checked={termsAgreed} onCheckedChange={() => { setTermsAgreed(v => !v); setError(""); }} className="mt-0.5 shrink-0" />
                <Label htmlFor="termsAgreed" className="cursor-pointer text-sm font-semibold text-green-800 leading-tight">I have read and agree to the Terms of Service</Label>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {current.type === "privacy_policy" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary mb-1">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Cruise Kauaʻi Privacy Policy</span>
              </div>
              <ScrollArea className="h-56 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                <div className="space-y-3 pr-2">
                  {[
                    ["1. Information We Collect", "We collect: account info (name, email, age, gender, username), verification documents (license, vehicle, insurance), payment info (via Stripe), trip details, messages, and usage data."],
                    ["2. How We Use It", "We use your information to facilitate ride connections, process payments, verify driver credentials, improve safety, send booking notifications, provide support, and comply with legal obligations."],
                    ["3. Information Sharing", "We share info with other users (profile/ratings), service providers (Stripe), and as required by law. We do NOT sell your personal information to third parties."],
                    ["4. Data Security", "We use industry-standard security including encryption in transit and at rest, PCI-compliant payment processing, and access controls. No method is 100% secure."],
                    ["5. Your Rights", "You have the right to access, correct, or request deletion of your data; opt out of marketing; and export your data. Contact us through the Contact Us page."],
                    ["6. Children's Privacy", "Cruise Kauaʻi is only available to users 18 and older. We do not knowingly collect information from minors."],
                    ["7. Changes", "We may update this Privacy Policy periodically and will notify users of significant changes through the app or email."],
                    ["8. Contact", "For privacy questions, please use our Contact Us page at cruisekauai.org."],
                  ].map(([title, body]) => (
                    <div key={title}>
                      <p className="font-semibold text-secondary">{title}</p>
                      <p className="leading-relaxed mt-0.5">{body}</p>
                    </div>
                  ))}
                  <p className="italic text-gray-400 pt-2">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>
              </ScrollArea>
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl">
                <Checkbox id="privacyAgreed" checked={privacyAgreed} onCheckedChange={() => { setPrivacyAgreed(v => !v); setError(""); }} className="mt-0.5 shrink-0" />
                <Label htmlFor="privacyAgreed" className="cursor-pointer text-sm font-semibold text-green-800 leading-tight">I have read and agree to the Privacy Policy</Label>
              </div>
            </div>
          )}

          {/* PUSH NOTIFICATIONS */}
          {current.type === "push_notifications" && (
            <div className="space-y-4">
              {notifStatus === 'granted' || ('Notification' in window && Notification.permission === 'granted') ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-semibold text-green-700">Push notifications enabled!</p>
                  <p className="text-sm text-gray-500">You'll be notified about bookings and messages.</p>
                </div>
              ) : notifStatus === 'denied' ? (
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-700">Notifications blocked</p>
                    <p className="text-sm text-gray-500">You can enable them later in your browser settings or from your account page.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-secondary">Stay in the loop</p>
                      <p className="text-sm text-gray-500 leading-relaxed">Enable notifications so you never miss a ride request, booking confirmation, or message from another member.</p>
                    </div>
                  </div>
                  <Button onClick={handleEnableNotifications} className="w-full bg-primary hover:bg-primary/90 rounded-2xl py-5 font-bold">
                    <Bell className="w-4 h-4 mr-2" /> enable notifications
                  </Button>
                  <button
                    onClick={() => { setError(""); setStep(safeStep + 1); }}
                    className="w-full text-center text-sm text-gray-400 hover:text-primary font-medium underline underline-offset-2 transition-colors"
                  >
                    skip for now →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PHONE */}
          {current.type === "phone" && (
            <div className="space-y-3">
              <Input
                type="tel"
                value={answers.phone_number}
                onChange={(e) => setAnswers({ ...answers, phone_number: e.target.value })}
                placeholder="e.g. (808) 555-1234"
                className="rounded-2xl text-base py-5"
                autoFocus
              />
              <button
                onClick={() => { setError(""); setStep(safeStep + 1); }}
                className="w-full text-center text-sm text-gray-400 hover:text-primary font-medium underline underline-offset-2 transition-colors"
              >
                skip for now — i'll add it later →
              </button>
            </div>
          )}

          {/* TEXT */}
          {current.type === "text" && (
            <div className="space-y-2">
              <Input value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} className="rounded-2xl text-base py-5" autoFocus />
              {current.field === "username" && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0 cursor-help" title="Your username and account name must match the name printed on your driver's license, state ID, or insurance card so our team can verify your identity. Mismatched names cause verification to fail and delay your first ride." />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-semibold">Match your ID.</span> Enter your name <span className="font-semibold">exactly as it appears on your insurance card</span> or driver's license. We verify your identity later — mismatched names fail verification and block your first ride.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NUMBER */}
          {current.type === "number" && (
            <Input type="number" min={current.min || 1} value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} className="rounded-2xl text-base py-5 max-w-[140px]" autoFocus />
          )}

          {/* TEXTAREA */}
          {current.type === "textarea" && (
            <textarea value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} rows={4} className="w-full rounded-2xl border border-input px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none" autoFocus />
          )}

          {/* ISLAND */}
          {current.type === "island" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "Kauai", label: "Kauaʻi", emoji: "🌿", available: true },
                { value: "Oahu", label: "Oʻahu", emoji: "🌺", available: false },
                { value: "Maui", label: "Maui", emoji: "🌊", available: false },
                { value: "Big Island", label: "Big Island", emoji: "🌋", available: false },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers({ ...answers, preferred_island: opt.value })}
                  className={`py-4 px-4 rounded-2xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${answers.preferred_island === opt.value ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50"}`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {!opt.available && <span className="text-xs text-gray-400 font-normal">coming soon</span>}
                </button>
              ))}
            </div>
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
              {[{ label: "Front of license / ID *", file: licenseFront, ref: licenseFrontRef, set: setLicenseFront, saved: user?.drivers_license_front_url }, { label: "Back of license / ID *", file: licenseBack, ref: licenseBackRef, set: setLicenseBack, saved: user?.drivers_license_back_url }].map(({ label, file, ref, set, saved }) => (
                <div key={label} className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <div onClick={() => ref.current?.click()} className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : saved ? 'border-green-300 bg-green-50/50' : 'border-gray-300 hover:border-primary/50'}`}>
                    <input ref={ref} type="file" accept="image/*" onChange={(e) => { set(e.target.files[0]); setError(""); }} className="hidden" />
                    {file ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                        <span className="text-sm text-green-700 font-semibold">uploaded: {file.name}</span>
                        <span className="text-xs text-green-500">tap to change</span>
                      </div>
                    ) : saved ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                        <span className="text-sm text-green-700 font-semibold">✓ already uploaded</span>
                        <span className="text-xs text-green-500">tap to replace</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-sm text-gray-500">tap to upload</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">What you'll need:</p>
                <ul className="space-y-0.5"><li>• A valid driver's license or government-issued ID</li><li>• Clear, well-lit photos of both sides</li><li>• All text must be readable</li></ul>
              </div>
              <p className="text-xs text-gray-400 text-center">🔒 Encrypted and secure.</p>
              <button
                onClick={() => { setError(""); setStep(safeStep + 1); }}
                className="w-full text-center text-sm text-gray-400 hover:text-primary font-medium underline underline-offset-2 transition-colors pt-1"
              >
                skip for now — i'll upload it later →
              </button>
            </div>
          )}

          {/* DRIVER CHOICE */}
          {current.type === "driver_choice" && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <button onClick={() => handleDriverChoice(true)} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left">
                  <Car className="w-8 h-8 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-primary text-base">yes, help me set up my driver account</p>
                    <p className="text-gray-500 text-sm mt-0.5">Upload your vehicle info, insurance, and sign the driver agreement. Earn money on trips you're already making.</p>
                  </div>
                </button>
                <button onClick={() => handleDriverChoice(false)} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100/60 transition-all text-left">
                  <MapPin className="w-8 h-8 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-600 text-base">no, take me to view all rides</p>
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
                { label: "Outside of vehicle *", file: vehicleExterior, ref: vehicleExtRef, set: setVehicleExterior, multiple: false, saved: user?.vehicle_exterior_photo_url },
                { label: "Inside of vehicle * (select multiple)", file: vehicleInterior.length > 0 ? { name: `${vehicleInterior.length} photo(s) selected` } : null, ref: vehicleIntRef, set: (files) => setVehicleInterior(Array.from(files)), multiple: true, saved: user?.vehicle_interior_photo_urls?.length ? `${user.vehicle_interior_photo_urls.length} photo(s) saved` : null },
                { label: "Insurance card * (front & back)", file: insurancePhoto, ref: insuranceRef, set: setInsurancePhoto, multiple: false, saved: user?.auto_policy_photo_url },
              ].map(({ label, file, ref, set, multiple, saved }) => (
                <div key={label} className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <div onClick={() => ref.current?.click()} className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : saved ? 'border-green-300 bg-green-50/50' : 'border-gray-300 hover:border-primary/50'}`}>
                    <input ref={ref} type="file" accept="image/*" multiple={multiple} onChange={(e) => { multiple ? set(e.target.files) : set(e.target.files[0]); setError(""); }} className="hidden" />
                    {file ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                        <span className="text-sm text-green-700 font-semibold">✓ {file.name}</span>
                        <span className="text-xs text-green-500">tap to change</span>
                      </div>
                    ) : saved ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                        <span className="text-sm text-green-700 font-semibold">✓ already uploaded</span>
                        <span className="text-xs text-green-500">tap to replace</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-sm text-gray-500">tap to upload</span>
                      </>
                    )}
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
            {safeStep > 0 && (
              <Button variant="outline" onClick={() => { setError(""); setStep(safeStep - 1); }} className="rounded-full px-6 py-6 font-bold border-gray-300 text-gray-600">
                ← back
              </Button>
            )}
            {current.type !== "driver_choice" && (
              <Button onClick={handleNext} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-base font-bold">
                {saving ? "saving..." : safeStep === steps.length - 1 ? "finish & save ✓" : <span className="flex items-center justify-center gap-2">next <ChevronRight className="w-4 h-4" /></span>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}