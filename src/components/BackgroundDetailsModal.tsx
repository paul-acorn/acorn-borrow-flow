import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, User, MapPin, CreditCard, FileCheck, Shield } from "lucide-react";

interface BackgroundDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: {
    personal: boolean;
    address: boolean;
    financial: boolean;
    credit: boolean;
    terms: boolean;
  };
  onStepComplete: (step: string) => void;
}

export function BackgroundDetailsModal({ open, onOpenChange, steps, onStepComplete }: BackgroundDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const { toast } = useToast();

  const handleStepComplete = (step: string) => {
    onStepComplete(step);
    toast({
      title: "Section Completed",
      description: "Your information has been saved successfully.",
    });
  };

  const stepConfig = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'financial', label: 'Financial', icon: CreditCard },
    { key: 'credit', label: 'Credit', icon: FileCheck },
    { key: 'terms', label: 'Terms', icon: Shield },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">Complete Your Profile</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 bg-secondary">
            {stepConfig.map((step) => {
              const IconComponent = step.icon;
              const isComplete = steps[step.key as keyof typeof steps];
              
              return (
                <TabsTrigger 
                  key={step.key}
                  value={step.key}
                  className="flex items-center space-x-2 data-[state=active]:bg-white"
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr</SelectItem>
                        <SelectItem value="mrs">Mrs</SelectItem>
                        <SelectItem value="ms">Ms</SelectItem>
                        <SelectItem value="miss">Miss</SelectItem>
                        <SelectItem value="dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niNumber">National Insurance Number</Label>
                    <Input placeholder="AB 12 34 56 C" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="IE">Ireland</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Identity Verification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 border-dashed">
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm">Upload ID Document</span>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-20 border-dashed">
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm">Upload Selfie</span>
                      </div>
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => handleStepComplete('personal')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Personal Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Address History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Current Address</h4>
                  <div className="space-y-3">
                    <Input placeholder="Property number/name" />
                    <Input placeholder="Street" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="City" />
                      <Input placeholder="Postcode" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date moved in</Label>
                      <Input type="date" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Proof of Address</h4>
                  <Button variant="outline" className="w-full h-20 border-dashed">
                    <div className="text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm">Upload Proof of Address</span>
                      <div className="text-xs text-muted-foreground">
                        Council tax, utility bill, bank statement (last 3 months)
                      </div>
                    </div>
                  </Button>
                </div>

                <Button 
                  onClick={() => handleStepComplete('address')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Address Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Employment Status</h4>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self Employed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Income Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Net Income</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Income</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Monthly Expenditure</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mortgage/Rent</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Commitments</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Living Expenses</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleStepComplete('financial')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Financial Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Tab */}
          <TabsContent value="credit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5" />
                  <span>Credit Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Have you missed any payments in the last 6 months?</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Do you have any CCJs, defaults, or bankruptcies?</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Additional Details (if applicable)</Label>
                    <Textarea 
                      placeholder="Please provide details of any adverse credit history..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => handleStepComplete('credit')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Save Credit Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Terms & Agreements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Terms of Business</h4>
                    <p className="text-sm text-muted-foreground">
                      By proceeding, you agree to our terms of business and acknowledge 
                      that we are FCA regulated and will handle your data in accordance 
                      with applicable regulations.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Privacy Statement</h4>
                    <p className="text-sm text-muted-foreground">
                      We are committed to protecting your privacy and will only use 
                      your personal information for the purposes of processing your 
                      finance application.
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => handleStepComplete('terms')}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Accept Terms & Complete Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}