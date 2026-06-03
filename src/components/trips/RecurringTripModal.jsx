import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Car, X, Plus, Lightbulb } from "lucide-react";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import { base44 } from "@/api/base44Client";
import { getPricingInfo } from "./pricingUtils";
import { useDraftSave, loadDraft, clearDraft } from "@/hooks/useDraftSave";

const NEW_TRIP_DRAFT_KEY = 'draft_recurring_trip_new';

export default function RecurringTripModal({ isOpen, onClose, onSave, editTrip }) {
  const [loading, setLoading] = useState(false);
  const draftKey = editTrip ? null : NEW_TRIP_DRAFT_KEY;
  const _draft = !editTrip ? loadDraft(NEW_TRIP_DRAFT_KEY) : null;
  const [tripData, setTripData] = useState({
    trip_name: "",
    departure_location: "",
    destination: "",
    stops: [],
    departure_time: "",
    is_flexible: false,
    seats_available: 1,
    price_per_seat: 0,
    price_per_seat_local: 0,
    price_per_seat_tourist: 0,
    rider_preference: "both_fine",
    description: "",
    car_model: "",
    smoking_allowed: false,
    pets_allowed: false,
    offers_detour_service: false
  });
  const [stopInput, setStopInput] = useState("");
  const [pricingSuggestion, setPricingSuggestion] = useState(null);

  // Auto-save draft for new trips only
  useDraftSave(draftKey, draftKey ? tripData : null);

  React.useEffect(() => {
    const loadAndInit = async () => {
      // Load user vehicle info for autofill
      let userCarModel = "";
      let userSeats = 1;
      try {
        const user = await base44.auth.me();
        if (user.vehicle_make || user.vehicle_model) {
          userCarModel = [user.vehicle_year, user.vehicle_make, user.vehicle_model].filter(Boolean).join(" ");
        }
        if (user.seats_available) userSeats = user.seats_available;
      } catch (e) {}

      if (editTrip) {
        setTripData({
          trip_name: editTrip.trip_name || "",
          departure_location: editTrip.departure_location || "",
          destination: editTrip.destination || "",
          stops: editTrip.stops || [],
          departure_time: editTrip.departure_time || "",
          is_flexible: editTrip.is_flexible || false,
          seats_available: editTrip.seats_available || userSeats,
          price_per_seat: editTrip.price_per_seat || 0,
          price_per_seat_local: editTrip.price_per_seat_local || 0,
          price_per_seat_tourist: editTrip.price_per_seat_tourist || 0,
          rider_preference: editTrip.rider_preference || "both_fine",
          description: editTrip.description || "",
          car_model: editTrip.car_model || userCarModel,
          smoking_allowed: editTrip.smoking_allowed || false,
          pets_allowed: editTrip.pets_allowed || false,
          offers_detour_service: editTrip.offers_detour_service || false
        });
      } else {
        const d = loadDraft(NEW_TRIP_DRAFT_KEY);
        setTripData({
          trip_name: d?.trip_name || "",
          departure_location: d?.departure_location || "",
          destination: d?.destination || "",
          stops: d?.stops || [],
          departure_time: d?.departure_time || "",
          is_flexible: d?.is_flexible || false,
          seats_available: d?.seats_available || userSeats,
          price_per_seat: d?.price_per_seat || 0,
          price_per_seat_local: d?.price_per_seat_local || 0,
          price_per_seat_tourist: d?.price_per_seat_tourist || 0,
          rider_preference: d?.rider_preference || "both_fine",
          description: d?.description || "",
          car_model: d?.car_model || userCarModel,
          smoking_allowed: d?.smoking_allowed || false,
          pets_allowed: d?.pets_allowed || false,
          offers_detour_service: d?.offers_detour_service || false
        });
      }
    };

    if (isOpen) loadAndInit();
  }, [editTrip, isOpen]);

  // Update pricing suggestion when route changes
  React.useEffect(() => {
    if (tripData.departure_location && tripData.destination) {
      const info = getPricingInfo(tripData.departure_location, tripData.destination);
      setPricingSuggestion(info.suggestion);
    } else {
      setPricingSuggestion(null);
    }
  }, [tripData.departure_location, tripData.destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await base44.auth.me();
      let savedTrip;
      
      if (editTrip) {
        await base44.entities.RecurringTrip.update(editTrip.id, tripData);
        savedTrip = { ...editTrip, ...tripData };
      } else {
        savedTrip = await base44.entities.RecurringTrip.create({
          ...tripData,
          user_id: user.id
        });
      }
      
      clearDraft(NEW_TRIP_DRAFT_KEY);
      onSave(savedTrip);
      setTripData({
        trip_name: "",
        departure_location: "",
        destination: "",
        stops: [],
        departure_time: "",
        is_flexible: false,
        seats_available: 1,
        price_per_seat: 0,
        price_per_seat_local: 0,
        price_per_seat_tourist: 0,
        rider_preference: "both_fine",
        description: "",
        car_model: "",
        smoking_allowed: false,
        pets_allowed: false,
        offers_detour_service: false
      });
      onClose();
    } catch (error) {
      console.error("Error saving recurring trip:", error);
    } finally {
      setLoading(false);
    }
  };

  const addStop = () => {
    if (stopInput.trim()) {
      setTripData({ ...tripData, stops: [...tripData.stops, stopInput.trim()] });
      setStopInput("");
    }
  };

  const removeStop = (index) => {
    setTripData({ ...tripData, stops: tripData.stops.filter((_, i) => i !== index) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">
            {editTrip ? 'edit recurring trip' : 'add recurring trip'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>trip name</Label>
            <Input
              placeholder="e.g. morning commute, costco run"
              value={tripData.trip_name}
              onChange={(e) => setTripData({ ...tripData, trip_name: e.target.value })}
              required
            />
          </div>

          {/* Route Details */}
          <Card className="border-primary/20 rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-secondary">route details</h3>
              </div>

              <div className="space-y-2">
                <Label>departure location</Label>
                <LocationAutocomplete
                  value={tripData.departure_location}
                  onChange={(value) => setTripData({ ...tripData, departure_location: value })}
                  placeholder="where are you starting from?"
                />
              </div>

              <div className="space-y-2">
                <Label>destination</Label>
                <LocationAutocomplete
                  value={tripData.destination}
                  onChange={(value) => setTripData({ ...tripData, destination: value })}
                  placeholder="where are you going?"
                />
              </div>

              <div className="space-y-2">
                <Label>stops (optional)</Label>
                <div className="flex gap-2">
                  <LocationAutocomplete
                    value={stopInput}
                    onChange={setStopInput}
                    placeholder="add a stop along the way"
                  />
                  <Button type="button" variant="outline" onClick={addStop} className="rounded-2xl">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tripData.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl">
                    <span className="flex-1">{stop}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStop(index)}
                      className="rounded-2xl"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-primary/20 rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-secondary">schedule</h3>

              <div className="space-y-2">
                <Label>departure time</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., 9:00"
                    value={tripData.departure_time.replace(/\s*(AM|PM)$/i, '')}
                    onChange={(e) => {
                      const period = tripData.departure_time.match(/\s*(AM|PM)$/i)?.[1] || 'AM';
                      setTripData({ ...tripData, departure_time: e.target.value + ' ' + period });
                    }}
                    required
                    className="flex-1"
                  />
                  <Select
                    value={tripData.departure_time.match(/\s*(AM|PM)$/i)?.[1]?.toUpperCase() || 'AM'}
                    onValueChange={(period) => {
                      const timeWithoutPeriod = tripData.departure_time.replace(/\s*(AM|PM)$/i, '').trim();
                      setTripData({ ...tripData, departure_time: timeWithoutPeriod + ' ' + period });
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>flexible with time?</Label>
                <Switch
                  checked={tripData.is_flexible}
                  onCheckedChange={(checked) => setTripData({ ...tripData, is_flexible: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle & Pricing */}
          <Card className="border-primary/20 rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-secondary">vehicle & pricing</h3>
              </div>

              <div className="space-y-2">
                <Label>car model</Label>
                <Input
                  placeholder="e.g., toyota camry, honda civic"
                  value={tripData.car_model}
                  onChange={(e) => setTripData({ ...tripData, car_model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>seats available</Label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={tripData.seats_available}
                  onChange={(e) => setTripData({ ...tripData, seats_available: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>rider preference</Label>
                <Select
                  value={tripData.rider_preference}
                  onValueChange={(value) => setTripData({ ...tripData, rider_preference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both_fine">both locals and tourists</SelectItem>
                    <SelectItem value="locals_only">locals only</SelectItem>
                    <SelectItem value="tourists_only">tourists only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pricingSuggestion && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">suggested prices for this route (~{pricingSuggestion.distance} mi)</p>
                    <p>locals: <strong>${pricingSuggestion.local}</strong> &nbsp;·&nbsp; tourists: <strong>${pricingSuggestion.visitor}</strong></p>
                    <button
                      type="button"
                      onClick={() => setTripData(d => ({ ...d, price_per_seat_local: pricingSuggestion.local, price_per_seat_tourist: pricingSuggestion.visitor, price_per_seat: pricingSuggestion.local }))}
                      className="underline text-amber-700 hover:text-amber-900 font-medium"
                    >
                      use these prices
                    </button>
                  </div>
                </div>
              )}

              {tripData.rider_preference === "both_fine" && (
                <>
                  <div className="space-y-2">
                    <Label>price per seat (locals)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripData.price_per_seat_local}
                      onChange={(e) => setTripData({ ...tripData, price_per_seat_local: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>price per seat (tourists)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripData.price_per_seat_tourist}
                      onChange={(e) => setTripData({ ...tripData, price_per_seat_tourist: parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {tripData.rider_preference !== "both_fine" && (
                <div className="space-y-2">
                  <Label>price per seat</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tripData.price_per_seat}
                    onChange={(e) => setTripData({ ...tripData, price_per_seat: parseFloat(e.target.value) })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>smoking allowed?</Label>
                <Switch
                  checked={tripData.smoking_allowed}
                  onCheckedChange={(checked) => setTripData({ ...tripData, smoking_allowed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>pets allowed?</Label>
                <Switch
                  checked={tripData.pets_allowed}
                  onCheckedChange={(checked) => setTripData({ ...tripData, pets_allowed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>offer detour service?</Label>
                <Switch
                  checked={tripData.offers_detour_service}
                  onCheckedChange={(checked) => setTripData({ ...tripData, offers_detour_service: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>description</Label>
                <Textarea
                  placeholder="why are you making this trip?"
                  value={tripData.description}
                  onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl">
              cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-2xl bg-primary">
              {loading ? "saving..." : editTrip ? "update recurring trip" : "save recurring trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}