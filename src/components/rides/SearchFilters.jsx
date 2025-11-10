import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Calendar, Clock, Sparkles } from "lucide-react";

export default function SearchFilters({ filters, onFiltersChange, onSearch }) {
  const handleInputChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };
  const handleCheckboxChange = (field, checked) => {
    onFiltersChange({ ...filters, [field]: checked });
  };

  return (
    <Card className="shadow-md border-border bg-white/70 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="departure" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Coming From</Label>
            <Input id="departure" placeholder="e.g., Honolulu" value={filters.departure_location || ''} onChange={(e) => handleInputChange('departure_location', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Going To</Label>
            <Input id="destination" placeholder="e.g., Haleʻiwa" value={filters.destination || ''} onChange={(e) => handleInputChange('destination', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary"/>Departure Date</Label>
            <Input id="date" type="date" value={filters.departure_date || ''} onChange={(e) => handleInputChange('departure_date', e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-4 justify-center mt-6">
           <div className="flex items-center space-x-2">
            <Checkbox id="flex" checked={filters.is_flexible} onCheckedChange={(c) => handleCheckboxChange('is_flexible', c)} />
            <Label htmlFor="flex" className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary"/>Flexible Time</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="lastminute" checked={filters.is_last_minute} onCheckedChange={(c) => handleCheckboxChange('is_last_minute', c)} />
            <Label htmlFor="lastminute" className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary"/>Last Minute (within 3 hrs)</Label>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button onClick={onSearch} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Search className="w-5 h-5 mr-2" />
            Find Rides
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}