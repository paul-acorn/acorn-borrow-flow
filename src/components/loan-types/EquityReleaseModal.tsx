import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, Phone } from "lucide-react";

interface EquityReleaseModalProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

const STEPS = [
  { id: 1, title: "Eligibility", description: "Basic requirements" },
  { id: 2, title: "Property Details", description: "About your home" },
  { id: 3, title: "Borrowing Need", description: "Amount required" },
  { id: 4, title: "Purpose & Preferences", description: "Your requirements" },
];

export function EquityReleaseModal({ formData, onFormDataChange }: EquityReleaseModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Support Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4" />
          <span>Need help? Call us on <strong>0800 XXX XXXX</strong></span>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-2">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex-1 p-3 rounded-lg text-center transition-colors ${
              step.id === currentStep
                ? "bg-primary text-primary-foreground"
                : step.id < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <div className="font-semibold text-sm">{step.title}</div>
            <div className="text-xs opacity-80">{step.description}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] py-6">
        {currentStep === 1 && <StepEligibility formData={formData} updateField={updateField} />}
        {currentStep === 2 && <StepProperty formData={formData} updateField={updateField} />}
        {currentStep === 3 && <StepBorrowing formData={formData} updateField={updateField} />}
        {currentStep === 4 && <StepPurpose formData={formData} updateField={updateField} />}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t">
        {currentStep > 1 && (
          <Button variant="outline" onClick={prevStep} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        {currentStep < STEPS.length && (
          <Button onClick={nextStep} className="ml-auto gap-2">
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepEligibility({ formData, updateField }: any) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Label className="text-lg">Who is applying for the Equity Release?</Label>
        <RadioGroup
          value={formData.applicantType || ""}
          onValueChange={(value) => updateField("applicantType", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="single" />
              <span className="font-medium text-base">Single Applicant</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="joint" />
              <span className="font-medium text-base">Joint Applicants</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-base">
          The youngest applicant must be 55 years or older. We'll verify this from your background information.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Label className="text-lg">Is this property your main residential home?</Label>
        <RadioGroup
          value={formData.mainResidence || ""}
          onValueChange={(value) => updateField("mainResidence", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="yes" />
              <span className="font-medium text-base">Yes</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="no" />
              <span className="font-medium text-base">No</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Is the property located in England, Wales, or Mainland Scotland?</Label>
        <RadioGroup
          value={formData.propertyLocation || ""}
          onValueChange={(value) => updateField("propertyLocation", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="yes" />
              <span className="font-medium text-base">Yes</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="no" />
              <span className="font-medium text-base">No</span>
            </label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

function StepProperty({ formData, updateField }: any) {
  const propertyValue = formData.propertyValue || [200000];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Label className="text-lg">What is your best estimate of the current property value?</Label>
        <div className="space-y-4">
          <Slider
            value={propertyValue}
            onValueChange={(value) => updateField("propertyValue", value)}
            min={70000}
            max={1000000}
            step={10000}
            className="w-full"
          />
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              £{propertyValue[0].toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Minimum property value: £70,000
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">What is the property tenure?</Label>
        <RadioGroup
          value={formData.propertyTenure || ""}
          onValueChange={(value) => updateField("propertyTenure", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="freehold" />
              <span className="font-medium text-base">Freehold</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="leasehold" />
              <div className="flex-1">
                <span className="font-medium text-base block">Leasehold</span>
                <span className="text-sm text-muted-foreground">Minimum lease term requirements apply</span>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Are there any other people aged 17 or over living in the property?</Label>
        <RadioGroup
          value={formData.otherOccupants || ""}
          onValueChange={(value) => updateField("otherOccupants", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="no" />
              <span className="font-medium text-base">No</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="yes" />
              <div className="flex-1">
                <span className="font-medium text-base block">Yes</span>
                <span className="text-sm text-muted-foreground">Occupancy waivers will be required</span>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

function StepBorrowing({ formData, updateField }: any) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Label htmlFor="amountNeeded" className="text-lg">
          How much money do you need to release?
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">£</span>
          <Input
            id="amountNeeded"
            type="number"
            min={10000}
            value={formData.amountNeeded || ""}
            onChange={(e) => updateField("amountNeeded", e.target.value)}
            className="pl-8 text-lg h-14"
            placeholder="e.g., 50000"
          />
        </div>
        <p className="text-sm text-muted-foreground">Minimum amount: £10,000</p>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Do you have an existing mortgage or loan secured against your property?</Label>
        <RadioGroup
          value={formData.hasExistingMortgage || ""}
          onValueChange={(value) => {
            updateField("hasExistingMortgage", value);
            if (value === "no") {
              updateField("existingMortgageAmount", "");
            }
          }}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="no" />
              <span className="font-medium text-base">No</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="yes" />
              <span className="font-medium text-base">Yes</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      {formData.hasExistingMortgage === "yes" && (
        <>
          <div className="space-y-4">
            <Label htmlFor="existingMortgageAmount" className="text-lg">
              What is the approximate outstanding amount?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">£</span>
              <Input
                id="existingMortgageAmount"
                type="number"
                value={formData.existingMortgageAmount || ""}
                onChange={(e) => updateField("existingMortgageAmount", e.target.value)}
                className="pl-8 text-lg h-14"
                placeholder="e.g., 30000"
              />
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-base">
              This debt must be repaid using the released funds.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}

function StepPurpose({ formData, updateField }: any) {
  const purposes = formData.purposes || [];
  const alternatives = formData.alternativesConsidered || [];

  const togglePurpose = (value: string) => {
    const updated = purposes.includes(value)
      ? purposes.filter((p: string) => p !== value)
      : [...purposes, value];
    updateField("purposes", updated);
  };

  const toggleAlternative = (value: string) => {
    const updated = alternatives.includes(value)
      ? alternatives.filter((a: string) => a !== value)
      : [...alternatives, value];
    updateField("alternativesConsidered", updated);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="text-base font-semibold">
          Equity release will reduce the value of your estate and may affect your entitlement to state benefits. 
          It is a long-term loan secured against your home. We strongly recommend you discuss this with your family.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Label className="text-lg">What is the main purpose of releasing equity? (Select all that apply)</Label>
        <div className="space-y-3">
          {[
            { value: "repay-mortgage", label: "Repay existing mortgage" },
            { value: "home-improvements", label: "Home improvements/repairs" },
            { value: "consolidate-debt", label: "Consolidate other debts" },
            { value: "gifts", label: "Fund gifts to family" },
            { value: "retirement-income", label: "Enhance retirement income" },
            { value: "other", label: "Other" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            >
              <Checkbox
                checked={purposes.includes(option.value)}
                onCheckedChange={() => togglePurpose(option.value)}
              />
              <span className="font-medium text-base">{option.label}</span>
            </label>
          ))}
        </div>
        {purposes.includes("consolidate-debt") && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please note: Consolidating debts with equity release may result in higher long-term costs.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Have you considered other potential options?</Label>
        <div className="space-y-3">
          {[
            { value: "downsizing", label: "Downsizing" },
            { value: "rio", label: "Retirement Interest-Only (RIO) Mortgage" },
            { value: "benefits", label: "State benefits check" },
            { value: "family", label: "Borrowing from family/friends" },
            { value: "savings", label: "Using other savings/assets" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            >
              <Checkbox
                checked={alternatives.includes(option.value)}
                onCheckedChange={() => toggleAlternative(option.value)}
              />
              <span className="font-medium text-base">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">What is your preference for interest repayment?</Label>
        <RadioGroup
          value={formData.interestPreference || ""}
          onValueChange={(value) => updateField("interestPreference", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="rollup" />
              <div className="flex-1">
                <span className="font-medium text-base block">No monthly payments (Interest roll-up)</span>
                <span className="text-sm text-muted-foreground">Interest is added to the loan</span>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="partial" />
              <span className="font-medium text-base">Make optional partial payments</span>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="full" />
              <span className="font-medium text-base">Pay all interest monthly</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Do you want the option to borrow more in the future (a Cash Reserve)?</Label>
        <RadioGroup
          value={formData.cashReserve || ""}
          onValueChange={(value) => updateField("cashReserve", value)}
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="yes" />
              <div className="flex-1">
                <span className="font-medium text-base block">Yes</span>
                <span className="text-sm text-muted-foreground">Drawdown facility for future borrowing</span>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <RadioGroupItem value="no" />
              <span className="font-medium text-base">No</span>
            </label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
