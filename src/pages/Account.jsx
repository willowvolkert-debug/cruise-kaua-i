import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Star, Edit, Save, MessageCircle, Wind, Upload, Clock, FileText, Shield, HandHeart, Camera, ChevronRight, ChevronDown, DollarSign, LogOut, UserPlus, MapPin, Calendar, PartyPopper, Music, Car } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LicenseVerificationModal from "../components/account/LicenseVerificationModal";
import TruckLoader from "@/components/TruckLoader";
import TransactionHistory from "../components/payment/TransactionHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnableNotificationsModal from "../components/notifications/EnableNotificationsModal";
import { requestNotificationPermission } from "../components/utils/notifications";
import AdminMessageCard from "../components/inbox/AdminMessageCard";
import ProfileSetupQuiz from "../components/account/ProfileSetupQuiz";
import ProfileChecklist, { getProfileChecklist } from "../components/account/ProfileChecklist";
import WelcomeTutorialModal from "../components/tutorial/WelcomeTutorialModal";
import SignupInfoCard from "../components/account/SignupInfoCard";
import PostSignupCard from "../components/account/PostSignupCard";
import SmsSettingsCard from "../components/account/SmsSettingsCard";
import NotificationPreferencesCard from "../components/account/NotificationPreferencesCard";
import { deleteAccount } from "../functions/deleteAccount";
import { Trash2, AlertTriangle } from "lucide-react";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

const RatingsList = ({ ratings, title }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const averageRating = ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + r.rating_value, 0) / ratings.length).toFixed(1)
        : 'N/A';
    
    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <h4 className="font-heading tracking-widest text-xl text-secondary">{title}</h4>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-gray-700">{averageRating}</span>
                        <span className="text-sm text-gray-500">({ratings.length})</span>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="space-y-3 pl-4">
                    {ratings.length > 0 ? ratings.map(rating => (
                        <div key={rating.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {Array(rating.rating_value).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                                    {Array(5 - rating.rating_value).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 text-gray-300" />)}
                                </div>
                                <span className="text-xs text-gray-500">{format(new Date(rating.created_date), "MMM yyyy")}</span>
                            </div>
                            <p className="text-gray-700 italic">"{rating.comment}"</p>
                        </div>
                    )) : <p className="text-sm text-gray-500">No ratings yet.</p>}
                </div>
            )}
        </div>
    );
};

