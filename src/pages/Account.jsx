
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star, Edit, Save, MessageCircle, Wind, Upload, Clock, FileText, Shield, HandHeart, Camera, ChevronRight, ChevronDown, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LicenseVerificationModal from "../components/account/LicenseVerificationModal";
import PaymentMethodsManager from "../components/payment/PaymentMethodsManager";
import TransactionHistory from "../components/payment/TransactionHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

const RatingsList = ({ ratings, title }) => (
    <div className="space-y-4">
        <h4 className="font-semibold text-secondary">{title} ({ratings.length})</h4>
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
);

export default function AccountPage() {
    const [user, setUser] = useState(null);
    const [ridesGiven, setRidesGiven] = useState([]);
    const [ridesTaken, setRidesTaken] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [showPayoutSection, setShowPayoutSection] = useState(false);
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
    const [payoutError, setPayoutError] = useState(null);
    const [bankDetails, setBankDetails] = useState({
        account_holder_name: '',
        routing_number: '',
        account_number: '',
        account_number_confirm: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            setEditData({
                username: currentUser.username || '',
                bio: currentUser.bio || '',
                age: currentUser.age || '',
                gender: currentUser.gender || '',
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

            setRidesGiven(allRides.filter(r => r.driver_id === currentUser.id));
            const takenRideIds = allBookings.filter(b => b.passenger_id === currentUser.id).map(b => b.ride_id);
            setRidesTaken(allRides.filter(r => takenRideIds.includes(r.id)));
            setRatings(allRatings.filter(r => r.rated_user_id === currentUser.id));

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
        let profilePicUrl = user.profile_picture_url || '';

        if (profilePicFile) {
            const uploadResult = await base44.integrations.Core.UploadFile({ file: profilePicFile });
            profilePicUrl = uploadResult.file_url;
        }

        await base44.auth.updateMe({
            ...editData,
            profile_picture_url: profilePicUrl,
            profile_complete: !!(editData.username && editData.bio && editData.age && editData.gender && profilePicUrl)
        });
        await loadData();
        setIsEditing(false);
        setProfilePicFile(null);
    };

    const handleLicenseVerificationSuccess = () => {
        loadData();
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

    if (isLoading) return <div className="p-8 text-center">Loading account...</div>;
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
                                <h2 className="text-3xl font-bold text-secondary">{user.full_name}</h2>
                                {isEditing ? (
                                    <div className="space-y-4">
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
                                                Tell us why you're using Cruise Kauaʻi!
                                            </p>
                                            <Textarea 
                                                value={editData.bio} 
                                                onChange={(e) => setEditData({...editData, bio: e.target.value})} 
                                                placeholder="e.g., Love sharing rides and making the island greener!"
                                                className="rounded-2xl"
                                            />
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
                                        {user.username && <p className="text-lg text-gray-500">@{user.username}</p>}
                                        {user.age && user.gender && (
                                            <p className="text-sm text-gray-500">{user.age} years old • {user.gender}</p>
                                        )}
                                        <p className="text-gray-600">{user.bio || "No bio yet. Click Edit Profile to add one!"}</p>
                                        <div className="pt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="w-4 h-4 text-gray-500"/>
                                                <span className="text-sm text-gray-600">chattiness:</span>
                                                <Badge variant="outline" className="rounded-2xl">{user.preferences_chattiness}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Wind className="w-4 h-4 text-gray-500"/>
                                                <span className="text-sm text-gray-600">scents:</span>
                                                <Badge variant="outline" className="rounded-2xl">{user.preferences_scents}</Badge>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <p className="text-sm text-gray-400">joined {format(new Date(user.created_date), "MMMM yyyy")}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {isEditing ? (
                                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 rounded-2xl">
                                        <Save className="w-4 h-4 mr-2"/>save changes
                                    </Button>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90 rounded-2xl">
                                        <Edit className="w-4 h-4 mr-2"/>edit profile
                                    </Button>
                                )}
                            </div>
                        </div>
                        {!profileComplete && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm">
                                <strong>Complete your profile:</strong> Username, bio, age, gender, and profile picture are required to book or post rides.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader><CardTitle className="text-xl text-secondary">verification</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                    <span className="font-medium">driver's license</span>
                                    {user.drivers_license_verified ? (
                                        <Badge variant="default" className="bg-primary rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>verified</Badge>
                                    ) : user.drivers_license_pending_review ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
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
                                            <Badge variant="default" className="bg-primary cursor-pointer hover:bg-primary/90 rounded-2xl">
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

                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader><CardTitle className="text-xl text-secondary">legal agreements</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">terms of service</span>
                                    </div>
                                    {user.terms_accepted ? (
                                        <Badge variant="default" className="bg-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                    ) : (
                                        <Link to={createPageUrl("TermsOfService")}>
                                            <Button size="sm" variant="outline" className="rounded-2xl">review & accept</Button>
                                        </Link>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">privacy policy</span>
                                    </div>
                                    {user.privacy_policy_accepted ? (
                                        <Badge variant="default" className="bg-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                    ) : (
                                        <Link to={createPageUrl("PrivacyPolicy")}>
                                            <Button size="sm" variant="outline" className="rounded-2xl">review & accept</Button>
                                        </Link>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <HandHeart className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">community agreement</span>
                                    </div>
                                    {user.community_agreement_accepted ? (
                                        <Badge variant="default" className="bg-green-600 rounded-2xl"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                    ) : (
                                        <Link to={createPageUrl("CommunityAgreement")}>
                                            <Button size="sm" variant="outline" className="rounded-2xl">review & accept</Button>
                                        </Link>
                                    )}
                                </div>
                                {!agreementsComplete && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm">
                                        <strong>Required:</strong> You must accept all agreements before booking or posting rides.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                                <CardTitle className="text-xl text-secondary">payment methods</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <PaymentMethodsManager />
                            </CardContent>
                        </Card>

                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader 
                                className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-3xl"
                                onClick={() => setShowPayoutSection(!showPayoutSection)}
                            >
                                <CardTitle className="text-xl text-secondary flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-primary" />
                                        payouts
                                    </div>
                                    {showPayoutSection ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </CardTitle>
                            </CardHeader>
                            {showPayoutSection && (
                                <CardContent className="space-y-6">
                                    {user.bank_account_linked ? (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                                                <div className="flex items-center gap-2 text-green-800 mb-2">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span className="font-semibold">Bank account linked</span>
                                                </div>
                                                <div className="text-sm text-green-700 space-y-1">
                                                    <p><strong>Account holder:</strong> {user.bank_account_holder_name}</p>
                                                    <p><strong>Routing:</strong> {bankDetails.routing_number}</p>
                                                    <p><strong>Account:</strong> {bankDetails.account_number}</p>
                                                </div>
                                            </div>

                                            <Alert className="rounded-2xl">
                                                <AlertDescription className="text-sm">
                                                    Update your bank information below if needed.
                                                </AlertDescription>
                                            </Alert>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="holder-update">account holder name</Label>
                                                    <Input
                                                        id="holder-update"
                                                        value={bankDetails.account_holder_name}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                                                        placeholder="Full name on account"
                                                        className="rounded-2xl"
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
                                                        className="rounded-2xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="account-update">account number</Label>
                                                    <Input
                                                        id="account-update"
                                                        value={bankDetails.account_number}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                                                        placeholder="Account number"
                                                        className="rounded-2xl"
                                                    />
                                                </div>
                                                {payoutError && (
                                                    <Alert variant="destructive" className="rounded-2xl">
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
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Alert className="rounded-2xl">
                                                <AlertDescription>
                                                    Link your bank account to receive payouts from rides.
                                                </AlertDescription>
                                            </Alert>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="holder">account holder name *</Label>
                                                    <Input
                                                        id="holder"
                                                        value={bankDetails.account_holder_name}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                                                        placeholder="Full name on account"
                                                        required
                                                        className="rounded-2xl"
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
                                                        className="rounded-2xl"
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
                                                        className="rounded-2xl"
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
                                                        className="rounded-2xl"
                                                    />
                                                </div>
                                                {payoutError && (
                                                    <Alert variant="destructive" className="rounded-2xl">
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
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </div>
                
                <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-secondary">transaction history</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TransactionHistory />
                    </CardContent>
                </Card>

                <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                    <CardHeader><CardTitle className="text-xl text-secondary">ratings</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <RatingsList ratings={driverRatings} title="as a driver" />
                        <RatingsList ratings={passengerRatings} title="as a passenger" />
                    </CardContent>
                </Card>

                <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.
                </footer>
            </div>

            <LicenseVerificationModal
                isOpen={showLicenseModal}
                onClose={() => setShowLicenseModal(false)}
                onSuccess={handleLicenseVerificationSuccess}
            />
        </div>
    );
}
