'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Star,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  locationData,
  getAreasForSubCity,
  LICENSE_TYPES,
  LICENSE_LEVELS,
} from '@/lib/location-data';

interface SurveyFormProps {
  onSubmit: () => void;
}

export default function SurveyForm({ onSubmit }: SurveyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubCity, setSelectedSubCity] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [formData, setFormData] = useState({
    guestHouseName: '',
    subCity: '',
    area: '',
    specificAddress: '',
    numberOfRooms: '',
    licenseType: '',
    licenseLevel: '',
    licenseNumber: '',
    contactPhone: '',
    contactName: '',
    ownerName: '',
    hasRestaurant: false,
    hasParking: false,
    hasWiFi: false,
    hasHotWater: false,
    additionalServices: '',
    surveyorName: '',
  });

  const handleSubCityChange = (value: string) => {
    setSelectedSubCity(value);
    const subAreas = getAreasForSubCity(value);
    setAreas(subAreas);
    setFormData((prev) => ({ ...prev, subCity: value, area: '' }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guestHouseName || !formData.subCity || !formData.area) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in guest house name, sub-city, and area.',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Service Rating Required',
        description: 'Please provide a service rating.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/guesthouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, serviceRating: rating }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit');
      }

      toast({
        title: 'Survey Submitted!',
        description: `${formData.guestHouseName} has been recorded successfully.`,
      });

      // Reset form
      setFormData({
        guestHouseName: '',
        subCity: '',
        area: '',
        specificAddress: '',
        numberOfRooms: '',
        licenseType: '',
        licenseLevel: '',
        licenseNumber: '',
        contactPhone: '',
        contactName: '',
        ownerName: '',
        hasRestaurant: false,
        hasParking: false,
        hasWiFi: false,
        hasHotWater: false,
        additionalServices: '',
        surveyorName: '',
      });
      setSelectedSubCity('');
      setAreas([]);
      setRating(0);
      onSubmit();
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest House Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Guest House Information
          </CardTitle>
          <CardDescription>Basic details about the guest house</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestHouseName">
              Guest House Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guestHouseName"
              name="guestHouseName"
              placeholder="e.g., Bishoftu Paradise Lodge"
              value={formData.guestHouseName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subCity">
                Sub-City <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subCity}
                onValueChange={handleSubCityChange}
              >
                <SelectTrigger id="subCity">
                  <SelectValue placeholder="Select sub-city" />
                </SelectTrigger>
                <SelectContent>
                  {locationData.subCities.map((sc) => (
                    <SelectItem key={sc.name} value={sc.name}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">
                Area / Kebele <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.area}
                onValueChange={(v) => handleSelectChange('area', v)}
                disabled={!selectedSubCity}
              >
                <SelectTrigger id="area">
                  <SelectValue
                    placeholder={
                      selectedSubCity
                        ? 'Select area'
                        : 'Select sub-city first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specificAddress">Specific Address</Label>
            <Textarea
              id="specificAddress"
              name="specificAddress"
              placeholder="Street name, landmark, building number..."
              value={formData.specificAddress}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Capacity & License */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Capacity & License</CardTitle>
          <CardDescription>
            Room capacity and licensing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numberOfRooms">
              Number of Rooms <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numberOfRooms"
              name="numberOfRooms"
              type="number"
              min="1"
              placeholder="e.g., 20"
              value={formData.numberOfRooms}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>License Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.licenseType}
                onValueChange={(v) => handleSelectChange('licenseType', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>License Level <span className="text-red-500">*</span></Label>
              <Select
                value={formData.licenseLevel}
                onValueChange={(v) => handleSelectChange('licenseLevel', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              placeholder="e.g., GH-2024-001"
              value={formData.licenseNumber}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Service Rating
          </CardTitle>
          <CardDescription>Rate the overall service quality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="rounded-sm p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-none text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm text-muted-foreground">
              {rating > 0
                ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][
                    rating - 1
                  ]
                : 'Tap to rate'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <CardDescription>Owner and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              name="ownerName"
              placeholder="Full name of owner"
              value={formData.ownerName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Person</Label>
            <Input
              id="contactName"
              name="contactName"
              placeholder="Manager or reception contact"
              value={formData.contactName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone Number</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              placeholder="e.g., +251 91 234 5678"
              value={formData.contactPhone}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Amenities & Services</CardTitle>
          <CardDescription>Available facilities at the guest house</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasRestaurant"
                checked={formData.hasRestaurant}
                onCheckedChange={(c) =>
                  handleCheckboxChange('hasRestaurant', c === true)
                }
              />
              <Label htmlFor="hasRestaurant" className="cursor-pointer">
                Restaurant
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasParking"
                checked={formData.hasParking}
                onCheckedChange={(c) =>
                  handleCheckboxChange('hasParking', c === true)
                }
              />
              <Label htmlFor="hasParking" className="cursor-pointer">
                Parking
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasWiFi"
                checked={formData.hasWiFi}
                onCheckedChange={(c) =>
                  handleCheckboxChange('hasWiFi', c === true)
                }
              />
              <Label htmlFor="hasWiFi" className="cursor-pointer">
                WiFi
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasHotWater"
                checked={formData.hasHotWater}
                onCheckedChange={(c) =>
                  handleCheckboxChange('hasHotWater', c === true)
                }
              />
              <Label htmlFor="hasHotWater" className="cursor-pointer">
                Hot Water
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalServices">Additional Services</Label>
            <Textarea
              id="additionalServices"
              name="additionalServices"
              placeholder="Laundry, airport shuttle, conference room, etc."
              value={formData.additionalServices}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Surveyor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Surveyor Info</CardTitle>
          <CardDescription>Your name for tracking purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="surveyorName">Surveyor Name</Label>
            <Input
              id="surveyorName"
              name="surveyorName"
              placeholder="Your name"
              value={formData.surveyorName}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            setFormData({
              guestHouseName: '',
              subCity: '',
              area: '',
              specificAddress: '',
              numberOfRooms: '',
              licenseType: '',
              licenseLevel: '',
              licenseNumber: '',
              contactPhone: '',
              contactName: '',
              ownerName: '',
              hasRestaurant: false,
              hasParking: false,
              hasWiFi: false,
              hasHotWater: false,
              additionalServices: '',
              surveyorName: '',
            });
            setSelectedSubCity('');
            setAreas([]);
            setRating(0);
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Survey'
          )}
        </Button>
      </div>
    </form>
  );
}
