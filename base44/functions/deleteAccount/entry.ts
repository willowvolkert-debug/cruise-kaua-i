import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Account deletion flow: cancels all active rides/bookings, deletes the
// user's data across all entities, and anonymizes their profile.
// The User record itself is managed by the platform and cannot be
// deleted from here, so we clear all custom fields instead.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const userId = user.id;

    // 1. Cancel all active rides posted by this user
    const myRides = await base44.asServiceRole.entities.Ride.filter({ driver_id: userId, status: { $in: ['active', 'full'] } });
    for (const ride of myRides) {
      await base44.asServiceRole.entities.Ride.update(ride.id, { status: 'cancelled' });
    }

    // 2. Cancel all active bookings made by this user (as passenger)
    const myBookings = await base44.asServiceRole.entities.RideBooking.filter({
      passenger_id: userId,
      booking_status: { $in: ['pending', 'confirmed'] }
    });
    for (const booking of myBookings) {
      await base44.asServiceRole.entities.RideBooking.update(booking.id, {
        booking_status: 'cancelled',
        cancellation_reason: 'Account deleted by user',
        cancellation_date: new Date().toISOString()
      });
    }

    // 3. Delete recurring trips, schedules, and ride requests
    const recurringTrips = await base44.asServiceRole.entities.RecurringTrip.filter({ user_id: userId });
    if (recurringTrips.length) await base44.asServiceRole.entities.RecurringTrip.deleteMany({ user_id: userId });

    const recurringSchedules = await base44.asServiceRole.entities.RecurringSchedule.filter({ user_id: userId });
    if (recurringSchedules.length) await base44.asServiceRole.entities.RecurringSchedule.deleteMany({ user_id: userId });

    const recurringRideRequests = await base44.asServiceRole.entities.RecurringRideRequest.filter({ user_id: userId });
    if (recurringRideRequests.length) await base44.asServiceRole.entities.RecurringRideRequest.deleteMany({ user_id: userId });

    // 4. Delete ride posts
    const ridePosts = await base44.asServiceRole.entities.RidePost.filter({ rider_id: userId });
    if (ridePosts.length) await base44.asServiceRole.entities.RidePost.deleteMany({ rider_id: userId });

    // 5. Delete ratings given and received
    const ratingsGiven = await base44.asServiceRole.entities.Rating.filter({ rated_by_user_id: userId });
    if (ratingsGiven.length) await base44.asServiceRole.entities.Rating.deleteMany({ rated_by_user_id: userId });

    // 6. Delete admin messages
    const adminMessages = await base44.asServiceRole.entities.AdminMessage.filter({ recipient_id: userId });
    if (adminMessages.length) await base44.asServiceRole.entities.AdminMessage.deleteMany({ recipient_id: userId });

    // 7. Delete contact inquiries
    const inquiries = await base44.asServiceRole.entities.ContactInquiry.filter({ user_id: userId });
    if (inquiries.length) await base44.asServiceRole.entities.ContactInquiry.deleteMany({ user_id: userId });

    // 8. Anonymize the user profile — clear all custom fields
    await base44.auth.updateMe({
      username: null,
      bio: null,
      age: null,
      gender: null,
      home_base: null,
      phone_number: null,
      profile_picture_url: null,
      profile_complete: false,
      has_completed_profile_quiz: false,
      drivers_license_verified: false,
      drivers_license_front_url: null,
      drivers_license_back_url: null,
      vehicle_verified: false,
      vehicle_make: null,
      vehicle_model: null,
      vehicle_year: null,
      vehicle_color: null,
      license_plate: null,
      vehicle_exterior_photo_url: null,
      vehicle_interior_photo_urls: [],
      auto_policy_photo_url: null,
      sms_notifications_enabled: false,
      notifications_enabled: false,
      account_deleted: true,
      account_deleted_date: new Date().toISOString(),
    });

    return Response.json({ success: true, message: 'Account data deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});