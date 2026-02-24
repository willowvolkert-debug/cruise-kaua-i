import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Star, Edit, Save, MessageCircle, Wind, Upload, Clock, FileText, Shield, HandHeart, Camera, ChevronRight, ChevronDown, DollarSign, LogOut, UserPlus, MapPin, Calendar, PartyPopper } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LicenseVerificationModal from "../components/account/LicenseVerificationModal";
import TransactionHistory from "../components/payment/TransactionHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnableNotificationsModal from "../components/notifications/EnableNotificationsModal";
import { requestNotificationPermission } from "../components/utils/notifications";

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
                    <h4 className="font-semibold text-secondary">{title}</h4>
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
    const [isExploreMode, setIsExploreMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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

    useEffect(() => {
        // Check for explore mode
        const urlParams = new URLSearchParams(window.location.search);
        const exploreParam = urlParams.get('explore');
        setIsExploreMode(exploreParam === 'true');
        
        loadData();
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const isAuthenticated = await base44.auth.isAuthenticated();
            if (!isAuthenticated) {
                setIsLoading(false);
                return;
            }
            
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            setEditData({
                username: currentUser.username || '',
                bio: currentUser.bio || '',
                age: currentUser.age || '',
                gender: currentUser.gender || '',
                home_base: currentUser.home_base || '',
                preferences_chattiness: currentUser.preferences_chattiness || 'Flexible',
                preferences_scents: currentUser.preferences_scents || 'Any'
            });
            


            if (currentUser.bank_account_linked) {
                setBankDetails({
                    account_holder_name: currentUser.bank_account_holder_name || '',
                    routing_number: currentUser.bank_routing_number ? '****' + currentUser.bank_routing_number.slice(-4) : '',
                    account_number: currentUser.bank_account_number ? '****' + currentUser.bank_account_number.slice(-4) : '',
                    account_number_confirm: ''
                });
            }

            const allRides = await base44.entities.Ride.list();
            const allBookings = await base44.entities.RideBooking.list();
            const allRatings = await base44.entities.Rating.list();

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

        } catch (e) { console.error(e); }
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
            ...editData,
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

        await loadData();
        setIsEditing(false);
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

        if (bankDetails.routing_number.length !== 9 || isNaN(bankDetails.routing_number)) {
            setPayoutError("Routing number must be exactly 9 digits.");
            return;
        }

        if (bankDetails.account_number.length < 4 || isNaN(bankDetails.account_number)) {
            setPayoutError("Please enter a valid account number.");
            return;
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

            await base44.auth.updateMe({
                bank_account_linked: true,
                bank_account_holder_name: bankDetails.account_holder_name,
                bank_routing_number: bankDetails.routing_number,
                bank_account_number: bankDetails.account_number,
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

    if (isLoading) return <div className="p-8 text-center">Loading account...</div>;
    
    if (!user && isExploreMode) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <Card className="max-w-md w-full shadow-xl rounded-3xl border-gray-300 bg-white">
                    <CardContent className="p-8 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-12 h-12 text-gray-600" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-secondary mb-2">Your account doesn't exist! Create one here</h2>
                        </div>
                        <Button
                            onClick={() => base44.auth.redirectToLogin(createPageUrl("Account"))}
                            className="w-full py-6 text-lg bg-primary hover:bg-primary/90 rounded-2xl"
                        >
                            sign in
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!user) return <div className="p-8 text-center">Could not load user data. Please log in.</div>;
    
    const driverRatings = ratings.filter(r => r.trip_role === 'driver');
    const passengerRatings = ratings.filter(r => r.trip_role === 'passenger');

    const profileComplete = user.username && user.bio && user.age && user.gender && user.profile_picture_url;
    const agreementsComplete = user.terms_accepted && user.privacy_policy_accepted && user.community_agreement_accepted;

    return (
        <div className="p-4 md:p-8 bg-white">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card className="shadow-lg border-gray-200 bg-white rounded-3xl">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                <Avatar className="w-24 h-24 text-3xl">
                                    <AvatarImage src={user.profile_picture_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white font-bold">
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
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h2 className="text-3xl font-bold text-secondary">
                                    {user.username ? `@${user.username}` : user.full_name}
                                </h2>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-gray-100 rounded-2xl mb-4">
                                            <p className="text-sm text-gray-500">Account Email</p>
                                            <p className="font-medium text-secondary">{user.full_name} ({user.email})</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Username *</Label>
                                            <Input 
                                                value={editData.username} 
                                                onChange={(e) => setEditData({...editData, username: e.target.value})} 
                                                placeholder="username"
                                                className="max-w-xs rounded-2xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 max-w-xs">
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
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Bio *</Label>
                                            <p className="text-sm text-gray-600">
                                                Tell us a bit about yourself and why you're using Cruise Kauaʻi!
                                            </p>
                                            <Textarea 
                                                value={editData.bio} 
                                                onChange={(e) => setEditData({...editData, bio: e.target.value})} 
                                                placeholder="Tell us about yourself..."
                                                className="rounded-2xl"
                                            />
                                        </div>
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
                                        <div className="space-y-4 pt-2">
                                            <h4 className="font-semibold text-secondary">preferences</h4>
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
                                        </div>
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
                                        </div>
                                    </>
                                )}
                                <p className="text-sm text-gray-400">joined {format(new Date(user.created_date), "MMMM yyyy")}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-2xl">
                                            {isSaving ? <><span className="animate-spin mr-2">⏳</span>saving...</> : <><Save className="w-4 h-4 mr-2"/>save changes</>}
                                        </Button>
                                        {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}
                                        {profilePicFile && <p className="text-xs text-gray-500 text-center">📎 {profilePicFile.name}</p>}
                                    </div>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90 rounded-2xl">
                                        <Edit className="w-4 h-4 mr-2"/>edit profile
                                    </Button>
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

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {!notificationsEnabled && (
                            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                                <CardHeader><CardTitle className="text-xl text-secondary">notifications</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <span className="font-medium">push notifications</span>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={handleEnableNotifications}
                                            className="rounded-2xl border-gray-300"
                                        >
                                            enable now
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!(user.drivers_license_verified && user.vehicle_verified) && (
                            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                                <CardHeader><CardTitle className="text-xl text-secondary">verification</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {user.drivers_license_pending_review && !user.drivers_license_verified && (
                                        <div className="p-3 bg-gray-100 border border-gray-300 rounded-2xl text-gray-700 text-sm mb-3">
                                            <strong>thanks!</strong> you will be able to book rides once your identity is verified. check back soon for approval!
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <span className="font-medium">driver's license</span>
                                        {user.drivers_license_verified ? (
                                            <Button 
                                                size="sm"
                                                variant="default"
                                                onClick={() => setShowLicenseModal(true)}
                                                className="bg-primary rounded-2xl border-primary hover:bg-primary/90"
                                            >
                                                <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                            </Button>
                                        ) : user.drivers_license_pending_review ? (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 rounded-2xl">
                                                <Clock className="w-4 h-4 mr-1"/>pending review
                                            </Badge>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => setShowLicenseModal(true)}
                                                className="rounded-2xl border-gray-300"
                                            >
                                                <Upload className="w-4 h-4 mr-2"/>
                                                verify now
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <span className="font-medium">vehicle</span>
                                        {user.vehicle_verified ? (
                                            <Link to={createPageUrl("VehicleDetails")}>
                                                <Badge variant="default" className="bg-primary border-primary cursor-pointer hover:bg-primary/90 rounded-2xl">
                                                    <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                                </Badge>
                                            </Link>
                                        ) : user.vehicle_pending_review ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
                                                <Clock className="w-4 h-4 mr-1"/>pending review
                                            </Badge>
                                        ) : (
                                            <Link to={createPageUrl("VehicleDetails")}>
                                                <Button size="sm" variant="outline" className="rounded-2xl border-gray-300">enter details</Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!agreementsComplete && (
                            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                                <CardHeader><CardTitle className="text-xl text-secondary">legal agreements</CardTitle></CardHeader>
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
                            <Card className="shadow-lg border-blue-200 bg-blue-50 rounded-3xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-secondary">
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

                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader><CardTitle className="text-xl text-secondary">ride history</CardTitle></CardHeader>
                            <CardContent className="flex items-center justify-around text-center">
                                <div><p className="text-3xl font-bold text-primary">{ridesGiven.length}</p><p className="text-gray-500">rides given</p></div>
                                <Separator orientation="vertical" className="h-16"/>
                                <div><p className="text-3xl font-bold text-primary">{ridesTaken.length}</p><p className="text-gray-500">rides taken</p></div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-secondary">transaction history</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TransactionHistory />
                            </CardContent>
                        </Card>

                        {user.vehicle_verified && user.stripe_connect_onboarding_complete && (
                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-secondary flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-primary" />
                                    payouts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Available Balance */}
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
                
                <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                    <CardHeader><CardTitle className="text-xl text-secondary">ratings</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <RatingsList ratings={driverRatings} title="as a driver" />
                        <RatingsList ratings={passengerRatings} title="as a passenger" />
                    </CardContent>
                </Card>

                {(user.drivers_license_verified && user.vehicle_verified) && (
                    <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                        <CardHeader><CardTitle className="text-xl text-secondary">verification</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                <span className="font-medium">driver's license</span>
                                <Button 
                                    size="sm"
                                    variant="default"
                                    onClick={() => setShowLicenseModal(true)}
                                    className="bg-primary rounded-2xl border-primary hover:bg-primary/90"
                                >
                                    <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                <span className="font-medium">vehicle</span>
                                <Link to={createPageUrl("VehicleDetails")}>
                                    <Badge variant="default" className="bg-primary border-primary cursor-pointer hover:bg-primary/90 rounded-2xl">
                                        <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                    </Badge>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {agreementsComplete && (
                    <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                        <CardHeader><CardTitle className="text-xl text-secondary">legal agreements</CardTitle></CardHeader>
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
                                        {user.driver_agreement_accepted && (
                                            <Link to={createPageUrl("DriverAgreement")} className="flex flex-col p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-500" />
                                                        <span className="font-medium">driver agreement</span>
                                                    </div>
                                                    <Badge variant="default" className="bg-green-600 border-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                                </div>
                                                {user.driver_agreement_timestamp && (
                                                    <p className="text-xs text-gray-500 mt-1 ml-6">
                                                        Signed: {format(new Date(user.driver_agreement_timestamp), "MMM d, yyyy 'at' h:mm a")}
                                                    </p>
                                                )}
                                            </Link>
                                        )}
                        </CardContent>
                    </Card>
                )}

                {/* Logout Button */}
                <div className="pt-4">
                    <Button
                        onClick={() => base44.auth.logout()}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        log out
                    </Button>
                </div>

                <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
                </footer>
            </div>

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
            </div>
            );
            }