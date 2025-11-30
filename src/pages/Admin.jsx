import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, X, CheckCircle, Clock, Users, AlertCircle, Eye, Car, MessageSquare, Phone, Mail } from "lucide-react";
import AdminMessageModal from "../components/admin/AdminMessageModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [pendingLicenses, setPendingLicenses] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [verifiedRiders, setVerifiedRiders] = useState([]);
  const [contactInquiries, setContactInquiries] = useState([]);
  const [phoneAlerts, setPhoneAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user.role !== 'admin') {
        setError("Access denied. This page is only available to administrators.");
        setIsLoading(false);
        return;
      }

      const allUsers = await base44.entities.User.list('-created_date');
      setUsers(allUsers);

      const pendingLic = allUsers.filter(u => u.drivers_license_pending_review === true);
      const pendingVeh = allUsers.filter(u => u.vehicle_pending_review === true);
      const drivers = allUsers.filter(u => u.user_type === 'driver');
      const riders = allUsers.filter(u => u.user_type === 'rider');

      setPendingLicenses(pendingLic);
      setPendingVehicles(pendingVeh);
      setVerifiedUsers(drivers);
      setVerifiedRiders(riders);

      // Load contact inquiries
      const allInquiries = await base44.entities.ContactInquiry.list('-created_date');
      const pendingInquiries = allInquiries.filter(i => i.status === 'pending');
      setContactInquiries(pendingInquiries);

      // Load phone number alerts
      const allBookings = await base44.entities.RideBooking.list('-updated_date');
      const phoneDetected = allBookings.filter(b => b.phone_number_detected === true);
      setPhoneAlerts(phoneDetected);

    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error loading user data. Please try again.");
    }
    setIsLoading(false);
  };

  const handleViewLicense = (user) => {
    setSelectedUser(user);
    setShowLicenseModal(true);
  };

  const handleViewVehicle = (user) => {
    setSelectedUser(user);
    setShowVehicleModal(true);
  };

  const handleApproveLicense = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      // Check if user meets all requirements for rider/driver status
      const profileComplete = selectedUser.username && selectedUser.bio && selectedUser.age && selectedUser.gender && selectedUser.profile_picture_url;
      const agreementsComplete = selectedUser.terms_accepted && selectedUser.privacy_policy_accepted && selectedUser.community_agreement_accepted;
      const notificationsEnabled = selectedUser.notifications_enabled;
      
      // Determine new user_type based on requirements
      const canBeRider = profileComplete && agreementsComplete && notificationsEnabled;
      const canBeDriver = canBeRider && selectedUser.vehicle_verified;
      
      let newUserType = selectedUser.user_type || 'new';
      if (canBeDriver) {
        newUserType = 'driver';
      } else if (canBeRider) {
        newUserType = 'rider';
      }

      await base44.entities.User.update(selectedUser.id, {
        drivers_license_verified: true,
        drivers_license_pending_review: false,
        license_rejection_reason: null,
        user_type: newUserType
      });

      // Send approval email notification
      await base44.integrations.Core.SendEmail({
        to: selectedUser.email,
        subject: "🎉 Your license has been approved! - Cruise Kauaʻi",
        body: `Aloha ${selectedUser.full_name}!\n\nGreat news! Your driver's license has been verified and approved.\n\nYou can now book rides on Cruise Kauaʻi. Head to the app and start exploring available rides!\n\nMahalo for joining our community,\nThe Cruise Kauaʻi Team`
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('License Verified!', {
          body: `${selectedUser.full_name}'s driver's license has been verified.`,
        });
      }

      const statusMsg = newUserType === 'rider' 
        ? `License approved for ${selectedUser.full_name}. They are now a RIDER and can book rides.`
        : `License approved for ${selectedUser.full_name}. They still need to complete their profile, accept agreements, or enable notifications to become a rider.`;
      
      alert(statusMsg);
      setShowLicenseModal(false);
      loadData();
    } catch (error) {
      console.error("Error approving license:", error);
      alert("Error approving license. Please try again.");
    }
    setIsProcessing(false);
  };

  const handleRejectLicense = async () => {
    if (!selectedUser) return;

    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setIsProcessing(true);
    try {
      await base44.entities.User.update(selectedUser.id, {
        drivers_license_verified: false,
        drivers_license_pending_review: false,
        license_rejection_reason: reason
      });

      // Send rejection email notification
      await base44.integrations.Core.SendEmail({
        to: selectedUser.email,
        subject: "License Verification Update - Cruise Kauaʻi",
        body: `Aloha ${selectedUser.full_name},\n\nWe were unable to verify your driver's license at this time.\n\nReason: ${reason}\n\nPlease update your verification documents and try again. If you have questions, contact us through the app.\n\nMahalo,\nThe Cruise Kauaʻi Team`
      });

      alert(`License rejected for ${selectedUser.full_name}. Reason: ${reason}`);
      setShowLicenseModal(false);
      loadData();
    } catch (error) {
      console.error("Error rejecting license:", error);
      alert("Error rejecting license. Please try again.");
    }
    setIsProcessing(false);
  };

  const handleApproveVehicle = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      // Vehicle approval upgrades user to "driver" if they are already a rider
      const isRider = selectedUser.user_type === 'rider';
      const newUserType = isRider ? 'driver' : selectedUser.user_type;
      
      await base44.entities.User.update(selectedUser.id, {
        vehicle_verified: true,
        vehicle_pending_review: false,
        vehicle_rejection_reason: null,
        can_drive: true,
        user_type: newUserType
      });

      // Send approval email notification
      await base44.integrations.Core.SendEmail({
        to: selectedUser.email,
        subject: "🚗 Your vehicle has been approved! - Cruise Kauaʻi",
        body: `Aloha ${selectedUser.full_name}!\n\nGreat news! Your vehicle has been verified and approved.\n\nYou can now post rides on Cruise Kauaʻi and start sharing the aloha with fellow travelers!\n\nMahalo for being part of our community,\nThe Cruise Kauaʻi Team`
      });

      if (newUserType === 'driver') {
        alert(`Vehicle approved for ${selectedUser.full_name}. Their account has been upgraded to DRIVER and they can now post rides!`);
      } else {
        alert(`Vehicle approved for ${selectedUser.full_name}. They need to complete rider requirements first (license, profile, agreements, notifications) before becoming a driver.`);
      }
      setShowVehicleModal(false);
      loadData();
    } catch (error) {
      console.error("Error approving vehicle:", error);
      alert("Error approving vehicle. Please try again.");
    }
    setIsProcessing(false);
  };

  const handleRejectVehicle = async () => {
    if (!selectedUser) return;

    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setIsProcessing(true);
    try {
      await base44.entities.User.update(selectedUser.id, {
        vehicle_verified: false,
        vehicle_pending_review: false,
        vehicle_rejection_reason: reason
      });

      // Send rejection email notification
      await base44.integrations.Core.SendEmail({
        to: selectedUser.email,
        subject: "Vehicle Verification Update - Cruise Kauaʻi",
        body: `Aloha ${selectedUser.full_name},\n\nWe were unable to verify your vehicle at this time.\n\nReason: ${reason}\n\nPlease update your vehicle information and try again. If you have questions, contact us through the app.\n\nMahalo,\nThe Cruise Kauaʻi Team`
      });

      alert(`Vehicle rejected for ${selectedUser.full_name}. Reason: ${reason}`);
      setShowVehicleModal(false);
      loadData();
    } catch (error) {
      console.error("Error rejecting vehicle:", error);
      alert("Error rejecting vehicle. Please try again.");
    }
    setIsProcessing(false);
  };

  const handleResolveInquiry = async (inquiryId) => {
    try {
      await base44.entities.ContactInquiry.update(inquiryId, {
        status: 'resolved'
      });
      loadData();
    } catch (error) {
      console.error("Error resolving inquiry:", error);
    }
  };

  const handleMessageUser = (user) => {
    setMessageUser(user);
    setShowMessageModal(true);
  };

  if (error && !currentUser) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">admin dashboard</h1>
            <p className="text-gray-600">manage verifications, inquiries, and safety alerts</p>
          </div>
          <Badge className="bg-primary text-lg px-4 py-2">
            <ShieldCheck className="w-5 h-5 mr-2" />
            admin access
          </Badge>
        </div>

        {/* Phone Number Alerts - Top Priority */}
        {phoneAlerts.length > 0 && (
          <Card className="shadow-lg border-red-300 bg-red-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-red-800 flex items-center gap-2">
                <Phone className="w-6 h-6 text-red-600" />
                phone number detection alerts ({phoneAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Users have shared phone numbers in these conversations. Review and take action.
              </p>
              <div className="space-y-3">
                {phoneAlerts.map(booking => (
                  <div key={booking.id} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-secondary">
                          Booking ID: {booking.id.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          Between: {booking.passenger_name} & Driver
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {booking.messages?.length || 0} messages in conversation
                        </p>
                      </div>
                      <Badge className="bg-red-600">needs review</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Inquiries */}
        {contactInquiries.length > 0 && (
          <Card className="shadow-lg border-blue-300 bg-blue-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                contact inquiries ({contactInquiries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contactInquiries.map(inquiry => (
                  <div key={inquiry.id} className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-secondary">{inquiry.subject}</p>
                          <Badge variant="outline" className={
                            inquiry.priority === 'high' ? 'bg-red-50 text-red-700 border-red-300' :
                            inquiry.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                            'bg-gray-50 text-gray-700'
                          }>
                            {inquiry.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{inquiry.message}</p>
                        <p className="text-xs text-gray-500">
                          From: {inquiry.user_name} ({inquiry.user_email})
                        </p>
                      </div>
                      <Button
                        onClick={() => handleResolveInquiry(inquiry.id)}
                        size="sm"
                        variant="outline"
                        className="ml-4"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 rounded-3xl">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-secondary">{pendingLicenses.length}</p>
              <p className="text-gray-600">pending licenses</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-3xl">
            <CardContent className="p-6 text-center">
              <Car className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-secondary">{pendingVehicles.length}</p>
              <p className="text-gray-600">pending vehicles</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-3xl">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-secondary">{verifiedRiders.length}</p>
              <p className="text-gray-600">verified riders</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-3xl">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-secondary">{verifiedUsers.length}</p>
              <p className="text-gray-600">verified drivers</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending License Reviews */}
        {pendingLicenses.length > 0 && (
          <Card className="shadow-lg border-blue-200 bg-blue-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                pending license reviews ({pendingLicenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {pendingLicenses.map(user => (
                  <div key={user.id} className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-secondary">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-300">
                            <Clock className="w-3 h-3 mr-1" />
                            awaiting review
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewLicense(user)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        review license
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Vehicle Reviews */}
        {pendingVehicles.length > 0 && (
          <Card className="shadow-lg border-blue-300 bg-blue-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <Car className="w-6 h-6" />
                pending vehicle reviews ({pendingVehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {pendingVehicles.map(user => (
                  <div key={user.id} className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-secondary">{user.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {user.vehicle_make} {user.vehicle_model} {user.vehicle_year}
                          </p>
                          <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-300">
                            <Clock className="w-3 h-3 mr-1" />
                            awaiting review
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewVehicle(user)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        review vehicle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Users */}
        <Card className="shadow-md bg-white border-gray-200 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl text-secondary">all users</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">all ({users.length})</TabsTrigger>
                <TabsTrigger value="riders">riders ({verifiedRiders.length})</TabsTrigger>
                <TabsTrigger value="verified">drivers ({verifiedUsers.length})</TabsTrigger>
                <TabsTrigger value="pending">pending ({pendingLicenses.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-secondary">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleMessageUser(user)}
                          size="sm"
                          variant="outline"
                          className="rounded-2xl border-gray-300"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          message
                        </Button>
                        {user.drivers_license_verified ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            verified
                          </Badge>
                        ) : user.drivers_license_pending_review ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            <Clock className="w-3 h-3 mr-1" />
                            pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            not submitted
                          </Badge>
                        )}
                        {user.role === 'admin' && (
                          <Badge className="bg-purple-100 text-purple-800">admin</Badge>
                        )}
                        {user.role === 'driver' && (
                          <Badge className="bg-green-100 text-green-800">driver</Badge>
                        )}
                        {user.role === 'rider' && (
                          <Badge className="bg-blue-100 text-blue-800">rider</Badge>
                        )}
                        {(!user.role || user.role === 'user') && (
                          <Badge className="bg-gray-100 text-gray-600">user</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="riders" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {verifiedRiders.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-secondary">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        verified rider
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="verified" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {verifiedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-secondary">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        verified driver
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingLicenses.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-secondary">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewLicense(user)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        review
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <footer className="pt-6 border-t border-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.
        </footer>

        {/* License Review Modal */}
        <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary">
                review driver's license
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-16 h-16 bg-gradient-to-r from-primary to-secondary">
                    <AvatarFallback className="text-white font-bold text-xl">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-bold text-secondary">{selectedUser.full_name}</p>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-secondary">Stripe Identity Verification</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    This user has submitted their identity for verification through Stripe Identity.
                  </p>
                  {selectedUser.stripe_verification_session_id && (
                    <p className="text-xs text-gray-500">
                      Session ID: {selectedUser.stripe_verification_session_id}
                    </p>
                  )}
                  <p className="text-sm text-blue-700 mt-3">
                    Please verify the user's identity in your <a href="https://dashboard.stripe.com/identity/verification-sessions" target="_blank" rel="noopener noreferrer" className="underline font-medium">Stripe Dashboard</a> before approving.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleRejectLicense}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    reject license
                  </Button>
                  <Button
                    onClick={handleApproveLicense}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    approve license
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vehicle Review Modal */}
        <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary">
                review vehicle
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-16 h-16 bg-gradient-to-r from-primary to-secondary">
                    <AvatarFallback className="text-white font-bold text-xl">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-bold text-secondary">{selectedUser.full_name}</p>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold text-secondary mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Make:</p>
                      <p className="font-medium">{selectedUser.vehicle_make}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Model:</p>
                      <p className="font-medium">{selectedUser.vehicle_model}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Year:</p>
                      <p className="font-medium">{selectedUser.vehicle_year}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Color:</p>
                      <p className="font-medium">{selectedUser.vehicle_color}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">License Plate:</p>
                      <p className="font-medium">{selectedUser.license_plate}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-secondary">vehicle photo</p>
                    {selectedUser.vehicle_photo_url ? (
                      <img
                        src={selectedUser.vehicle_photo_url}
                        alt="Vehicle"
                        className="w-full rounded-lg border-2 border-border"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-400">No vehicle photo uploaded</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-secondary">insurance policy</p>
                    {selectedUser.auto_policy_photo_url ? (
                      <img
                        src={selectedUser.auto_policy_photo_url}
                        alt="Insurance"
                        className="w-full rounded-lg border-2 border-border"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-400">No insurance photo uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleRejectVehicle}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    reject vehicle
                  </Button>
                  <Button
                    onClick={handleApproveVehicle}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    approve vehicle
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AdminMessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          user={messageUser}
          onSuccess={loadData}
        />
      </div>
    </div>
  );
}