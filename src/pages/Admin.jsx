import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, X, CheckCircle, Clock, Users, AlertCircle, Eye, Car, MessageSquare, Phone, Mail, MapPin, Edit, Upload, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AdminMessageModal from "../components/admin/AdminMessageModal";
import UserAccountView from "../components/admin/UserAccountView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

// Convert internal base44 file URLs to public CDN URLs
const toPublicUrl = (url) => {
  if (!url) return url;
  // Transform: https://base44.app/api/apps/{appId}/files/mp/public/{appId}/{file}
  // To:        https://media.base44.com/images/public/{appId}/{file}
  const match = url.match(/\/files\/mp\/public\/([^/]+)\/(.+)$/);
  if (match) return `https://media.base44.com/images/public/${match[1]}/${match[2]}`;
  return url;
};

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [pendingLicenses, setPendingLicenses] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [rejectedVehicles, setRejectedVehicles] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [verifiedRiders, setVerifiedRiders] = useState([]);
  const [userEdits, setUserEdits] = useState([]);
  const [recentRideRequests, setRecentRideRequests] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [contactInquiries, setContactInquiries] = useState([]);
  const [phoneAlerts, setPhoneAlerts] = useState([]);
  const [pendingCommunityPosts, setPendingCommunityPosts] = useState([]);
  const [landingPageViews, setLandingPageViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [expiredDocUsers, setExpiredDocUsers] = useState([]);
  const [error, setError] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageUser, setMessageUser] = useState(null);
  const [hasHawaiiId, setHasHawaiiId] = useState(false);
  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [showUserAccountView, setShowUserAccountView] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewActivity, setShowNewActivity] = useState(true);
  const [showPhoneAlertModal, setShowPhoneAlertModal] = useState(false);
  const [selectedPhoneAlert, setSelectedPhoneAlert] = useState(null);

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
      const rejectedVeh = allUsers.filter(u => u.vehicle_rejection_reason && !u.vehicle_verified && !u.vehicle_pending_review);
      const drivers = allUsers.filter(u => u.user_type === 'driver');
      const riders = allUsers.filter(u => u.user_type === 'rider');

      // Fetch user edits
      const allEdits = await base44.entities.UserEdit.list('-created_date', 50);
      const unreviewedEdits = allEdits.filter(e => !e.is_reviewed);

      // Fetch recent ride requests and rides (last 72 hours)
      const allRideRequests = await base44.entities.RideRequest.list('-created_date', 500);
      const allRides = await base44.entities.Ride.list('-created_date', 500);
      const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const newRideRequests = allRideRequests.filter(r => new Date(r.created_date) > threeDaysAgo && r.status === 'active');
      const newRides = allRides.filter(r => new Date(r.created_date) > threeDaysAgo && r.status === 'active');

      setPendingLicenses(pendingLic);
      setPendingVehicles(pendingVeh);
      setRejectedVehicles(rejectedVeh);
      setVerifiedUsers(drivers);
      setVerifiedRiders(riders);
      setUserEdits(unreviewedEdits);
      setRecentRideRequests(newRideRequests);
      setRecentRides(newRides);

      // Load contact inquiries
      const allInquiries = await base44.entities.ContactInquiry.list('-created_date');
      const pendingInquiries = allInquiries.filter(i => i.status === 'pending');
      setContactInquiries(pendingInquiries);

      // Load phone number alerts
      const allBookings = await base44.entities.RideBooking.list('-updated_date');
      const phoneDetected = allBookings.filter(b => b.phone_number_detected === true);
      setPhoneAlerts(phoneDetected);

      // Load pending community posts
      const allCommunityPosts = await base44.entities.CommunityPost.list('-created_date');
      const pendingPosts = allCommunityPosts.filter(p => p.status === 'pending');
      setPendingCommunityPosts(pendingPosts);

      // Find users with expired docs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expired = allUsers.filter(u => {
        const licExpired = u.drivers_license_verified && u.license_expiry_date && new Date(u.license_expiry_date + 'T00:00:00') <= today;
        const insExpired = u.vehicle_verified && u.insurance_expiry_date && new Date(u.insurance_expiry_date + 'T00:00:00') <= today;
        return licExpired || insExpired;
      });
      setExpiredDocUsers(expired);

      // Load landing page views (last 24 hours)
      const allPageViews = await base44.entities.PageView.list('-created_date', 500);
      const recentLandingViews = allPageViews.filter(v => 
        v.page_name === 'Welcome' && new Date(v.created_date) > threeDaysAgo
      );
      setLandingPageViews(recentLandingViews.length);

    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error loading user data. Please try again.");
    }
    setIsLoading(false);
  };

  const handleViewLicense = (user) => {
    setSelectedUser(user);
    setHasHawaiiId(user.has_hawaii_id || false);
    setLicenseFrontFile(null);
    setLicenseBackFile(null);
    setLicenseExpiryDate(user.license_expiry_date || '');
    setShowLicenseModal(true);
  };

  const handleManualLicenseUpload = async () => {
    if (!selectedUser || !licenseFrontFile || !licenseBackFile) {
      alert("Please upload both front and back of the license.");
      return;
    }

    setIsUploadingLicense(true);
    try {
      // Upload license files
      const [frontResult, backResult] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: licenseFrontFile }),
        base44.integrations.Core.UploadFile({ file: licenseBackFile })
      ]);

      // Update user with license URLs
      await base44.entities.User.update(selectedUser.id, {
        drivers_license_front_url: frontResult.file_url,
        drivers_license_back_url: backResult.file_url,
        drivers_license_pending_review: true
      });

      // Log the edit
      await base44.entities.UserEdit.create({
        user_id: selectedUser.id,
        user_name: selectedUser.full_name,
        user_email: selectedUser.email,
        change_type: "license",
        change_description: "Admin uploaded driver's license manually",
        new_values: {
          license_front_url: frontResult.file_url,
          license_back_url: backResult.file_url
        }
      });

      alert("License uploaded successfully! You can now review and approve it.");
      setLicenseFrontFile(null);
      setLicenseBackFile(null);
      loadData();
    } catch (error) {
      console.error("Error uploading license:", error);
      alert("Error uploading license. Please try again.");
    }
    setIsUploadingLicense(false);
  };

  const handleViewVehicle = async (user) => {
    // Re-fetch fresh user data to get latest photo URLs
    try {
      const allUsers = await base44.entities.User.list();
      const freshUser = allUsers.find(u => u.id === user.id) || user;
      setSelectedUser(freshUser);
      setInsuranceExpiryDate(freshUser.insurance_expiry_date || '');
    } catch (e) {
      setSelectedUser(user);
      setInsuranceExpiryDate(user.insurance_expiry_date || '');
    }
    setShowVehicleModal(true);
  };

  const handleApproveLicense = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      // License approval always upgrades user to rider
      // If they also have vehicle verified, upgrade to driver
      const newUserType = selectedUser.vehicle_verified ? 'driver' : 'rider';

      await base44.entities.User.update(selectedUser.id, {
        drivers_license_verified: true,
        drivers_license_pending_review: false,
        license_rejection_reason: null,
        user_type: newUserType,
        has_hawaii_id: hasHawaiiId,
        license_expiry_date: licenseExpiryDate || null
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

      const statusMsg = newUserType === 'driver' 
        ? `License approved for ${selectedUser.full_name}. They are now a DRIVER and can post rides!`
        : `License approved for ${selectedUser.full_name}. They are now a RIDER and can book rides.`;
      
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
      // Vehicle approval always upgrades user to driver (they must be a rider first with verified license)
      const newUserType = 'driver';
      
      await base44.entities.User.update(selectedUser.id, {
        vehicle_verified: true,
        vehicle_pending_review: false,
        vehicle_rejection_reason: null,
        can_drive: true,
        user_type: newUserType,
        insurance_expiry_date: insuranceExpiryDate || null
      });

      // Send approval email notification
      await base44.integrations.Core.SendEmail({
        to: selectedUser.email,
        subject: "🚗 Your vehicle has been approved! - Cruise Kauaʻi",
        body: `Aloha ${selectedUser.full_name}!\n\nGreat news! Your vehicle has been verified and approved.\n\nYou can now post rides on Cruise Kauaʻi and start sharing the aloha with fellow travelers!\n\nMahalo for being part of our community,\nThe Cruise Kauaʻi Team`
      });

      alert(`Vehicle approved for ${selectedUser.full_name}. Their account has been upgraded to DRIVER and they can now post rides!`);
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

  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);

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

  const handleRespondToInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseMessage('');
    setShowRespondModal(true);
  };

  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseMessage.trim()) {
      alert('Please enter a response message.');
      return;
    }

    setIsSendingResponse(true);
    try {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: selectedInquiry.user_email,
        subject: `Re: ${selectedInquiry.subject} - Cruise Kauaʻi Support`,
        body: `Aloha ${selectedInquiry.user_name},\n\nThank you for contacting us. We've responded to your inquiry:\n\n"${selectedInquiry.subject}"\n\n---\n\n${responseMessage}\n\n---\n\nYou can view this response in your Cruise Kauaʻi inbox.\n\nMahalo,\nCruise Kauaʻi Team`
      });

      // Create admin message in user's inbox
      await base44.entities.AdminMessage.create({
        recipient_id: selectedInquiry.user_id,
        recipient_name: selectedInquiry.user_name,
        recipient_email: selectedInquiry.user_email,
        subject: `Re: ${selectedInquiry.subject}`,
        message: responseMessage,
        message_type: 'info'
      });

      // Update inquiry status to reviewed
      await base44.entities.ContactInquiry.update(selectedInquiry.id, {
        status: 'reviewed'
      });

      alert('Response sent successfully! The user will see it in their inbox.');
      setShowRespondModal(false);
      setSelectedInquiry(null);
      setResponseMessage('');
      loadData();
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Error sending response. Please try again.');
    }
    setIsSendingResponse(false);
  };

  const handleApproveCommunityPost = async (postId, userId) => {
    try {
      await base44.entities.CommunityPost.update(postId, {
        status: 'approved'
      });

      // Notify user their post was approved
      const post = pendingCommunityPosts.find(p => p.id === postId);
      if (post) {
        await base44.entities.AdminMessage.create({
          recipient_id: userId,
          recipient_name: post.user_name,
          subject: '🎉 Your community post has been approved!',
          message: `Your community post has been approved and is now live! Thank you for sharing your story with the Cruise Kauaʻi community.\n\nYour post:\n"${post.content.substring(0, 100)}..."\n\nKeep sharing the aloha!`,
          message_type: 'info'
        });
      }

      alert('Post approved and user notified!');
      loadData();
    } catch (error) {
      console.error('Error approving post:', error);
      alert('Error approving post. Please try again.');
    }
  };

  const handleRejectCommunityPost = async (postId, userId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      await base44.entities.CommunityPost.delete(postId);

      // Notify user their post was rejected
      const post = pendingCommunityPosts.find(p => p.id === postId);
      if (post) {
        await base44.entities.AdminMessage.create({
          recipient_id: userId,
          recipient_name: post.user_name,
          subject: 'Community Post Update',
          message: `We're unable to approve your recent community post at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you have questions, please contact us through the app.\n\nMahalo for your understanding.`,
          message_type: 'info'
        });
      }

      alert('Post rejected and user notified.');
      loadData();
    } catch (error) {
      console.error('Error rejecting post:', error);
      alert('Error rejecting post. Please try again.');
    }
  };

  const handleMessageUser = (user) => {
    setMessageUser(user);
    setShowMessageModal(true);
  };

  const handleViewUserAccount = (userId) => {
    setViewingUserId(userId);
    setShowUserAccountView(true);
  };

  const filteredSearchUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return user.full_name.toLowerCase().includes(query) || 
           user.email.toLowerCase().includes(query) ||
           (user.username && user.username.toLowerCase().includes(query));
  });

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
                  <button
                    key={booking.id}
                    onClick={() => { setSelectedPhoneAlert(booking); setShowPhoneAlertModal(true); }}
                    className="w-full bg-white rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-secondary">
                          {booking.passenger_name} ↔ {booking.driver_username || 'Driver'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Booking ID: {booking.id.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {booking.messages?.length || 0} messages — tap to review
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-600">needs review</Badge>
                        <ChevronRight className="w-4 h-4 text-red-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired Documents Alert */}
        {expiredDocUsers.length > 0 && (
          <Card className="shadow-lg border-orange-300 bg-orange-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                expired documents ({expiredDocUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4 text-sm">
                These users have expired licenses or insurance. Message them to re-verify.
              </p>
              <div className="space-y-3">
                {expiredDocUsers.map(u => {
                  const licExpired = u.drivers_license_verified && u.license_expiry_date && new Date(u.license_expiry_date + 'T00:00:00') <= new Date();
                  const insExpired = u.vehicle_verified && u.insurance_expiry_date && new Date(u.insurance_expiry_date + 'T00:00:00') <= new Date();
                  return (
                    <div key={u.id} className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-secondary">{u.full_name}</p>
                          <p className="text-sm text-gray-600">{u.email}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {licExpired && (
                              <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                                license expired {u.license_expiry_date}
                              </Badge>
                            )}
                            {insExpired && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                                insurance expired {u.insurance_expiry_date}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleMessageUser(u)}
                          size="sm"
                          variant="outline"
                          className="border-orange-400 text-orange-700 hover:bg-orange-50"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          message
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Community Posts */}
        {pendingCommunityPosts.length > 0 && (
          <Card className="shadow-lg border-purple-300 bg-purple-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                pending community posts ({pendingCommunityPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingCommunityPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                          {getInitials(post.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-secondary">@{post.user_username || post.user_name}</p>
                        <p className="text-xs text-gray-500">Submitted {new Date(post.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {post.image_urls.map((url, idx) => (
                          <img key={idx} src={url} alt={`Post image ${idx + 1}`} className="rounded-lg w-full h-32 object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Button
                        onClick={() => handleRejectCommunityPost(post.id, post.user_id)}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        reject
                      </Button>
                      <Button
                        onClick={() => handleApproveCommunityPost(post.id, post.user_id)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        approve
                      </Button>
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
                            inquiry.priority === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-300' :
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
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleRespondToInquiry(inquiry)}
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          respond
                        </Button>
                        <Button
                          onClick={() => handleResolveInquiry(inquiry.id)}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          <Card className="bg-white border-gray-200 rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6 text-center">
              <Clock className="w-5 h-5 md:w-8 md:h-8 text-orange-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-secondary">{pendingLicenses.length}</p>
              <p className="text-xs md:text-base text-gray-600">pending licenses</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6 text-center">
              <Car className="w-5 h-5 md:w-8 md:h-8 text-blue-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-secondary">{pendingVehicles.length}</p>
              <p className="text-xs md:text-base text-gray-600">pending vehicles</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6 text-center">
              <Eye className="w-5 h-5 md:w-8 md:h-8 text-purple-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-secondary">{landingPageViews}</p>
              <p className="text-xs md:text-base text-gray-600">landing views (24h)</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6 text-center">
              <Users className="w-5 h-5 md:w-8 md:h-8 text-blue-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-secondary">{verifiedRiders.length}</p>
              <p className="text-xs md:text-base text-gray-600">verified riders</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6 text-center">
              <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-green-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-secondary">{verifiedUsers.length}</p>
              <p className="text-xs md:text-base text-gray-600">verified drivers</p>
            </CardContent>
          </Card>
        </div>

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

        {/* New Ride Requests & Rides */}
        {(recentRideRequests.length > 0 || recentRides.length > 0) && (
          <Card className="shadow-lg border-blue-300 bg-blue-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  new activity (last 72h)
                </div>
                <Button
                  onClick={() => setShowNewActivity(!showNewActivity)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:bg-blue-100"
                >
                  {showNewActivity ? 'hide' : 'show'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showNewActivity && (
              <CardContent className="space-y-4">
              {recentRideRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">ride requests ({recentRideRequests.length})</h3>
                  <div className="grid gap-3">
                    {recentRideRequests.map(request => (
                      <div key={request.id} className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                            <AvatarFallback className="text-white font-semibold text-sm">
                              {getInitials(request.rider_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <button
                              onClick={() => {
                                const u = users.find(u => u.id === request.rider_id);
                                if (u) handleViewUserAccount(u.id);
                              }}
                              className="font-semibold text-secondary hover:text-primary transition-colors text-left"
                            >{request.rider_name}</button>
                            <p className="text-sm text-gray-600">{request.departure_location} → {request.destination}</p>
                            <p className="text-xs text-gray-500">{format(new Date(request.departure_date + 'T00:00:00'), "MMM d")} at {request.departure_time}</p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            {request.seats_needed} seat{request.seats_needed > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recentRides.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">posted rides ({recentRides.length})</h3>
                  <div className="grid gap-3">
                    {recentRides.map(ride => (
                      <div key={ride.id} className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                            <AvatarFallback className="text-white font-semibold text-sm">
                              {getInitials(ride.driver_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <button
                              onClick={() => {
                                const u = users.find(u => u.id === ride.driver_id);
                                if (u) handleViewUserAccount(u.id);
                              }}
                              className="font-semibold text-secondary hover:text-primary transition-colors text-left"
                            >{ride.driver_name}</button>
                            <p className="text-sm text-gray-600">{ride.departure_location} → {ride.destination}</p>
                            <p className="text-xs text-gray-500">{format(new Date(ride.departure_date + 'T00:00:00'), "MMM d")} at {ride.departure_time}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            {ride.seats_available} seat{ride.seats_available > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </CardContent>
            )}
          </Card>
        )}

        {/* User Edit Notifications */}
        {userEdits.length > 0 && (
          <Card className="shadow-lg border-purple-300 bg-purple-50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  user edits ({userEdits.length})
                </div>
                <Button
                  onClick={async () => {
                    await Promise.all(userEdits.map(e => base44.entities.UserEdit.update(e.id, { is_reviewed: true })));
                    loadData();
                  }}
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  mark all as reviewed
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {userEdits.map(edit => (
                  <div key={edit.id} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-12 h-12 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(edit.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <button
                            onClick={() => {
                              const u = users.find(u => u.id === edit.user_id);
                              if (u) handleViewUserAccount(u.id);
                            }}
                            className="font-semibold text-secondary hover:text-primary transition-colors text-left"
                          >{edit.user_name}</button>
                          <p className="text-sm text-gray-600">{edit.user_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                              {edit.change_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(edit.created_date), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{edit.change_description}</p>
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          await base44.entities.UserEdit.update(edit.id, { is_reviewed: true });
                          loadData();
                        }}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        mark reviewed
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl text-secondary">all users</CardTitle>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                <TabsTrigger value="all" className="text-xs md:text-sm py-2">all ({users.length})</TabsTrigger>
                <TabsTrigger value="riders" className="text-xs md:text-sm py-2">riders ({verifiedRiders.length})</TabsTrigger>
                <TabsTrigger value="verified" className="text-xs md:text-sm py-2">drivers ({verifiedUsers.length})</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm py-2">pending ({pendingLicenses.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSearchUsers.map(user => {
                    // Determine verification status for middle badge
                    let verificationStatus = 'not submitted';
                    let verificationBadgeClass = 'bg-gray-100 text-gray-600';
                    
                    if (user.user_type === 'driver' || user.vehicle_verified) {
                      verificationStatus = 'verified driver';
                      verificationBadgeClass = 'bg-green-100 text-green-800';
                    } else if (user.user_type === 'rider' || user.drivers_license_verified) {
                      verificationStatus = 'verified rider';
                      verificationBadgeClass = 'bg-blue-100 text-blue-800';
                    } else if (user.drivers_license_pending_review || user.vehicle_pending_review) {
                      verificationStatus = 'pending';
                      verificationBadgeClass = 'bg-gray-100 text-gray-700 border-gray-300';
                    }

                    // Determine account type for far right badge
                    let accountType = 'user';
                    let accountBadgeClass = 'bg-gray-100 text-gray-600';
                    
                    if (user.role === 'admin') {
                      accountType = 'admin';
                      accountBadgeClass = 'bg-purple-100 text-purple-800';
                    } else if (user.user_type === 'driver') {
                      accountType = 'driver';
                      accountBadgeClass = 'bg-green-100 text-green-800';
                    } else if (user.user_type === 'rider') {
                      accountType = 'rider';
                      accountBadgeClass = 'bg-blue-100 text-blue-800';
                    }

                    return (
                      <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-lg gap-2">
                        <div className="flex items-center gap-2 md:gap-3">
                          <Avatar className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary to-secondary">
                            <AvatarFallback className="text-white font-semibold text-xs md:text-sm">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <button 
                              onClick={() => handleViewUserAccount(user.id)}
                              className="font-medium text-secondary text-sm md:text-base truncate hover:text-primary transition-colors text-left"
                            >
                              {user.full_name}
                            </button>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
                          <Button
                            onClick={() => handleMessageUser(user)}
                            size="sm"
                            variant="outline"
                            className="rounded-2xl border-blue-300 text-blue-600 hover:bg-blue-50 text-xs md:text-sm h-7 md:h-8 px-2 md:px-3"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            message
                          </Button>
                          <Badge variant={verificationStatus === 'pending' ? 'outline' : 'default'} className={`text-xs ${verificationStatus === 'pending' ? 'bg-gray-100 text-gray-700 border-gray-300' : verificationBadgeClass}`}>
                            {verificationStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {(verificationStatus === 'verified driver' || verificationStatus === 'verified rider') && <CheckCircle className="w-3 h-3 mr-1" />}
                            {verificationStatus}
                          </Badge>
                          <Badge className={`text-xs ${accountBadgeClass}`}>
                            {accountType}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="riders" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {verifiedRiders.map(user => (
                    <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-lg gap-2">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold text-xs md:text-sm">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button 
                            onClick={() => handleViewUserAccount(user.id)}
                            className="font-medium text-secondary text-sm md:text-base truncate hover:text-primary transition-colors text-left"
                          >
                            {user.full_name}
                          </button>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 text-xs self-end md:self-auto">
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
                    <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-lg gap-2">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold text-xs md:text-sm">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button 
                            onClick={() => handleViewUserAccount(user.id)}
                            className="font-medium text-secondary text-sm md:text-base truncate hover:text-primary transition-colors text-left"
                          >
                            {user.full_name}
                          </button>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs self-end md:self-auto">
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
                    <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 gap-2">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary to-secondary">
                          <AvatarFallback className="text-white font-semibold text-xs md:text-sm">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button 
                            onClick={() => handleViewUserAccount(user.id)}
                            className="font-medium text-secondary text-sm md:text-base truncate hover:text-primary transition-colors text-left"
                          >
                            {user.full_name}
                          </button>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewLicense(user)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-xs md:text-sm h-7 md:h-8"
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

                  {(selectedUser.drivers_license_front_url || selectedUser.drivers_license_back_url) && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-secondary">Manually Uploaded License</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedUser.drivers_license_front_url && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Front</p>
                            <img
                              src={selectedUser.drivers_license_front_url}
                              alt="License front"
                              className="w-full rounded-lg border-2 border-border object-cover"
                            />
                          </div>
                        )}
                        {selectedUser.drivers_license_back_url && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Back</p>
                            <img
                              src={selectedUser.drivers_license_back_url}
                              alt="License back"
                              className="w-full rounded-lg border-2 border-border object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                    <h4 className="font-semibold text-secondary">Upload License Manually (Admin Only)</h4>
                    <p className="text-sm text-gray-600">If the user hasn't uploaded their license, you can do it here.</p>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Front of License</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLicenseFrontFile(e.target.files[0])}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                        />
                        {licenseFrontFile && (
                          <p className="text-xs text-green-600">✓ {licenseFrontFile.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Back of License</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLicenseBackFile(e.target.files[0])}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                        />
                        {licenseBackFile && (
                          <p className="text-xs text-green-600">✓ {licenseBackFile.name}</p>
                        )}
                      </div>

                      <Button
                        onClick={handleManualLicenseUpload}
                        disabled={isUploadingLicense || !licenseFrontFile || !licenseBackFile}
                        className="w-full bg-gray-700 hover:bg-gray-800"
                      >
                        {isUploadingLicense ? 'uploading...' : 'upload license'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHawaiiId}
                      onChange={(e) => setHasHawaiiId(e.target.checked)}
                      className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-semibold text-green-900">Has Hawaiʻi ID for local pricing?</span>
                      <p className="text-sm text-green-700">Check this if the user's license is from Hawaiʻi to enable local pricing.</p>
                    </div>
                  </label>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                     <label className="font-semibold text-gray-900 block">License Expiration Date</label>
                     <p className="text-sm text-gray-600">Enter the expiry date from the license (e.g. 12/2028). You'll be notified when it expires.</p>
                     <input
                       type="text"
                       placeholder="MM/YYYY"
                       value={licenseExpiryDate}
                       onChange={(e) => setLicenseExpiryDate(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                     />
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

                {/* Vehicle Exterior Photo */}
                 <div className="space-y-2">
                   <p className="font-semibold text-secondary">outside of vehicle</p>
                   {selectedUser.vehicle_exterior_photo_url ? (
                     <div className="space-y-2">
                       <a href={toPublicUrl(selectedUser.vehicle_exterior_photo_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline block">open photo in new tab ↗</a>
                       <p className="text-xs text-gray-400 break-all">{toPublicUrl(selectedUser.vehicle_exterior_photo_url)}</p>
                       <img
                         src={toPublicUrl(selectedUser.vehicle_exterior_photo_url)}
                         alt="Vehicle exterior"
                         className="w-full rounded-lg border-2 border-border object-cover max-h-96"
                       />
                     </div>
                   ) : (
                     <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                       <p className="text-gray-400">No exterior photo uploaded</p>
                     </div>
                   )}
                 </div>

                {/* Vehicle Interior Photos */}
                 <div className="space-y-2">
                   <p className="font-semibold text-secondary">inside of vehicle</p>
                   {selectedUser.vehicle_interior_photo_urls && selectedUser.vehicle_interior_photo_urls.length > 0 ? (
                     <div className="space-y-2">
                       <div className="flex flex-wrap gap-2">
                         {selectedUser.vehicle_interior_photo_urls.map((url, idx) => (
                           <a key={idx} href={toPublicUrl(url)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">photo {idx + 1} ↗</a>
                         ))}
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         {selectedUser.vehicle_interior_photo_urls.map((url, idx) => (
                           <img
                            key={idx}
                            src={toPublicUrl(url)}
                            alt={`Vehicle interior ${idx + 1}`}
                            className="w-full rounded-lg border-2 border-border object-cover h-48"
                           />
                         ))}
                       </div>
                     </div>
                   ) : (
                     <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                       <p className="text-gray-400">No interior photos uploaded</p>
                     </div>
                   )}
                 </div>

                {/* Insurance Expiry Date */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <label className="font-semibold text-gray-900 block">Insurance Expiration Date</label>
                  <p className="text-sm text-gray-600">Enter the expiry date from the insurance card (e.g. 06/2026). You'll be notified when it expires.</p>
                  <input
                    type="text"
                    placeholder="MM/YYYY"
                    value={insuranceExpiryDate}
                    onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Insurance Policy */}
                <div className="space-y-2">
                  <p className="font-semibold text-secondary">insurance policy</p>
                  {selectedUser.auto_policy_photo_url ? (
                    <img
                      src={toPublicUrl(selectedUser.auto_policy_photo_url)}
                      alt="Insurance"
                      className="w-full rounded-lg border-2 border-border object-cover max-h-96"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">No insurance photo uploaded</p>
                    </div>
                  )}
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

        {/* Phone Alert Review Modal */}
        <Dialog open={showPhoneAlertModal} onOpenChange={setShowPhoneAlertModal}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-800 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-600" />
                phone number alert — review messages
              </DialogTitle>
            </DialogHeader>
            {selectedPhoneAlert && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-semibold text-secondary">
                    {selectedPhoneAlert.passenger_name} ↔ {selectedPhoneAlert.driver_username || 'Driver'}
                  </p>
                  <p className="text-xs text-gray-500">Booking ID: {selectedPhoneAlert.id}</p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(selectedPhoneAlert.messages || []).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No messages found.</p>
                  ) : (
                    (selectedPhoneAlert.messages || []).map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border text-sm ${msg.sender_id === selectedPhoneAlert.passenger_id ? 'bg-blue-50 border-blue-200 ml-4' : 'bg-gray-50 border-gray-200 mr-4'}`}>
                        <p className="font-semibold text-secondary text-xs mb-1">@{msg.sender_name} · {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-200">
                  <Button
                    onClick={async () => {
                      await base44.entities.RideBooking.update(selectedPhoneAlert.id, { phone_number_detected: false });
                      setShowPhoneAlertModal(false);
                      setSelectedPhoneAlert(null);
                      loadData();
                    }}
                    variant="outline"
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    mark reviewed (dismiss)
                  </Button>
                  <Button
                    onClick={() => {
                      const u = users.find(u => u.id === selectedPhoneAlert.passenger_id);
                      if (u) { handleMessageUser(u); setShowPhoneAlertModal(false); }
                      else alert('User not found.');
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    warn passenger
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

        <UserAccountView
          isOpen={showUserAccountView}
          onClose={() => setShowUserAccountView(false)}
          userId={viewingUserId}
        />

        {/* Contact Inquiry Response Modal */}
        <Dialog open={showRespondModal} onOpenChange={setShowRespondModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary">
                respond to inquiry
              </DialogTitle>
            </DialogHeader>

            {selectedInquiry && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="font-semibold text-secondary mb-2">Original Inquiry:</p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>From:</strong> {selectedInquiry.user_name} ({selectedInquiry.user_email})
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Subject:</strong> {selectedInquiry.subject}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 p-3 bg-white rounded-lg">
                    {selectedInquiry.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-secondary">Your Response:</label>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response here..."
                    className="h-40 rounded-2xl"
                  />
                  <p className="text-xs text-gray-500">
                    This will be sent via email and appear in the user's Cruise Kauaʻi inbox.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowRespondModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isSendingResponse}
                  >
                    cancel
                  </Button>
                  <Button
                    onClick={handleSendResponse}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSendingResponse || !responseMessage.trim()}
                  >
                    {isSendingResponse ? 'sending...' : 'send response'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}