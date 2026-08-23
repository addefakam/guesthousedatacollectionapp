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
  { id: 4, title: 'Review', titleOr: 'Mirkanaa', icon: Eye },
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
    setAreas(getAreasForSubCity(value));
    setFormData((prev) => ({ ...prev, subCity: value, area: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        const phoneClean = formData.contactPhone.replace(/[\s-]/g, '');
        const ethPhoneRegex = /^(\+251|251|0)?(9|7)\d{8}$/;
        if (!ethPhoneRegex.test(phoneClean)) {
          toast({ title: 'Invalid Phone / Bilbila Dogoggora', description: 'Enter valid Ethiopian number (e.g., +251 91 234 5678)', variant: 'destructive' });
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

  const nextStep = () => { if (validateStep(currentStep)) setCurrentStep((s) => Math.min(s + 1, STEPS.length)); };
  const prevStep = () => { setCurrentStep((s) => Math.max(s - 1, 1)); };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedSubCity('');
    setAreas([]);
    setDataConfirmed('');
    setCurrentStep(1);
  };

  const payload = { ...formData, serviceRating: 0, surveyorName, surveyorId };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    if (isOnline) {
      try {
        const response = await fetch('/api/guesthouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to submit'); }
        toast({ title: 'Survey Submitted! / Galma Qabame!', description: `${formData.organizationName} recorded successfully / galmeen safiisan argame` });
        resetForm();
        onSubmit();
      } catch (error) {
        if (onOfflineSave) {
          const saved = await onOfflineSave(payload);
          if (saved) { toast({ title: 'Saved Offline / Offliin Kuusame', description: 'Will sync when connected / Netiirkii qunnamaa waanin dhiheenya' }); resetForm(); onSubmit(); }
          else { toast({ title: 'Submission Failed / Galmeen Hin Dhufne', description: error instanceof Error ? error.message : 'Please try again / Dabalataan yaali', variant: 'destructive' }); }
        } else { toast({ title: 'Submission Failed / Galmeen Hin Dhufne', description: error instanceof Error ? error.message : 'Please try again / Dabalataan yaali', variant: 'destructive' }); }
      } finally { setIsSubmitting(false); }
    } else {
      if (onOfflineSave) {
        const saved = await onOfflineSave(payload);
        if (saved) { toast({ title: 'Saved Offline / Offliin Kuusame', description: 'Will sync when connected / Netiirkii qunnamaa waanin dhiheenya' }); resetForm(); onSubmit(); }
        else { toast({ title: 'Save Failed / Hin Kuusanne', description: 'Storage full or unavailable / Qabiyyee dhiphaachaa ykn hin jiru', variant: 'destructive' }); }
      }
      setIsSubmitting(false);
    }
  };

  const reviewItems = [
    { label: 'Organization / Dhaabbataa', value: formData.organizationName },
    { label: 'Sub-City / Kuttaa Maggalaa', value: formData.subCity },
    { label: 'Werreda', value: formData.area },
    { label: 'Address / Baka Addaa', value: formData.specificAddress },
    { label: 'Rooms / Qubeettii', value: formData.numberOfRooms },
    { label: 'License Type / Goossa Eyyema', value: formData.licenseType },
    { label: 'License Level / Saddarkaa Eyyema', value: formData.licenseLevel },
    { label: 'License No. / Lakofsaa Eyyema', value: formData.licenseNumber },
    { label: 'Owner / Abbaa Qaabeyee', value: formData.ownerName },
    { label: 'Contact / Nama Adadura Qunnamnu', value: formData.contactName },
    { label: 'Phone / Bilbila', value: formData.contactPhone },
  ];

  return (
    <div>
      {/* Step Indicator */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:gap-0 sm:pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-1 shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  className={`flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-all sm:gap-1 sm:rounded-xl sm:px-2 sm:py-2 ${
                    isActive ? 'bg-emerald-600 text-white shadow-md sm:shadow-lg sm:shadow-emerald-200'
                      : isCompleted ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 ${isCompleted ? 'bg-emerald-600 text-white' : ''}`}>
                    {isCompleted ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </div>
                  <span className="text-[9px] leading-tight font-medium text-center truncate w-full sm:text-[10px]">{step.title}</span>
                  <span className="hidden text-[8px] leading-tight text-center opacity-75 truncate w-full sm:block sm:text-[9px]">{step.titleOr}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`mx-0.5 h-0.5 flex-1 rounded sm:mx-1 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground sm:mt-2 sm:text-xs">
          <span>Step {currentStep} of {STEPS.length} / Qajeelfannaa {currentStep} kiyya {STEPS.length} keessaa</span>
          <button type="button" onClick={resetForm} className="flex items-center gap-1 text-red-500 hover:text-red-700">
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset / Balleessuu</span><span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="min-h-[300px] sm:min-h-[360px]">
          {/* Step 1: Establishment */}
          {currentStep === 1 && (
            <>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-1.5 text-base sm:gap-2 sm:text-lg">
                  <Building2 className="h-4 w-4 shrink-0 text-emerald-600 sm:h-5 sm:w-5" />
                  <span className="leading-tight">Establishment Information<br /><span className="text-sm font-normal text-muted-foreground sm:text-base">Odeeffannoo Qophii</span></span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Basic details about the establishment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="organizationName" className="text-xs sm:text-sm">Organization Name<br /><span className="text-xs font-normal text-muted-foreground">Maqaa Dhaabbataa</span> <span className="text-red-500">*</span></Label>
                  <Input id="organizationName" name="organizationName" placeholder="e.g., GOLD MARK HOTEL" value={formData.organizationName} onChange={handleChange} required className="text-sm sm:text-base" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="subCity" className="text-xs sm:text-sm">Sub-City<br /><span className="text-xs font-normal text-muted-foreground">Kuttaa Maggalaa</span> <span className="text-red-500">*</span></Label>
                    <Select value={formData.subCity} onValueChange={handleSubCityChange}>
                      <SelectTrigger id="subCity" className="text-sm sm:text-base"><SelectValue placeholder="Select / Filadhu" /></SelectTrigger>
                      <SelectContent>{locationData.subCities.map((sc) => (<SelectItem key={sc.name} value={sc.name}>{sc.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="area" className="text-xs sm:text-sm">Werreda <span className="text-red-500">*</span></Label>
                    <Select value={formData.area} onValueChange={(v) => handleSelectChange('area', v)} disabled={!selectedSubCity}>
                      <SelectTrigger id="area" className="text-sm sm:text-base"><SelectValue placeholder={selectedSubCity ? 'Select / Filadhu' : 'Select sub-city first'} /></SelectTrigger>
                      <SelectContent>{areas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="specificAddress" className="text-xs sm:text-sm">Specific Address<br /><span className="text-xs font-normal text-muted-foreground">Baka Addaa</span> <span className="text-red-500">*</span></Label>
                  <Input id="specificAddress" name="specificAddress" placeholder="Street name, landmark..." value={formData.specificAddress} onChange={handleChange} required className="text-sm sm:text-base" />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: License */}
          {currentStep === 2 && (
            <>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-1.5 text-base sm:gap-2 sm:text-lg">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                  <span className="leading-tight">Capacity & License<br /><span className="text-sm font-normal text-muted-foreground sm:text-base">Bayyinnafee fi Eyyemma</span></span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Room capacity and licensing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="numberOfRooms" className="text-xs sm:text-sm">Number of Rooms<br /><span className="text-xs font-normal text-muted-foreground">Lakkoofsa Qubeettii</span> <span className="text-red-500">*</span></Label>
                  <Input id="numberOfRooms" name="numberOfRooms" type="number" min="1" placeholder="e.g., 20" value={formData.numberOfRooms} onChange={handleChange} required className="text-sm sm:text-base" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">License Type<br /><span className="text-xs font-normal text-muted-foreground">Goossa Eyyema</span> <span className="text-red-500">*</span></Label>
                    <Select value={formData.licenseType} onValueChange={(v) => handleSelectChange('licenseType', v)}>
                      <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select / Filadhu" /></SelectTrigger>
                      <SelectContent>{LICENSE_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">License Level<br /><span className="text-xs font-normal text-muted-foreground">Saddarkaa Eyyema</span> <span className="text-red-500">*</span></Label>
                    <Select value={formData.licenseLevel} onValueChange={(v) => handleSelectChange('licenseLevel', v)}>
                      <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select / Filadhu" /></SelectTrigger>
                      <SelectContent>{LICENSE_LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="licenseNumber" className="text-xs sm:text-sm">License Number<br /><span className="text-xs font-normal text-muted-foreground">Lakofsaa Eyyema</span> <span className="text-red-500">*</span></Label>
                  <Input id="licenseNumber" name="licenseNumber" placeholder="e.g., GH-2024-001" value={formData.licenseNumber} onChange={handleChange} required className="text-sm sm:text-base" />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Contact */}
          {currentStep === 3 && (
            <>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-1.5 text-base sm:gap-2 sm:text-lg">
                  <Phone className="h-4 w-4 shrink-0 text-purple-600 sm:h-5 sm:w-5" />
                  <span className="leading-tight">Contact Information<br /><span className="text-sm font-normal text-muted-foreground sm:text-base">Odeeffannoo Quunnamtii</span></span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Owner and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="ownerName" className="text-xs sm:text-sm">Owner Name<br /><span className="text-xs font-normal text-muted-foreground">Maqaa Abbaa Qaabeyee</span> <span className="text-red-500">*</span></Label>
                  <Input id="ownerName" name="ownerName" placeholder="Full name of owner" value={formData.ownerName} onChange={handleChange} required className="text-sm sm:text-base" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="contactName" className="text-xs sm:text-sm">Contact Person<br /><span className="text-xs font-normal text-muted-foreground">Nama Adadura Qunnamnu</span> <span className="text-red-500">*</span></Label>
                  <Input id="contactName" name="contactName" placeholder="Manager or reception contact" value={formData.contactName} onChange={handleChange} required className="text-sm sm:text-base" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="contactPhone" className="text-xs sm:text-sm">Phone Number<br /><span className="text-xs font-normal text-muted-foreground">Lakkoofsa Bilbila</span> <span className="text-red-500">*</span></Label>
                  <Input id="contactPhone" name="contactPhone" type="tel" placeholder="e.g., +251 91 234 5678" value={formData.contactPhone} onChange={(e) => { const val = e.target.value.replace(/[^0-9+\s-]/g, ''); setFormData(prev => ({ ...prev, contactPhone: val })); }} required className="text-sm sm:text-base" />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-1.5 text-base sm:gap-2 sm:text-lg">
                  <Eye className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                  <span className="leading-tight">Review & Confirm<br /><span className="text-sm font-normal text-muted-foreground sm:text-base">Ilaali fi Mirkanaa</span></span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Review all data before submitting / Galii hunda ilaalii booda erguu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="rounded-lg border bg-muted/30 divide-y">
                  {reviewItems.map((item) => (
                    <div key={item.label} className="flex justify-between gap-2 px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm">
                      <span className="text-muted-foreground whitespace-nowrap">{item.label}</span>
                      <span className="font-medium text-right">{item.value || '-'}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                    <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Surveyor</span><span className="opacity-70">/ Sakatta'aa</span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium sm:mt-1">{surveyorName || 'Not logged in'}</p>
                </div>
                <div className="pt-1 sm:pt-2">
                  <RadioGroup value={dataConfirmed} onValueChange={setDataConfirmed}>
                    <div className="flex items-start space-x-2.5 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 transition-all has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-100 has-[:checked]:shadow-md sm:space-x-3 sm:p-4">
                      <RadioGroupItem value="yes" id="confirm-yes" className="mt-0.5 sm:mt-1" />
                      <Label htmlFor="confirm-yes" className="cursor-pointer leading-relaxed">
                        <span className="text-xs font-bold text-emerald-800 sm:text-sm">I confirm that the data provided is true and authenticated</span>
                        <br />
                        <span className="text-[11px] font-semibold text-emerald-700 sm:text-sm">Daataan keneenaa dhagafee merkanawa ta'uu Issaa raaggaa Nibaanaa</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
          {currentStep > 1 && (
            <Button type="button" variant="outline" className="h-10 flex-1 text-xs sm:h-auto sm:text-sm" onClick={prevStep}>
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Back / Deebi'uu</span><span className="sm:hidden">Back</span>
            </Button>
          )}
          {currentStep < STEPS.length ? (
            <Button type="button" className="h-10 flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs sm:h-auto sm:text-sm" onClick={nextStep}>
              <span className="hidden sm:inline">Next / Itti Fufuu </span><span className="sm:hidden">Next </span><ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          ) : (
            <Button type="submit" className="h-10 flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs sm:h-auto sm:text-sm" disabled={isSubmitting}>
              {isSubmitting
                ? (<><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin sm:mr-2 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Submitting... / Galma Nagaan Qabaachu...</span><span className="sm:hidden">Submitting...</span></>)
                : 'Submit Survey / Galma Erguu'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
