'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  UserCircle,
  Phone,
  FileText,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  locationData,
  getAreasForSubCity,
  LICENSE_TYPES,
  LICENSE_LEVELS,
} from '@/lib/location-data';

interface SurveyFormProps {
  onSubmit: () => void;
  surveyorName: string;
  surveyorId: string;
}

const STEPS = [
  { id: 1, title: 'Establishment', titleOr: 'Qophiin', icon: Building2 },
  { id: 2, title: 'License', titleOr: 'Laisansii', icon: FileText },
  { id: 3, title: 'Rating', titleOr: 'Qabxii', icon: Star },
  { id: 4, title: 'Contact', titleOr: 'Quunnamtii', icon: Phone },
  { id: 5, title: 'Confirm', titleOr: 'Mirkanaa\'uu', icon: ShieldCheck },
];

const RATING_LABELS = [
  { en: 'Poor', or: 'Qonnaa' },
  { en: 'Fair', or: 'Miira Gaarii' },
  { en: 'Good', or: 'Gaarii' },
  { en: 'Very Good', or: 'Gaarii Dhiphaachaa' },
  { en: 'Excellent', or: 'Baay\'ee Gaarii' },
];

export default function SurveyForm({ onSubmit, surveyorName, surveyorId }: SurveyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubCity, setSelectedSubCity] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [dataConfirmed, setDataConfirmed] = useState('');

  const emptyForm = {
    guestHouseName: '',
    organizationName: '',
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
  };

  const [formData, setFormData] = useState(emptyForm);

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.guestHouseName || !formData.organizationName || !formData.subCity || !formData.area || !formData.specificAddress) {
          toast({ title: 'Field Missing / Qabiyyee Hin Jiru', description: 'All fields in this step are required / Galii hundinuu barbaachisaadha', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        if (!formData.numberOfRooms || !formData.licenseType || !formData.licenseLevel || !formData.licenseNumber) {
          toast({ title: 'Field Missing / Qabiyyee Hin Jiru', description: 'All fields in this step are required / Galii hundinuu barbaachisaadha', variant: 'destructive' });
          return false;
        }
        return true;
      case 3:
        if (rating === 0) {
          toast({ title: 'Rating Required / Qabxii Barbaachisaa', description: 'Please rate the service / Tajaajila miira essitu', variant: 'destructive' });
          return false;
        }
        return true;
      case 4:
        if (!formData.ownerName || !formData.contactName || !formData.contactPhone) {
          toast({ title: 'Field Missing / Qabiyyee Hin Jiru', description: 'All fields in this step are required / Galii hundinuu barbaachisaadha', variant: 'destructive' });
          return false;
        }
        return true;
      case 5:
        if (dataConfirmed !== 'yes') {
          toast({ title: 'Confirmation Required / Mirkanaa\'uu Barbaachisaa', description: 'Please confirm data is true and authenticated / Daataan dhugaa fi mirkanaa\'eef mirkanaadhu', variant: 'destructive' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/guesthouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceRating: rating,
          surveyorName,
          surveyorId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit');
      }

      toast({
        title: 'Survey Submitted! / Galma Qabame!',
        description: `${formData.guestHouseName} recorded successfully / galmeen safiisan argame`,
      });

      setFormData(emptyForm);
      setSelectedSubCity('');
      setAreas([]);
      setRating(0);
      setDataConfirmed('');
      setCurrentStep(1);
      onSubmit();
    } catch (error) {
      toast({
        title: 'Submission Failed / Galmeen Hin Dhufne',
        description: error instanceof Error ? error.message : 'Please try again / Dabalataan yaali',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedSubCity('');
    setAreas([]);
    setRating(0);
    setDataConfirmed('');
    setCurrentStep(1);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all min-w-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : isCompleted
                        ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isCompleted ? 'bg-emerald-600 text-white' : ''
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] leading-tight font-medium text-center truncate w-full">
                    {step.title}
                  </span>
                  <span className="text-[9px] leading-tight text-center opacity-75 truncate w-full">
                    {step.titleOr}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 rounded ${
                    currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {currentStep} of {STEPS.length} / Qajeelfannaa {currentStep} kiyya {STEPS.length} keessaa</span>
          <button type="button" onClick={resetForm} className="flex items-center gap-1 text-red-500 hover:text-red-700">
            <RotateCcw className="h-3 w-3" />
            Reset / Balleessuu
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="min-h-[360px]">
          {currentStep === 1 && (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Establishment Information / Odeeffannoo Qophii
                </CardTitle>
                <CardDescription>Basic details about the establishment / Odeeffannoo asii qophii wajjiin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestHouseName">
                    Name / Maqaa <span className="text-red-500">*</span>
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

                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    Organization Name / Maqaa Dhaabbataa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="e.g., Bishoftu Tourism Corp."
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subCity">
                      Sub-City / Magaalaa Digdamii <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.subCity} onValueChange={handleSubCityChange}>
                      <SelectTrigger id="subCity">
                        <SelectValue placeholder="Select sub-city / Filadhu" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationData.subCities.map((sc) => (
                          <SelectItem key={sc.name} value={sc.name}>{sc.name}</SelectItem>
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
                          placeholder={selectedSubCity ? 'Select area / Filadhu' : 'Select sub-city first / Magaalaa digdamiin dura filadhu'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specificAddress">
                    Specific Address / Teessoo Qaamaa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="specificAddress"
                    name="specificAddress"
                    placeholder="Street name, landmark... / Magaalaa, bifaa addaa..."
                    value={formData.specificAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Capacity & License / Qubeettii fi Laisansii
                </CardTitle>
                <CardDescription>Room capacity and licensing / Qubeettii yoo laisansii qophii
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfRooms">
                    Number of Rooms / Lakkoofsa Qubeettii <span className="text-red-500">*</span>
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
                    <Label>
                      License Type / Gosa Laisansii <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.licenseType} onValueChange={(v) => handleSelectChange('licenseType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select type / Filadhu" /></SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      License Level / Saffisa Laisansii <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.licenseLevel} onValueChange={(v) => handleSelectChange('licenseLevel', v)}>
                      <SelectTrigger><SelectValue placeholder="Select level / Filadhu" /></SelectTrigger>
                      <SelectContent>
                        {LICENSE_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">
                    License Number / Lakkoofsa Laisansii <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    placeholder="e.g., GH-2024-001"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 3 && (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-amber-500" />
                  Service Rating / Qabxii Tajaajila
                </CardTitle>
                <CardDescription>Rate the overall service quality / Miira tajaajila waliigalaa essitu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="rounded-sm p-1 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`h-10 w-10 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-none text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-amber-600">
                    {rating > 0
                      ? `${RATING_LABELS[rating - 1].en} / ${RATING_LABELS[rating - 1].or}`
                      : 'Tap to rate / Cuunfaa miira essitu'}
                  </span>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 4 && (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-purple-600" />
                  Contact Information / Odeeffannoo Quunnamtii
                </CardTitle>
                <CardDescription>Owner and contact details / Odeeffannoo owneefii quunnamticha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">
                    Owner Name / Maqaa Owneefaa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    placeholder="Full name of owner / Maqaa owneefaa guutuu"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    Contact Person / Nama Quunnamu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    placeholder="Manager or reception contact / Bulchiisaa ykn qunnamsiisaa"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    Phone Number / Lakkoofsa Bilbila <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    placeholder="e.g., +251 91 234 5678"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 5 && (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Data Confirmation / Mirkanaa'uu Daataa
                </CardTitle>
                <CardDescription>Confirm the authenticity of the data / Dhugaa ta'umsa daataa mirkanaadhu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RadioGroup value={dataConfirmed} onValueChange={setDataConfirmed} className="space-y-3">
                  <div className="flex items-start space-x-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4 transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-100">
                    <RadioGroupItem value="yes" id="confirm-yes" className="mt-0.5" />
                    <Label htmlFor="confirm-yes" className="cursor-pointer leading-snug">
                      I confirm that the data provided is <span className="font-bold text-emerald-700">true and authenticated</span>
                      <br />
                      <span className="text-sm text-emerald-600">
                        Daataan kennaman dhugaa fi mirkanaa'e ta'a jechuun mirkanaa'a
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border-2 border-red-300 bg-red-50 p-4 transition-all has-[:checked]:border-red-500 has-[:checked]:bg-red-100">
                    <RadioGroupItem value="no" id="confirm-no" className="mt-0.5" />
                    <Label htmlFor="confirm-no" className="cursor-pointer leading-snug">
                      The data may not be verified
                      <br />
                      <span className="text-sm text-red-600">
                        Daataan mirkanaa'uu hin danda'ane
                      </span>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCircle className="h-4 w-4" />
                    Surveyor / Sakatta'aa
                  </div>
                  <p className="mt-1 font-medium">{surveyorName || 'Not logged in'}</p>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <div className="mt-4 flex gap-3">
          {currentStep > 1 && (
            <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back / Deebi'uu
            </Button>
          )}
          {currentStep < STEPS.length ? (
            <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={nextStep}>
              Next / Itti Fufuu <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting... / Galma Nagaan Qabaachu...</>)
                : 'Submit Survey / Galma Erguu'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
