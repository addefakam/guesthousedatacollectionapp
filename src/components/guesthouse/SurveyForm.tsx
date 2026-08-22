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
  Loader2,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  UserCircle,
  Phone,
  FileText,
  Eye,
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
  isOnline?: boolean;
  onOfflineSave?: (data: Record<string, unknown>) => Promise<boolean>;
}

const STEPS = [
  { id: 1, title: 'Establishment', titleOr: 'Qophiin', icon: Building2 },
  { id: 2, title: 'License', titleOr: 'Laisansii', icon: FileText },
  { id: 3, title: 'Contact', titleOr: 'Quunnamtii', icon: Phone },
  { id: 4, title: 'Review & Confirm', titleOr: 'Ilaali fi Mirkanaa', icon: Eye },
];

export default function SurveyForm({ onSubmit, surveyorName, surveyorId, isOnline = true, onOfflineSave }: SurveyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubCity, setSelectedSubCity] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
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
        if (!formData.organizationName || !formData.subCity || !formData.area || !formData.specificAddress) {
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
        if (!formData.ownerName || !formData.contactName || !formData.contactPhone) {
          toast({ title: 'Field Missing / Qabiyyee Hin Jiru', description: 'All fields in this step are required / Galii hundinuu barbaachisaadha', variant: 'destructive' });
          return false;
        }
        return true;
      case 4:
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

  const resetAfterSubmit = () => {
    setFormData(emptyForm);
    setSelectedSubCity('');
    setAreas([]);
    setDataConfirmed('');
    setCurrentStep(1);
  };

  const payload = {
    ...formData,
    serviceRating: 0,
    surveyorName,
    surveyorId,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    if (isOnline) {
      try {
        const response = await fetch('/api/guesthouses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to submit');
        }

        toast({
          title: 'Survey Submitted! / Galma Qabame!',
          description: `${formData.organizationName} recorded successfully / galmeen safiisan argame`,
        });

        resetAfterSubmit();
        onSubmit();
      } catch (error) {
        if (onOfflineSave) {
          const saved = await onOfflineSave(payload);
          if (saved) {
            toast({
              title: 'Saved Offline / Offliin Kuusame',
              description: 'Will sync when connected / Netiirkii qunnamaa waanin dhiheenya',
            });
            resetAfterSubmit();
            onSubmit();
          } else {
            toast({
              title: 'Submission Failed / Galmeen Hin Dhufne',
              description: error instanceof Error ? error.message : 'Please try again / Dabalataan yaali',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Submission Failed / Galmeen Hin Dhufne',
            description: error instanceof Error ? error.message : 'Please try again / Dabalataan yaali',
            variant: 'destructive',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (onOfflineSave) {
        const saved = await onOfflineSave(payload);
        if (saved) {
          toast({
            title: 'Saved Offline / Offliin Kuusame',
            description: 'Will sync when connected / Netiirkii qunnamaa waanin dhiheenya',
          });
          resetAfterSubmit();
          onSubmit();
        } else {
          toast({
            title: 'Save Failed / Hin Kuusanne',
            description: 'Storage full or unavailable / Qabiyyee dhiphaachaa ykn hin jiru',
            variant: 'destructive',
          });
        }
      }
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedSubCity('');
    setAreas([]);
    setDataConfirmed('');
    setCurrentStep(1);
  };

  const reviewItems = [
    { label: 'Organization / Dhaabbataa', value: formData.organizationName },
    { label: 'Sub-City / Kuttaa Maggalaa', value: formData.subCity },
    { label: 'Area / Kebele', value: formData.area },
    { label: 'Address / Teessoo', value: formData.specificAddress },
    { label: 'Rooms / Qubeettii', value: formData.numberOfRooms },
    { label: 'License Type / Goossa Eyyema', value: formData.licenseType },
    { label: 'License Level / Saddarkaa Eyeemaa', value: formData.licenseLevel },
    { label: 'License No. / Lakofsaa Eyyema', value: formData.licenseNumber },
    { label: 'Owner / Abbaa Qaabeyee', value: formData.ownerName },
    { label: 'Contact Person / Nama Adadura Qunnamnu', value: formData.contactName },
    { label: 'Phone / Bilbila', value: formData.contactPhone },
  ];

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
                  }`}>
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
                  Establishment Information
                  <br />
                  <span className="text-base font-normal text-muted-foreground">Odeeffannoo Qophii</span>
                </CardTitle>
                <CardDescription>Basic details about the establishment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    Organization Name
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Maqaa Dhaabbataa</span> <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="e.g., GOLD MARK HOTEL"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subCity">
                      Sub-City
                      <br />
                      <span className="text-sm font-normal text-muted-foreground">Kuttaa Maggalaa</span> <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.subCity} onValueChange={handleSubCityChange}>
                      <SelectTrigger id="subCity">
                        <SelectValue placeholder="Select / Filadhu" />
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
                      Area / Kebele
                      <br />
                      <span className="text-sm font-normal text-muted-foreground">Ganda</span> <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.area}
                      onValueChange={(v) => handleSelectChange('area', v)}
                      disabled={!selectedSubCity}
                    >
                      <SelectTrigger id="area">
                        <SelectValue
                          placeholder={selectedSubCity ? 'Select / Filadhu' : 'Select sub-city first'}
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
                    Specific Address
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Teessoo Qaamaa</span> <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="specificAddress"
                    name="specificAddress"
                    placeholder="Street name, landmark..."
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
                  Capacity & License
                  <br />
                  <span className="text-base font-normal text-muted-foreground">Bayyinnafee fi Eyyemma</span>
                </CardTitle>
                <CardDescription>Room capacity and licensing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfRooms">
                    Number of Rooms
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Lakkoofsa Qubeettii</span> <span className="text-red-500">*</span>
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
                      License Type
                      <br />
                      <span className="text-sm font-normal text-muted-foreground">Goossa Eyyema</span> <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.licenseType} onValueChange={(v) => handleSelectChange('licenseType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select / Filadhu" /></SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      License Level
                      <br />
                      <span className="text-sm font-normal text-muted-foreground">Saddarkaa Eyeemaa</span> <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.licenseLevel} onValueChange={(v) => handleSelectChange('licenseLevel', v)}>
                      <SelectTrigger><SelectValue placeholder="Select / Filadhu" /></SelectTrigger>
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
                    License Number
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Lakofsaa Eyyema</span> <span className="text-red-500">*</span>
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
                  <Phone className="h-5 w-5 text-purple-600" />
                  Contact Information
                  <br />
                  <span className="text-base font-normal text-muted-foreground">Odeeffannoo Quunnamtii</span>
                </CardTitle>
                <CardDescription>Owner and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">
                    Owner Name
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Maqaa Abbaa Qaabeyee</span> <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    placeholder="Full name of owner"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    Contact Person
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Nama Adadura Qunnamnu</span> <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    placeholder="Manager or reception contact"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    Phone Number
                    <br />
                    <span className="text-sm font-normal text-muted-foreground">Lakkoofsa Bilbila</span> <span className="text-red-500">*</span>
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

          {currentStep === 4 && (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Review & Confirm
                  <br />
                  <span className="text-base font-normal text-muted-foreground">Ilaali fi Mirkanaa</span>
                </CardTitle>
                <CardDescription>Review all data before submitting / Galii hunda ilaalii booda erguu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 divide-y">
                  {reviewItems.map((item) => (
                    <div key={item.label} className="flex justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="text-muted-foreground whitespace-nowrap">{item.label}</span>
                      <span className="font-medium text-right">{item.value || '-'}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCircle className="h-4 w-4" />
                    <span>Surveyor</span>
                    <span className="text-xs opacity-70">/ Sakatta'aa</span>
                  </div>
                  <p className="mt-1 font-medium">{surveyorName || 'Not logged in'}</p>
                </div>

                <div className="pt-2">
                  <RadioGroup value={dataConfirmed} onValueChange={setDataConfirmed}>
                    <div className="flex items-start space-x-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 transition-all has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-100 has-[:checked]:shadow-md">
                      <RadioGroupItem value="yes" id="confirm-yes" className="mt-1" />
                      <Label htmlFor="confirm-yes" className="cursor-pointer leading-relaxed">
                        <span className="font-bold text-emerald-800">I confirm that the data provided is true and authenticated</span>
                        <br />
                        <span className="text-sm font-semibold text-emerald-700">Daataan keneenaa dhagafee merkanawa ta'uu Issaa raaggaa Nibaanaa</span>
                      </Label>
                    </div>
                  </RadioGroup>
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