export default function AccountPage() {
    const [user, setUser] = useState(null);
    const [ridesGiven, setRidesGiven] = useState([]);
    const [ridesTaken, setRidesTaken] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allRidesData, setAllRidesData] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editMode, setEditMode] = useState('guided');
    const [expandedToFull, setExpandedToFull] = useState(false);
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [showPayoutSection, setShowPayoutSection] = useState(false);
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
    const [payoutError, setPayoutError] = useState(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [bankDetails, setBankDetails] = useState({
        account_holder_name: '',
        routing_number: '',
        account_number: '',
        account_number_confirm: ''
    });
    const [availableBalance, setAvailableBalance] = useState(0);
    const [isTransferring, setIsTransferring] = useState(false);
    const [showBankForm, setShowBankForm] = useState(false);
    const [acceptedRideAlert, setAcceptedRideAlert] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [adminMessages, setAdminMessages] = useState([]);
    const [showProfileQuiz, setShowProfileQuiz] = useState(false);
    const [profileQuizSavedStep, setProfileQuizSavedStep] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showSignupInfoCard, setShowSignupInfoCard] = useState(false);
    const [showPostSignupCard, setShowPostSignupCard] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDriverOnboarding, setShowDriverOnboarding] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        
        // If redirected from signup flow, force open the profile quiz
        if (urlParams.get('setup') === 'true') {
            setShowProfileQuiz(true);
        }
        
        loadData();
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }

        const handleOpenTutorial = () => setShowTutorial(true);
        window.addEventListener('openTutorial', handleOpenTutorial);
        return () => window.removeEventListener('openTutorial', handleOpenTutorial);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            let currentUser;
            try {
                currentUser = await base44.auth.me();
            } catch (firstAttempt) {
                // Token race condition: right after login + page reload,
                // the first me() call can fail with 401 before the token fully propagates
                // to the axios client. Retry with increasing delays.
                const hasToken = !!(localStorage.getItem('base44_access_token') || localStorage.getItem('token'));
                if (!hasToken) throw firstAttempt; // No token at all — genuine auth failure
                // Token exists but me() failed — likely a propagation delay. Retry up to 3 times.
                let lastErr = firstAttempt;
                for (let i = 0; i < 3; i++) {
                    await new Promise(r => setTimeout(r, 1500));
                    try {
                        currentUser = await base44.auth.me();
                        break;
                    } catch (retryErr) {
                        lastErr = retryErr;
                    }
                }
                if (!currentUser) throw lastErr;
            }
            setUser(currentUser);
            setProfileQuizSavedStep(currentUser.profile_quiz_saved_step || 0);
            // Show quiz if user hasn't completed it, or if forced via URL param
            const urlParams2 = new URLSearchParams(window.location.search);
            const forceQuiz = urlParams2.get('reopen_quiz') === 'true';
            if (!currentUser.has_completed_profile_quiz || forceQuiz) {
                if (forceQuiz) await base44.auth.updateMe({ has_completed_profile_quiz: false });
                // New flow: SignupInfoCard → Welcome Tutorial → Profile Quiz
                if (!currentUser.has_seen_signup_info_card && !forceQuiz) {
                    setShowSignupInfoCard(true);
                } else if (!currentUser.has_seen_post_signup_card && !forceQuiz) {
                    setShowPostSignupCard(true);
                } else if (!currentUser.has_dismissed_welcome_modal && !forceQuiz) {
                    setShowTutorial(true);
                } else {
                    setShowProfileQuiz(true);
                }
            } else if (currentUser.vehicle_make || currentUser.vehicle_exterior_photo_url) {
                // Already completed onboarding AND submitted a vehicle — don't reopen the quiz.
                // ?setup=true in the URL can force it open, which would show empty vehicle fields
                // and risk overwriting their saved driver documents.
                setShowProfileQuiz(false);
            }
            setEditData({
                email: currentUser.email || '',
                username: currentUser.username || '',
                bio: currentUser.bio || '',
                age: currentUser.age || '',
                gender: currentUser.gender || '',
                home_base: currentUser.home_base || '',
                preferences_chattiness: currentUser.preferences_chattiness || 'Flexible',
                preferences_scents: currentUser.preferences_scents || 'Any',
                preferences_music: ['No music','Soft/chill','Any genre','Flexible'].includes(currentUser.preferences_music) ? currentUser.preferences_music : (currentUser.preferences_music ? 'custom' : 'Flexible'),
                preferences_music_custom: ['No music','Soft/chill','Any genre','Flexible'].includes(currentUser.preferences_music) ? '' : (currentUser.preferences_music || ''),
                phone_number: currentUser.phone_number || '',
                sms_notifications_enabled: currentUser.sms_notifications_enabled || false
            });
            


            if (currentUser.bank_account_linked) {
                setBankDetails({
                    account_holder_name: currentUser.bank_account_holder_name || '',
                    routing_number: currentUser.bank_routing_number ? '****' + currentUser.bank_routing_number.slice(-4) : '',
                    account_number: currentUser.bank_account_number ? '****' + currentUser.bank_account_number.slice(-4) : '',
                    account_number_confirm: ''
                });
            }

            const allRides = await base44.entities.Ride.list('-created_date', 500);
            const allBookings = await base44.entities.RideBooking.list('-created_date', 500);
            const allRatings = await base44.entities.Rating.list('-created_date', 500);

            setAllRidesData(allRides);
            setRidesGiven(allRides.filter(r => r.driver_id === currentUser.id));
            const takenRideIds = allBookings.filter(b => b.passenger_id === currentUser.id).map(b => b.ride_id);
            setRidesTaken(allRides.filter(r => takenRideIds.includes(r.id)));
            setRatings(allRatings.filter(r => r.rated_user_id === currentUser.id));

            // Get pending requests for this driver
            const myRideIds = allRides.filter(r => String(r.driver_id) === String(currentUser.id)).map(r => r.id);
            const pendingBookingRequests = allBookings.filter(b => 
                myRideIds.includes(b.ride_id) && 
                b.booking_status === 'pending' &&
                b.payment_status === 'paid'
            );
            setPendingRequests(pendingBookingRequests);

            // Load admin messages for this user
            const allAdminMessages = await base44.entities.AdminMessage.list('-created_date');
            const myAdminMessages = allAdminMessages.filter(m => m.recipient_id === currentUser.id && !m.is_read);
            setAdminMessages(myAdminMessages);

            // Calculate available balance from completed transactions where user is recipient
            const allTransactions = await base44.entities.Transaction.list();
            const earnings = allTransactions
                .filter(t => t.recipient_id === currentUser.id && t.transaction_status === 'completed')
                .reduce((sum, t) => sum + (t.ride_amount || 0), 0);
            const payouts = currentUser.total_payouts || 0;
            setAvailableBalance(Math.max(0, earnings - payouts));
            
            // Check for recently accepted bookings (confirmed within last 5 minutes)
            const recentlyAccepted = allBookings.find(b => 
                String(b.passenger_id) === String(currentUser.id) &&
                b.booking_status === 'confirmed' &&
                b.payment_status === 'paid' &&
                new Date() - new Date(b.updated_date) < 5 * 60 * 1000
            );
            
            if (recentlyAccepted) {
                const acceptedRide = allRides.find(r => r.id === recentlyAccepted.ride_id);
                if (acceptedRide) {
                    setAcceptedRideAlert(acceptedRide);
                }
            }

        } catch (e) {
            console.error(e);
            const is401 = e?.status === 401 || e?.response?.status === 401;
            if (is401) {
                // Check if a token exists — if so, the 401 is likely a SDK client
                // initialization race (token in localStorage/URL but not picked up
                // by the client at module-init). Reload ONCE to re-init the client.
                // Use sessionStorage to prevent infinite reload loops.
                const hasToken = !!(localStorage.getItem('base44_access_token') || localStorage.getItem('token'));
                const urlToken = new URLSearchParams(window.location.search).get('access_token');
                const reloadKey = 'account_401_reload';
                const alreadyReloaded = sessionStorage.getItem(reloadKey);
                if ((hasToken || urlToken) && !alreadyReloaded) {
                    sessionStorage.setItem(reloadKey, '1');
                    window.location.reload();
                    return;
                }
                sessionStorage.removeItem(reloadKey);
                const next = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/join?login=true&next=${next}`;
                return;
            }
        }
        sessionStorage.removeItem('account_401_reload');
        setIsLoading(false);
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicFile(file);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        let profilePicUrl = user.profile_picture_url || '';

        if (profilePicFile) {
            const uploadResult = await base44.integrations.Core.UploadFile({ file: profilePicFile });
            profilePicUrl = uploadResult.file_url;
        }

        const resolvedMusic = editData.preferences_music === 'custom' ? (editData.preferences_music_custom || '') : editData.preferences_music;
        const saveData = { ...editData, preferences_music: resolvedMusic };
        delete saveData.preferences_music_custom;
        // Persist phone fields explicitly
        saveData.phone_number = editData.phone_number || '';
        saveData.sms_notifications_enabled = !!editData.sms_notifications_enabled;
        // Only include email if it changed
        if (editData.email && editData.email !== user.email) {
          saveData.email = editData.email;
        }

        const isProfileComplete = !!(editData.username && editData.bio && editData.age && editData.gender && profilePicUrl);

        // Track what changed
        const oldValues = {
            username: user.username,
            bio: user.bio,
            age: user.age,
            gender: user.gender,
            preferences_chattiness: user.preferences_chattiness,
            preferences_scents: user.preferences_scents,
            profile_picture_url: user.profile_picture_url
        };
        const newValues = {
            username: editData.username,
            bio: editData.bio,
            age: editData.age,
            gender: editData.gender,
            preferences_chattiness: editData.preferences_chattiness,
            preferences_scents: editData.preferences_scents,
            profile_picture_url: profilePicUrl
        };

        // Log the profile edit
        await base44.entities.UserEdit.create({
            user_id: user.id,
            user_name: user.full_name,
            user_email: user.email,
            change_type: "profile",
            change_description: `Updated profile information`,
            old_values: oldValues,
            new_values: newValues
        });

        await base44.auth.updateMe({
            ...saveData,
            profile_picture_url: profilePicUrl,
            profile_complete: isProfileComplete
        });

        // Check all requirements and auto-upgrade
        const updatedUser = await base44.auth.me();
        const agreementsComplete = updatedUser.terms_accepted && updatedUser.privacy_policy_accepted && updatedUser.community_agreement_accepted;
        const notificationsOn = updatedUser.notifications_enabled;
        const canBeRider = isProfileComplete && updatedUser.drivers_license_verified && agreementsComplete && notificationsOn;
        const canBeDriver = canBeRider && updatedUser.vehicle_verified;

        if (canBeDriver && updatedUser.user_type !== 'driver') {
            await base44.auth.updateMe({ user_type: 'driver' });
        } else if (canBeRider && (!updatedUser.user_type || updatedUser.user_type === 'new')) {
            await base44.auth.updateMe({ user_type: 'rider' });
        }

        // If a phone number was just added for the first time, send welcome SMS
        if (editData.phone_number && !user.phone_number && editData.sms_notifications_enabled) {
            import('@/functions/sendWelcomeSms').then(({ sendWelcomeSms }) => {
                sendWelcomeSms({}).catch(() => {});
            }).catch(() => {});
        }

        await loadData();
        setIsEditing(false);
        setEditMode('guided');
        setExpandedToFull(false);
        setProfilePicFile(null);
        setIsSaving(false);
    };

    const handleLicenseVerificationSuccess = async () => {
        await loadData();
        // Check all requirements and auto-upgrade
        const updatedUser = await base44.auth.me();
        const agreementsComplete = updatedUser.terms_accepted && updatedUser.privacy_policy_accepted && updatedUser.community_agreement_accepted;
        const notificationsOn = updatedUser.notifications_enabled;
        const canBeRider = updatedUser.profile_complete && updatedUser.drivers_license_verified && agreementsComplete && notificationsOn;
        const canBeDriver = canBeRider && updatedUser.vehicle_verified;

        if (canBeDriver && updatedUser.user_type !== 'driver') {
            await base44.auth.updateMe({ user_type: 'driver' });
        } else if (canBeRider && (!updatedUser.user_type || updatedUser.user_type === 'new')) {
            await base44.auth.updateMe({ user_type: 'rider' });
        }
    };

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            setNotificationsEnabled(true);
            await base44.auth.updateMe({ notifications_enabled: true });

            // Check all requirements and auto-upgrade
            const updatedUser = await base44.auth.me();
            const agreementsComplete = updatedUser.terms_accepted && updatedUser.privacy_policy_accepted && updatedUser.community_agreement_accepted;
            const canBeRider = updatedUser.profile_complete && updatedUser.drivers_license_verified && agreementsComplete && true;
            const canBeDriver = canBeRider && updatedUser.vehicle_verified;

            if (canBeDriver && updatedUser.user_type !== 'driver') {
                await base44.auth.updateMe({ user_type: 'driver' });
            } else if (canBeRider && (!updatedUser.user_type || updatedUser.user_type === 'new')) {
                await base44.auth.updateMe({ user_type: 'rider' });
            }

            await loadData();
            alert("Notifications enabled! You'll receive updates about your trips.");
        } else {
            setShowNotificationModal(true);
        }
    };

    const handleBankDetailsSubmit = async () => {
        setPayoutError(null);
        
        if (!bankDetails.account_holder_name || !bankDetails.routing_number || !bankDetails.account_number) {
            setPayoutError("Please fill in all required fields.");
            return;
        }

        // Only validate full numbers for new entries (not the masked ****XXXX display)
        const isNewEntry = !user.bank_account_linked;
        if (isNewEntry) {
            if (bankDetails.routing_number.length !== 9 || isNaN(bankDetails.routing_number)) {
                setPayoutError("Routing number must be exactly 9 digits.");
                return;
            }
            if (bankDetails.account_number.length < 4 || isNaN(bankDetails.account_number)) {
                setPayoutError("Please enter a valid account number.");
                return;
            }
        }

        if (!user.bank_account_linked && bankDetails.account_number !== bankDetails.account_number_confirm) {
            setPayoutError("Account numbers do not match.");
            return;
        }

        setIsSubmittingPayout(true);
        try {
            // Log the bank account change
            await base44.entities.UserEdit.create({
                user_id: user.id,
                user_name: user.full_name,
                user_email: user.email,
                change_type: "bank_account",
                change_description: user.bank_account_linked ? `Updated bank account information` : `Linked new bank account`,
                old_values: {
                    account_holder_name: user.bank_account_holder_name || null,
                    last4: user.bank_account_number ? user.bank_account_number.slice(-4) : null
                },
                new_values: {
                    account_holder_name: bankDetails.account_holder_name,
                    last4: bankDetails.account_number.slice(-4)
                }
            });

            // Only store last 4 digits — never persist full account/routing numbers
            await base44.auth.updateMe({
                bank_account_linked: true,
                bank_account_holder_name: bankDetails.account_holder_name,
                bank_routing_number: bankDetails.routing_number.slice(-4),
                bank_account_number: bankDetails.account_number.slice(-4),
                bank_account_verified: true
            });

            alert("Bank account successfully linked! You'll receive payouts to this account.");
            await loadData();
            setShowPayoutSection(false);
        } catch (error) {
            console.error("Error linking bank account:", error);
            setPayoutError("Failed to link bank account. Please try again.");
        }
        setIsSubmittingPayout(false);
    };

    const handleTransferFunds = async () => {
        if (availableBalance <= 0) {
            alert("No funds available to transfer.");
            return;
        }
        if (!user.bank_account_linked) {
            alert("Please link a bank account first.");
            setShowBankForm(true);
            return;
        }

        setIsTransferring(true);
        try {
            // Record the payout
            const newTotalPayouts = (user.total_payouts || 0) + availableBalance;
            await base44.auth.updateMe({ total_payouts: newTotalPayouts });
            
            // In a real app, this would trigger an actual bank transfer via Stripe Connect
            alert(`$${availableBalance.toFixed(2)} has been transferred to your bank account. It may take 2-3 business days to arrive.`);
            setAvailableBalance(0);
            await loadData();
        } catch (error) {
            console.error("Error transferring funds:", error);
            alert("Failed to transfer funds. Please try again.");
        }
        setIsTransferring(false);
    };

    if (isLoading) return <TruckLoader />;
    
    if (!user) return null;
    
    const driverRatings = ratings.filter(r => r.trip_role === 'driver');
    const passengerRatings = ratings.filter(r => r.trip_role === 'passenger');

    const profileComplete = user.username && user.bio && user.age && user.gender && user.profile_picture_url;
    const agreementsComplete = user.terms_accepted && user.privacy_policy_accepted && user.community_agreement_accepted;

    return (
        <div className="p-4 md:p-8 bg-white">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                    <CardContent className="px-0 py-6">
                        {isEditing && (
                            <div className="flex justify-end mb-4 gap-2">
                                <Button variant="outline" onClick={() => { setIsEditing(false); setProfilePicFile(null); setEditMode('guided'); setExpandedToFull(false); }} className="rounded-2xl border-gray-300 text-gray-600">cancel</Button>
                                <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-2xl">
                                    {isSaving ? <><span className="animate-spin mr-2">⏳</span>saving...</> : <><Save className="w-4 h-4 mr-2"/>save changes</>}
                                </Button>
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                    <Avatar className="w-24 h-24 text-3xl rounded-2xl">
                                        <AvatarImage src={profilePicFile ? URL.createObjectURL(profilePicFile) : user.profile_picture_url} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white font-bold rounded-2xl">
                                            {getInitials(user.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <label htmlFor="profile-pic" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 shadow-lg">
                                            <Camera className="w-4 h-4" />
                                            <input
                                                id="profile-pic"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProfilePicChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                {isEditing && (
                                    profilePicFile ? (
                                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-1">
                                            ✓ photo ready to save
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-1">tap to change photo</p>
                                    )
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h2 className="cruise-head text-4xl text-secondary">
                                    {user.username ? `@${user.username}` : (user.full_name || user.email?.split('@')[0] || 'Cruise member')}
                                </h2>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {editMode === 'guided' && !expandedToFull && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
                                                filling in a few missing details to help you get the most out of Cruise Hawaiʻi
                                            </div>
                                        )}
                                        
                                        {/* Email — only shown in full mode */}
                                        {editMode === 'full' && (
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input 
                                                    value={editData.email || ''} 
                                                    onChange={(e) => setEditData({...editData, email: e.target.value})} 
                                                    placeholder="your@email.com"
                                                    className="max-w-xs rounded-2xl"
                                                    type="email"
                                                />
                                                <p className="text-xs text-gray-500">Changing your email will send a verification to the new address.</p>
                                            </div>
                                        )}
                                        
                                        {/* Username — show if missing (guided) or always (full) */}
                                        {(editMode === 'full' || !user.username || expandedToFull) && (
                                            <div className="space-y-2">
                                                <Label>Username *</Label>
                                                <Input 
                                                    value={editData.username} 
                                                    onChange={(e) => setEditData({...editData, username: e.target.value})} 
                                                    placeholder="username"
                                                    className="max-w-xs rounded-2xl"
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Age + Gender — show if missing (guided) or always (full) */}
                                        {(editMode === 'full' || !user.age || !user.gender || expandedToFull) && (
                                            <div className="grid grid-cols-2 gap-4 max-w-xs">
                                                {(editMode === 'full' || !user.age || expandedToFull) && (
                                                    <div className="space-y-2">
                                                        <Label>Age *</Label>
                                                        <Input 
                                                            type="number"
                                                            min="18"
                                                            value={editData.age} 
                                                            onChange={(e) => setEditData({...editData, age: parseInt(e.target.value)})} 
                                                            placeholder="Age"
                                                            className="rounded-2xl"
                                                        />
                                                    </div>
                                                )}
                                                {(editMode === 'full' || !user.gender || expandedToFull) && (
                                                    <div className="space-y-2">
                                                        <Label>Gender *</Label>
                                                        <Select 
                                                            value={editData.gender} 
                                                            onValueChange={(v) => setEditData({...editData, gender: v})}
                                                        >
                                                            <SelectTrigger className="rounded-2xl">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl">
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="non-binary">Non-binary</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Bio — show if missing (guided) or always (full) */}
                                        {(editMode === 'full' || !user.bio || expandedToFull) && (
                                            <div className="space-y-2">
                                                <Label>Bio *</Label>
                                                <p className="text-sm text-gray-600">
                                                    Tell us a bit about yourself and why you're using Cruise Hawaiʻi!
                                                </p>
                                                <Textarea 
                                                    value={editData.bio} 
                                                    onChange={(e) => setEditData({...editData, bio: e.target.value})} 
                                                    placeholder="Tell us about yourself..."
                                                    className="rounded-2xl"
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Expand to full button — shown when all required fields are now filled */}
                                        {editMode === 'guided' && !expandedToFull && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => { setEditMode('full'); setExpandedToFull(true); }}
                                                disabled={!editData.username || !editData.bio || !editData.age || !editData.gender}
                                                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 rounded-2xl text-sm"
                                            >
                                                show all fields →
                                            </Button>
                                        )}
                                        
                                        {/* Full mode fields */}
                                        {editMode === 'full' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>home base</Label>
                                                    <Input 
                                                        value={editData.home_base} 
                                                        onChange={(e) => setEditData({...editData, home_base: e.target.value})} 
                                                        placeholder="e.g., Koloa, Lihue, Hanalei"
                                                        className="rounded-2xl"
                                                    />
                                                    <p className="text-xs text-gray-500">Your home town on Kauai (optional) - you'll get notifications for ride requests in your area</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>📱 phone number for text alerts</Label>
                                                    <Input 
                                                        value={editData.phone_number || ''} 
                                                        onChange={(e) => setEditData({...editData, phone_number: e.target.value})} 
                                                        placeholder="e.g., (808) 555-1234"
                                                        className="rounded-2xl"
                                                        type="tel"
                                                    />
                                                    <div className="flex items-start gap-2 mt-2">
                                                        <input
                                                            type="checkbox"
                                                            id="sms-opt-in"
                                                            checked={!!editData.sms_notifications_enabled}
                                                            onChange={(e) => setEditData({...editData, sms_notifications_enabled: e.target.checked})}
                                                            className="mt-0.5 h-4 w-4 rounded border-gray-400 accent-green-700 cursor-pointer"
                                                        />
                                                        <label htmlFor="sms-opt-in" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                                                            I agree to receive recurring automated transactional SMS text messages from <strong>Cruise Hawaiʻi</strong> at the number above (ride confirmations, reminders, and messages). Consent is not required to use the platform. Message &amp; data rates may apply. Reply <strong>STOP</strong> to unsubscribe, <strong>HELP</strong> for help. See our <a href="/sms-opt-in" className="text-green-700 underline" target="_blank">SMS Terms</a>.
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="space-y-4 pt-2">
                                                    <h4 className="font-heading tracking-widest text-xl text-secondary">preferences</h4>
                                                    <div className="space-y-2">
                                                        <Label className="flex items-center gap-2"><MessageCircle className="w-4 h-4"/>chattiness</Label>
                                                        <Select value={editData.preferences_chattiness} onValueChange={(v) => setEditData({...editData, preferences_chattiness: v})}>
                                                            <SelectTrigger className="rounded-2xl"><SelectValue/></SelectTrigger>
                                                            <SelectContent className="rounded-2xl"><SelectItem value="Quiet">quiet</SelectItem><SelectItem value="Chatty">chatty</SelectItem><SelectItem value="Flexible">flexible</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                       <Label className="flex items-center gap-2"><Wind className="w-4 h-4"/>scents</Label>
                                                       <Select value={editData.preferences_scents} onValueChange={(v) => setEditData({...editData, preferences_scents: v})}>
                                                           <SelectTrigger className="rounded-2xl"><SelectValue/></SelectTrigger>
                                                           <SelectContent className="rounded-2xl"><SelectItem value="None">none</SelectItem><SelectItem value="Light">light</SelectItem><SelectItem value="Any">any</SelectItem></SelectContent>
                                                       </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                       <Label className="flex items-center gap-2"><Music className="w-4 h-4"/>music</Label>
                                                       <Select value={editData.preferences_music} onValueChange={(v) => setEditData({...editData, preferences_music: v})}>
                                                           <SelectTrigger className="rounded-2xl"><SelectValue/></SelectTrigger>
                                                           <SelectContent className="rounded-2xl">
                                                               <SelectItem value="No music">no music</SelectItem>
                                                               <SelectItem value="Soft/chill">soft / chill</SelectItem>
                                                               <SelectItem value="Any genre">any genre</SelectItem>
                                                               <SelectItem value="Flexible">flexible</SelectItem>
                                                               <SelectItem value="custom">write in...</SelectItem>
                                                           </SelectContent>
                                                           </Select>
                                                           {editData.preferences_music === 'custom' && (
                                                           <Input
                                                               value={editData.preferences_music_custom || ''}
                                                               onChange={(e) => setEditData({...editData, preferences_music_custom: e.target.value})}
                                                               placeholder="e.g. Hawaiian, jazz, podcasts..."
                                                               className="rounded-2xl mt-2"
                                                           />
                                                           )}
                                                           </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {user.age && user.gender && (
                                            <p className="text-sm text-gray-500">{user.age} years old • {user.gender}</p>
                                        )}
                                        <p className="text-gray-600">{user.bio || "No bio yet. Click Edit Profile to add one!"}</p>
                                        {user.home_base && (
                                           <div className="flex items-center gap-2 mt-2">
                                               <MapPin className="w-4 h-4 text-gray-500"/>
                                               <span className="text-sm text-gray-600">home base:</span>
                                               <Badge variant="outline" className="rounded-2xl border-gray-300">{user.home_base}</Badge>
                                           </div>
                                        )}
                                        <div className="pt-2 space-y-2">
                                           <div className="flex items-center gap-2">
                                               <MessageCircle className="w-4 h-4 text-gray-500"/>
                                               <span className="text-sm text-gray-600">chattiness:</span>
                                               <Badge variant="outline" className="rounded-2xl border-gray-300">{user.preferences_chattiness}</Badge>
                                           </div>
                                           <div className="flex items-center gap-2">
                                               <Wind className="w-4 h-4 text-gray-500"/>
                                               <span className="text-sm text-gray-600">scents:</span>
                                               <Badge variant="outline" className="rounded-2xl border-gray-300">{user.preferences_scents}</Badge>
                                           </div>
                                           {user.preferences_music && (
                                             <div className="flex items-center gap-2">
                                               <Music className="w-4 h-4 text-gray-500"/>
                                               <span className="text-sm text-gray-600">music:</span>
                                               <Badge variant="outline" className="rounded-2xl border-gray-300">{user.preferences_music}</Badge>
                                             </div>
                                           )}
                                        </div>
                                    </>
                                )}
                                <p className="text-sm text-gray-400">joined {format(new Date(user.created_date), "MMMM yyyy")}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}
                                    </div>
                                ) : (
                                   <div className="flex flex-col gap-2">
                                       {getProfileChecklist(user).some((i) => !i.done) ? (
                                           <>
                                           <ProfileChecklist items={getProfileChecklist(user)} />
                                           <Button
                                               onClick={() => setShowProfileQuiz(true)}
                                               className="rounded-2xl animate-pulse bg-blue-600 hover:bg-blue-700 text-white"
                                           >
                                               ✨ finish profile
                                           </Button>
                                           </>
                                       ) : (
                                       <Button onClick={() => {
                                           const missingFields = !user.username || !user.bio || !user.age || !user.gender || !user.profile_picture_url;
                                           setEditMode(missingFields ? 'guided' : 'full');
                                           setExpandedToFull(false);
                                           setIsEditing(true);
                                       }} className="bg-primary hover:bg-primary/90 rounded-2xl">
                                           <Edit className="w-4 h-4 mr-2"/>edit profile
                                       </Button>
                                       )}
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 rounded-2xl text-sm"
                                            onClick={() => window.dispatchEvent(new CustomEvent('openTutorial'))}
                                        >
                                            🌺 re-watch welcome tutorial
                                        </Button>
                                       </div>
                                       )}
                            </div>
                        </div>
                        {user.drivers_license_verified && !user.license_rejection_reason && ridesTaken.length === 0 && (
                                                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex items-center gap-2">
                                                              <ShieldCheck className="w-5 h-5 text-green-600" />
                                                              <span><strong>Congrats!</strong> Your license is approved and you can now book rides.</span>
                                                          </div>
                                                      )}
                                                      {user.license_rejection_reason && !user.drivers_license_verified && (
                                                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm">
                                                              <strong>Sorry, your license was rejected.</strong> Reason: {user.license_rejection_reason}
                                                          </div>
                                                      )}
                                                      {user.drivers_license_pending_review && !user.drivers_license_verified && !user.license_rejection_reason && (
                                                          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-2xl text-gray-700 text-sm flex items-center gap-2">
                                                              <Clock className="w-5 h-5 text-gray-600" />
                                                              <span><strong>License pending review.</strong> You'll be notified once it's approved.</span>
                                                          </div>
                                                      )}
                                                      {user.vehicle_verified && ridesGiven.length === 0 && (
                                                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex items-center gap-2">
                                                              <ShieldCheck className="w-5 h-5 text-green-600" />
                                                              <span><strong>Vehicle approved!</strong> You can now post rides as a driver.</span>
                                                          </div>
                                                      )}
                                                      {user.vehicle_rejection_reason && !user.vehicle_verified && (
                                                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm">
                                                              <strong>Sorry, your vehicle was rejected.</strong> Reason: {user.vehicle_rejection_reason}
                                                          </div>
                                                      )}
                                                      {user.vehicle_pending_review && !user.vehicle_verified && !user.vehicle_rejection_reason && (
                                                          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-2xl text-gray-700 text-sm flex items-center gap-2">
                                                              <Clock className="w-5 h-5 text-gray-600" />
                                                              <span><strong>Vehicle pending review.</strong> You'll be notified once it's approved.</span>
                                                          </div>
                                                      )}
                                                      {!profileComplete && (
                                                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm">
                                                              <strong>Complete your profile:</strong> Username, bio, age, gender, and profile picture are required to book or post rides.
                                                          </div>
                                                      )}

                    </CardContent>
                </Card>

                {/* SMS Settings — lets every user opt in / opt out of text alerts */}
                <SmsSettingsCard user={user} onUpdated={loadData} />

                {/* Notification preferences (rides, grey skies, road alerts) */}
                <NotificationPreferencesCard user={user} onUserUpdate={(u) => setUser(u)} />

                {/* Admin Messages */}
                {adminMessages.length > 0 && (
                    <AdminMessageCard
                        adminMessages={adminMessages}
                        onMessageRead={loadData}
                        onReplySuccess={loadData}
                    />
                )}

                {/* Verification card — always shown below profile */}
                <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                    <CardHeader><CardTitle className="text-2xl font-heading tracking-widest text-secondary">verification</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {user.drivers_license_pending_review && !user.drivers_license_verified && (
                            <div className="p-3 bg-gray-100 border border-gray-300 rounded-2xl text-gray-700 text-sm">
                                <strong>thanks!</strong> you will be able to book rides once your identity is verified. check back soon for approval!
                            </div>
                        )}
                        {/* Driver's License */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                            <span className="font-medium">driver's license</span>
                            {user.drivers_license_verified ? (
                                <Button size="sm" variant="default" onClick={() => setShowLicenseModal(true)} className="bg-primary rounded-2xl border-primary hover:bg-primary/90">
                                    <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                </Button>
                            ) : (user.drivers_license_pending_review || user.drivers_license_front_url) ? (
                                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 rounded-2xl">
                                    <Clock className="w-4 h-4 mr-1"/>pending review
                                </Badge>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setShowLicenseModal(true)} className="rounded-2xl border-gray-300">
                                    <Upload className="w-4 h-4 mr-2"/>verify now
                                </Button>
                            )}
                        </div>
                        {/* Vehicle */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                            <span className="font-medium">vehicle</span>
                            {user.vehicle_verified ? (
                                <Link to={createPageUrl("VehicleDetails")}>
                                    <Badge variant="default" className="bg-primary border-primary cursor-pointer hover:bg-primary/90 rounded-2xl">
                                        <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                    </Badge>
                                </Link>
                            ) : (user.vehicle_pending_review || user.vehicle_exterior_photo_url) ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
                                    <Clock className="w-4 h-4 mr-1"/>pending review
                                </Badge>
                            ) : (
                                <Link to={createPageUrl("VehicleDetails")}>
                                    <Button size="sm" variant="outline" className="rounded-2xl border-gray-300">enter details</Button>
                                </Link>
                            )}
                        </div>
                        {/* Push Notifications */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                            <span className="font-medium">push notifications</span>
                            {notificationsEnabled ? (
                                <Badge variant="default" className="bg-primary border-primary rounded-2xl">
                                    <ShieldCheck className="w-4 h-4 mr-1"/>enabled
                                </Badge>
                            ) : (
                                <Button size="sm" variant="outline" onClick={handleEnableNotifications} className="rounded-2xl border-gray-300">
                                    enable now
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Become a Driver CTA — shown when user is not yet a verified driver */}
                {user.user_type !== 'driver' && !user.vehicle_verified && (
                    <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                        <CardContent className="p-6 text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                                <Car className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-heading tracking-widest text-secondary">become a driver 🚗</h3>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                    Earn money by sharing rides you're already making. Verify your vehicle, upload insurance, and sign the driver agreement to get started.
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    setShowDriverOnboarding(true);
                                    setShowProfileQuiz(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-3 font-bold"
                            >
                                get started →
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-8">
                    <div className="space-y-8">

                        {!agreementsComplete && (
                            <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                                <CardHeader><CardTitle className="text-2xl font-heading tracking-widest text-secondary">legal agreements</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">terms of service</span>
                                        </div>
                                        {user.terms_accepted ? (
                                            <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                        ) : (
                                            <Link to={createPageUrl("TermsOfService")}>
                                                <Button size="sm" variant="outline" className="rounded-2xl border-gray-300">review & accept</Button>
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">privacy policy</span>
                                        </div>
                                        {user.privacy_policy_accepted ? (
                                            <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                        ) : (
                                            <Link to={createPageUrl("PrivacyPolicy")}>
                                                <Button size="sm" variant="outline" className="rounded-2xl border-gray-300">review & accept</Button>
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <HandHeart className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">community agreement</span>
                                        </div>
                                        {user.community_agreement_accepted ? (
                                            <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                        ) : (
                                            <Link to={createPageUrl("CommunityAgreement")}>
                                                <Button size="sm" variant="outline" className="rounded-2xl border-gray-300">review & accept</Button>
                                            </Link>
                                        )}
                                    </div>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm">
                                        <strong>Required:</strong> You must accept all agreements before booking or posting rides.
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {pendingRequests.length > 0 && (
                            <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-2xl font-heading tracking-widest text-secondary">
                                        <UserPlus className="w-6 h-6 text-blue-600"/>
                                        pending ride requests ({pendingRequests.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-blue-700 mb-4">
                                        You have riders requesting to join your trips!
                                    </p>
                                    <div className="space-y-3">
                                        {pendingRequests.slice(0, 3).map(request => {
                                            const ride = allRidesData.find(r => r.id === request.ride_id);
                                            return (
                                                <div
                                                    key={request.id}
                                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                                                            <AvatarFallback className="text-white font-semibold text-sm">
                                                                {getInitials(request.passenger_name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-secondary">{request.passenger_name}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {request.seats_booked} seat(s) • ${request.total_amount?.toFixed(2)}
                                                            </p>
                                                            {ride && (
                                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {ride.departure_location} → {ride.destination}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
                                                        Pending
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <RouterLink to={createPageUrl("Inbox")}>
                                        <Button className="w-full mt-4 bg-primary hover:bg-primary/90 rounded-2xl">
                                            view all in inbox
                                        </Button>
                                    </RouterLink>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                            <CardHeader><CardTitle className="text-2xl font-heading tracking-widest text-secondary">ride history</CardTitle></CardHeader>
                            <CardContent className="flex items-center justify-around text-center">
                                <div><p className="text-3xl font-bold text-primary">{ridesGiven.length}</p><p className="text-gray-500">rides given</p></div>
                                <Separator orientation="vertical" className="h-16"/>
                                <div><p className="text-3xl font-bold text-primary">{ridesTaken.length}</p><p className="text-gray-500">rides taken</p></div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                            <CardHeader>
                                <CardTitle className="text-2xl font-heading tracking-widest text-secondary">transaction history</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TransactionHistory />
                            </CardContent>
                        </Card>

                        {user.vehicle_verified && (
                        <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                            <CardHeader>
                                <CardTitle className="text-2xl font-heading tracking-widest text-secondary flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-primary" />
                                    payouts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Stripe Connect prompt if not onboarded */}
                                {!user.stripe_connect_onboarding_complete && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                                        <p className="text-sm font-semibold text-yellow-800 mb-1">⚠ Bank account not connected</p>
                                        <p className="text-xs text-yellow-700 mb-3">You need to complete Stripe Connect setup to receive payouts and transfer funds to your bank.</p>
                                        <Link to={createPageUrl("Payout")}>
                                            <Button className="w-full bg-primary hover:bg-primary/90 rounded-2xl">
                                                connect bank account
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {/* Available Balance */}
                                {user.stripe_connect_onboarding_complete && (
                                <div className="p-4 bg-gradient-to-r from-primary/10 to-green-100 border border-primary/20 rounded-2xl">
                                    <p className="text-sm text-gray-600 mb-1">available balance</p>
                                    <p className="text-3xl font-bold text-primary">${availableBalance.toFixed(2)}</p>
                                    <Button
                                        onClick={handleTransferFunds}
                                        disabled={isTransferring || availableBalance <= 0 || !user.bank_account_linked}
                                        className="w-full mt-3 bg-primary hover:bg-primary/90 rounded-2xl"
                                    >
                                        {isTransferring ? 'transferring...' : 'transfer to bank'}
                                    </Button>
                                    {!user.bank_account_linked && availableBalance > 0 && (
                                        <p className="text-xs text-gray-500 mt-2 text-center">Link a bank account to transfer funds</p>
                                    )}
                                </div>
                                )}

                                {/* Bank Account Status */}
                                {user.bank_account_linked ? (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setShowBankForm(!showBankForm)}
                                            className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-2xl hover:bg-green-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 text-green-800">
                                                <ShieldCheck className="w-5 h-5" />
                                                <span className="font-medium">bank account linked</span>
                                                <span className="text-sm text-green-600">•••• {bankDetails.account_number.slice(-4)}</span>
                                            </div>
                                            {showBankForm ? <ChevronDown className="w-4 h-4 text-green-600" /> : <ChevronRight className="w-4 h-4 text-green-600" />}
                                        </button>

                                        {showBankForm && (
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                                                <p className="text-sm text-gray-600">Update your bank information:</p>
                                                <div className="space-y-2">
                                                    <Label htmlFor="holder-update">account holder name</Label>
                                                    <Input
                                                        id="holder-update"
                                                        value={bankDetails.account_holder_name}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                                                        placeholder="Full name on account"
                                                        className="rounded-2xl border-gray-300"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="routing-update">routing number</Label>
                                                    <Input
                                                        id="routing-update"
                                                        type="password"
                                                        value={bankDetails.routing_number}
                                                        onChange={(e) => setBankDetails({...bankDetails, routing_number: e.target.value})}
                                                        placeholder="9-digit routing number"
                                                        maxLength="9"
                                                        className="rounded-2xl border-gray-300"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="account-update">account number</Label>
                                                    <Input
                                                        id="account-update"
                                                        type="password"
                                                        value={bankDetails.account_number}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                                                        placeholder="Account number"
                                                        className="rounded-2xl border-gray-300"
                                                    />
                                                </div>
                                                {payoutError && (
                                                    <Alert variant="destructive" className="rounded-2xl border-red-200">
                                                        <AlertDescription>{payoutError}</AlertDescription>
                                                    </Alert>
                                                )}
                                                <Button
                                                    onClick={handleBankDetailsSubmit}
                                                    disabled={isSubmittingPayout}
                                                    className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                                                >
                                                    {isSubmittingPayout ? 'updating...' : 'update bank account'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setShowBankForm(!showBankForm)}
                                            className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="font-medium text-gray-700">link bank account</span>
                                            {showBankForm ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>

                                        {showBankForm && (
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="holder">account holder name *</Label>
                                                    <Input
                                                        id="holder"
                                                        value={bankDetails.account_holder_name}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                                                        placeholder="Full name on account"
                                                        required
                                                        className="rounded-2xl border-gray-300"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="routing">routing number *</Label>
                                                        <Input
                                                            id="routing"
                                                            type="password"
                                                            value={bankDetails.routing_number}
                                                            onChange={(e) => setBankDetails({...bankDetails, routing_number: e.target.value})}
                                                            placeholder="9-digit routing number"
                                                            maxLength="9"
                                                            required
                                                            className="rounded-2xl border-gray-300"
                                                        />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="account">account number *</Label>
                                                        <Input
                                                            id="account"
                                                            type="password"
                                                            value={bankDetails.account_number}
                                                            onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                                                            placeholder="Account number"
                                                            required
                                                            className="rounded-2xl border-gray-300"
                                                        />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirm">confirm account number *</Label>
                                                        <Input
                                                            id="confirm"
                                                            type="password"
                                                            value={bankDetails.account_number_confirm}
                                                            onChange={(e) => setBankDetails({...bankDetails, account_number_confirm: e.target.value})}
                                                            placeholder="Re-enter account number"
                                                            required
                                                            className="rounded-2xl border-gray-300"
                                                        />
                                                </div>
                                                {payoutError && (
                                                    <Alert variant="destructive" className="rounded-2xl border-red-200">
                                                        <AlertDescription>{payoutError}</AlertDescription>
                                                    </Alert>
                                                )}
                                                <Button
                                                    onClick={handleBankDetailsSubmit}
                                                    disabled={isSubmittingPayout}
                                                    className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                                                >
                                                    {isSubmittingPayout ? 'linking...' : 'link bank account'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        )}
                    </div>
                </div>
                
                <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                    <CardHeader><CardTitle className="text-2xl font-heading tracking-widest text-secondary">ratings</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <RatingsList ratings={driverRatings} title="as a driver" />
                        <RatingsList ratings={passengerRatings} title="as a passenger" />
                    </CardContent>
                </Card>



                {agreementsComplete && (
                    <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                        <CardHeader><CardTitle className="text-2xl font-heading tracking-widest text-secondary">legal agreements</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Link to={createPageUrl("TermsOfService")} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">terms of service</span>
                                            </div>
                                            <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                        </Link>
                                        <Link to={createPageUrl("PrivacyPolicy")} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">privacy policy</span>
                                            </div>
                                            <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                        </Link>
                                        <Link to={createPageUrl("CommunityAgreement")} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <HandHeart className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">community agreement</span>
                                            </div>
                                            <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                        </Link>
                                                        <Link to={createPageUrl("DriverAgreement")} className="flex flex-col p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">driver agreement</span>
                                                </div>
                                                {user.driver_agreement_accepted ? (
                                                    <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="rounded-2xl border-gray-300">review & accept</Button>
                                                )}
                                            </div>
                                            {user.driver_agreement_accepted && user.driver_agreement_timestamp && (
                                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                                    Signed: {format(new Date(user.driver_agreement_timestamp), "MMM d, yyyy 'at' h:mm a")}
                                                </p>
                                            )}
                                        </Link>


                        </CardContent>
                    </Card>
                )}

                {/* Logout Button */}
                <div className="pt-4 space-y-3">
                    <Button
                        onClick={() => base44.auth.logout()}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl select-none"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        log out
                    </Button>
                    <Button
                        onClick={() => setShowDeleteModal(true)}
                        variant="outline"
                        className="w-full border-gray-200 text-gray-400 hover:bg-gray-50 rounded-2xl select-none text-sm"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        delete my account
                    </Button>
                </div>

                <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
                </footer>
            </div>

            {showProfileQuiz && user && (
                <ProfileSetupQuiz
                    user={user}
                    initialStep={profileQuizSavedStep > 0 ? profileQuizSavedStep : 0}
                    driverMode={showDriverOnboarding}
                    onComplete={async () => {
                        setShowProfileQuiz(false);
                        setProfileQuizSavedStep(0);
                        setShowDriverOnboarding(false);
                        await loadData();
                    }}
                />
            )}

            <LicenseVerificationModal
                isOpen={showLicenseModal}
                onClose={() => setShowLicenseModal(false)}
                onSuccess={handleLicenseVerificationSuccess}
            />

            <EnableNotificationsModal
                isOpen={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
            />
            
            {/* Accepted Ride Alert */}
            <Dialog open={!!acceptedRideAlert} onOpenChange={() => setAcceptedRideAlert(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-green-100 rounded-full">
                                <PartyPopper className="w-6 h-6 text-green-600" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-green-900">
                                ride request accepted!
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-600">
                            Great news! The driver has accepted your ride request.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {acceptedRideAlert && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-green-700" />
                                    <span className="text-sm font-medium text-green-900">
                                        {format(new Date(acceptedRideAlert.departure_date), "MMMM d, yyyy")} at {acceptedRideAlert.departure_time}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-700" />
                                    <span className="text-sm text-green-900">
                                        {acceptedRideAlert.departure_location} → {acceptedRideAlert.destination}
                                    </span>
                                </div>
                            </div>
                            
                            <Alert className="bg-blue-50 border-blue-200 rounded-2xl">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    Go to your <strong>Inbox</strong> to chat with your driver and coordinate pickup details.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setAcceptedRideAlert(null);
                                window.location.href = createPageUrl('Inbox');
                            }}
                            className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            go to inbox
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <WelcomeTutorialModal
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                onComplete={async () => {
                    await base44.auth.updateMe({ has_dismissed_welcome_modal: true });
                    setShowTutorial(false);
                    setShowProfileQuiz(true);
                }}
            />

            {showSignupInfoCard && user && (
                <SignupInfoCard
                    user={user}
                    onComplete={async () => {
                        setShowSignupInfoCard(false);
                        await loadData();
                        setShowPostSignupCard(true);
                    }}
                />
            )}

            {showPostSignupCard && user && (
                <PostSignupCard
                    user={user}
                    onFinishProfile={() => {
                        setShowPostSignupCard(false);
                        setShowProfileQuiz(true);
                    }}
                    onViewTutorial={() => {
                        setShowPostSignupCard(false);
                        setShowTutorial(true);
                    }}
                />
            )}



            {/* Delete Account Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            delete account?
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 pt-2">
                            This will permanently delete all your data — rides, bookings, ratings, messages, vehicle info, and profile. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-800">
                            <p className="font-semibold mb-1">All of the following will be deleted:</p>
                            <ul className="space-y-0.5 text-xs">
                                <li>• Your profile, bio, and profile photo</li>
                                <li>• All active rides you've posted</li>
                                <li>• All active bookings you've made</li>
                                <li>• Your ratings, messages, and recurring trips</li>
                                <li>• Your driver's license and vehicle verification data</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 rounded-2xl select-none"
                        >
                            cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                setIsDeleting(true);
                                try {
                                    await deleteAccount();
                                    await base44.auth.logout('/');
                                } catch (e) {
                                    alert("Error deleting account: " + (e.message || "please try again or contact support"));
                                    setIsDeleting(false);
                                }
                            }}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl select-none"
                        >
                            {isDeleting ? "deleting..." : "yes, delete everything"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            </div>

            );

            }