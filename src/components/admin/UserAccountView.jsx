import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Star, MessageCircle, Wind, Clock, FileText, Shield, HandHeart, MapPin, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export default function UserAccountView({ isOpen, onClose, userId }) {
    const [user, setUser] = useState(null);
    const [ridesGiven, setRidesGiven] = useState([]);
    const [ridesTaken, setRidesTaken] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadUserData();
        }
    }, [isOpen, userId]);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            const allUsers = await base44.entities.User.list();
            const currentUser = allUsers.find(u => u.id === userId);
            setUser(currentUser);

            const allRides = await base44.entities.Ride.list();
            const allBookings = await base44.entities.RideBooking.list();
            const allRatings = await base44.entities.Rating.list();

            setRidesGiven(allRides.filter(r => r.driver_id === currentUser.id));
            const takenRideIds = allBookings.filter(b => b.passenger_id === currentUser.id).map(b => b.ride_id);
            setRidesTaken(allRides.filter(r => takenRideIds.includes(r.id)));
            setRatings(allRatings.filter(r => r.rated_user_id === currentUser.id));
        } catch (e) { 
            console.error(e); 
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    const driverRatings = ratings.filter(r => r.trip_role === 'driver');
    const passengerRatings = ratings.filter(r => r.trip_role === 'passenger');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-secondary">user account view</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-8 text-center">Loading user data...</div>
                ) : user ? (
                    <div className="space-y-6 py-4">
                        <Card className="shadow-lg border-gray-200 bg-white rounded-3xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="w-24 h-24 text-3xl">
                                        <AvatarImage src={user.profile_picture_url} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white font-bold">
                                            {getInitials(user.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <h2 className="text-3xl font-bold text-secondary">
                                            {user.username ? `@${user.username}` : user.full_name}
                                        </h2>
                                        {user.age && user.gender && (
                                            <p className="text-sm text-gray-500">{user.age} years old • {user.gender}</p>
                                        )}
                                        <p className="text-gray-600">{user.bio || "No bio"}</p>
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
                                        <p className="text-sm text-gray-400">joined {format(new Date(user.created_date), "MMMM yyyy")}</p>
                                    </div>
                                </div>
                                
                                {user.drivers_license_verified && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        <span>License verified</span>
                                    </div>
                                )}
                                {user.vehicle_verified && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        <span>Vehicle verified</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                                <CardHeader><CardTitle className="text-xl text-secondary">ride history</CardTitle></CardHeader>
                                <CardContent className="flex items-center justify-around text-center">
                                    <div><p className="text-3xl font-bold text-primary">{ridesGiven.length}</p><p className="text-gray-500">rides given</p></div>
                                    <Separator orientation="vertical" className="h-16"/>
                                    <div><p className="text-3xl font-bold text-primary">{ridesTaken.length}</p><p className="text-gray-500">rides taken</p></div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                                <CardHeader><CardTitle className="text-xl text-secondary">account details</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="font-medium">{user.email}</span>
                                    </div>
                                    {user.role === 'admin' && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Role:</span>
                                        <Badge className="bg-purple-100 text-purple-800">admin</Badge>
                                    </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">User Type:</span>
                                        <Badge className={
                                            user.user_type === 'driver' ? 'bg-green-100 text-green-800' :
                                            user.user_type === 'rider' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }>
                                            {user.user_type || 'new'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader><CardTitle className="text-xl text-secondary">ratings</CardTitle></CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                <RatingsList ratings={driverRatings} title="as a driver" />
                                <RatingsList ratings={passengerRatings} title="as a passenger" />
                            </CardContent>
                        </Card>

                        <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                            <CardHeader><CardTitle className="text-xl text-secondary">verification status</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                    <span className="font-medium">driver's license</span>
                                    {user.drivers_license_verified ? (
                                        <Badge className="bg-green-100 text-green-800">
                                            <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                        </Badge>
                                    ) : user.drivers_license_pending_review ? (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                            <Clock className="w-4 h-4 mr-1"/>pending
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">not submitted</Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                    <span className="font-medium">vehicle</span>
                                    {user.vehicle_verified ? (
                                        <Badge className="bg-green-100 text-green-800">
                                            <ShieldCheck className="w-4 h-4 mr-1"/>verified
                                        </Badge>
                                    ) : user.vehicle_pending_review ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                            <Clock className="w-4 h-4 mr-1"/>pending
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">not submitted</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {(user.terms_accepted && user.privacy_policy_accepted && user.community_agreement_accepted) && (
                            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                                <CardHeader><CardTitle className="text-xl text-secondary">legal agreements</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">terms of service</span>
                                        </div>
                                        <Badge className="bg-green-600"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">privacy policy</span>
                                        </div>
                                        <Badge className="bg-green-600"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <HandHeart className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">community agreement</span>
                                        </div>
                                        <Badge className="bg-green-600"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                    </div>
                                    {user.driver_agreement_accepted && (
                                        <div className="flex flex-col p-3 rounded-2xl bg-gray-50 border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">driver agreement</span>
                                                </div>
                                                <Badge className="bg-green-600"><ShieldCheck className="w-4 h-4 mr-1"/>accepted</Badge>
                                            </div>
                                            {user.driver_agreement_timestamp && (
                                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                                    Signed: {format(new Date(user.driver_agreement_timestamp), "MMM d, yyyy 'at' h:mm a")}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={onClose} variant="outline" className="rounded-2xl">
                                close
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center">User not found</div>
                )}
            </DialogContent>
        </Dialog>
    );
}