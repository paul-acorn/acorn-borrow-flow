import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Home, Building, MapPin, PoundSterling } from "lucide-react";

interface PropertyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealName: string;
  onSave: (data: any) => void;
}

export function PropertyDetailsModal({ open, onOpenChange, dealName, onSave }: PropertyDetailsModalProps) {
  const [formData, setFormData] = useState({
    // Basic Info
    address: '',
    postcode: '',
    propertyType: '',
    buildingType: '',
    constructionYear: '',
    
    // Property Specifications
    bedrooms: '',
    receptionRooms: '',
    bathrooms: '',
    kitchens: '',
    parking: '',
    parkingSpaces: '',
    
    // Flat specific
    floorNumber: '',
    totalFloors: '',
    hasLift: '',
    commercialInBlock: '',
    commercialType: '',
    leaseLength: '',
    serviceCharge: '',
    
    // HMO/MUFB specific
    numberOfUnits: '',
    sharedAmenities: '',
    
    // Commercial specific
    commercialDescription: '',
    
    // Mixed use specific
    residentialPercentage: '',
    commercialPercentage: '',
    
    // Rental & Valuation
    currentValue: '',
    purchasePrice: '',
    monthlyRent: '',
    projectedRent: '',
    voidPeriods: '',
    
    // Additional details
    tenantInSitu: '',
    condition: '',
    refurbRequired: '',
    refurbCost: '',
    description: ''
  });
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Property Details Saved",
      description: "Your property details have been saved successfully.",
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderPropertySpecificFields = () => {
    switch (formData.buildingType) {
      case 'house':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="3"
                  value={formData.bedrooms}
                  onChange={(e) => handleFieldChange('bedrooms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receptionRooms">Reception Rooms</Label>
                <Input
                  id="receptionRooms"
                  type="number"
                  placeholder="2"
                  value={formData.receptionRooms}
                  onChange={(e) => handleFieldChange('receptionRooms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="2"
                  value={formData.bathrooms}
                  onChange={(e) => handleFieldChange('bathrooms', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kitchens">Kitchens</Label>
                <Input
                  id="kitchens"
                  type="number"
                  placeholder="1"
                  value={formData.kitchens}
                  onChange={(e) => handleFieldChange('kitchens', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking">Parking</Label>
                <Select
                  value={formData.parking}
                  onValueChange={(value) => handleFieldChange('parking', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="on-street">On-Street</SelectItem>
                    <SelectItem value="driveway">Driveway</SelectItem>
                    <SelectItem value="garage">Garage</SelectItem>
                    <SelectItem value="allocated">Allocated Space</SelectItem>
                    <SelectItem value="multiple">Multiple Spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(formData.parking === 'multiple' || formData.parking === 'driveway') && (
              <div className="space-y-2">
                <Label htmlFor="parkingSpaces">Number of Parking Spaces</Label>
                <Input
                  id="parkingSpaces"
                  type="number"
                  placeholder="2"
                  value={formData.parkingSpaces}
                  onChange={(e) => handleFieldChange('parkingSpaces', e.target.value)}
                />
              </div>
            )}
          </>
        );

      case 'flat':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="2"
                  value={formData.bedrooms}
                  onChange={(e) => handleFieldChange('bedrooms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="1"
                  value={formData.bathrooms}
                  onChange={(e) => handleFieldChange('bathrooms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receptionRooms">Reception Rooms</Label>
                <Input
                  id="receptionRooms"
                  type="number"
                  placeholder="1"
                  value={formData.receptionRooms}
                  onChange={(e) => handleFieldChange('receptionRooms', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floorNumber">Floor Number</Label>
                <Input
                  id="floorNumber"
                  type="number"
                  placeholder="3"
                  value={formData.floorNumber}
                  onChange={(e) => handleFieldChange('floorNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFloors">Total Floors in Block</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  placeholder="5"
                  value={formData.totalFloors}
                  onChange={(e) => handleFieldChange('totalFloors', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hasLift">Lift Access</Label>
                <Select
                  value={formData.hasLift}
                  onValueChange={(value) => handleFieldChange('hasLift', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lift available?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Commercial in Block?</Label>
              <RadioGroup
                value={formData.commercialInBlock}
                onValueChange={(value) => handleFieldChange('commercialInBlock', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="commercial-yes" />
                  <Label htmlFor="commercial-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="commercial-no" />
                  <Label htmlFor="commercial-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.commercialInBlock === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="commercialType">Type of Commercial</Label>
                <Select
                  value={formData.commercialType}
                  onValueChange={(value) => handleFieldChange('commercialType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select commercial type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="restaurant">Restaurant/Café</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaseLength">Lease Length (years)</Label>
                <Input
                  id="leaseLength"
                  type="number"
                  placeholder="125"
                  value={formData.leaseLength}
                  onChange={(e) => handleFieldChange('leaseLength', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCharge">Annual Service Charge (£)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  placeholder="2000"
                  value={formData.serviceCharge}
                  onChange={(e) => handleFieldChange('serviceCharge', e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case 'hmo':
      case 'mufb':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="numberOfUnits">Number of Units</Label>
              <Input
                id="numberOfUnits"
                type="number"
                placeholder="6"
                value={formData.numberOfUnits}
                onChange={(e) => handleFieldChange('numberOfUnits', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sharedAmenities">Shared Amenities Description</Label>
              <Textarea
                id="sharedAmenities"
                placeholder="Describe shared kitchens, bathrooms, lounge areas, etc."
                className="min-h-[100px]"
                value={formData.sharedAmenities}
                onChange={(e) => handleFieldChange('sharedAmenities', e.target.value)}
              />
            </div>
          </>
        );

      case 'commercial':
        return (
          <div className="space-y-2">
            <Label htmlFor="commercialDescription">Commercial Property Description</Label>
            <Textarea
              id="commercialDescription"
              placeholder="Describe the commercial property, tenants, lease terms, etc."
              className="min-h-[120px]"
              value={formData.commercialDescription}
              onChange={(e) => handleFieldChange('commercialDescription', e.target.value)}
            />
          </div>
        );

      case 'mixed-use':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="residentialPercentage">Residential % of Property</Label>
                <Input
                  id="residentialPercentage"
                  type="number"
                  placeholder="70"
                  max="100"
                  value={formData.residentialPercentage}
                  onChange={(e) => handleFieldChange('residentialPercentage', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commercialPercentage">Commercial % of Property</Label>
                <Input
                  id="commercialPercentage"
                  type="number"
                  placeholder="30"
                  max="100"
                  value={formData.commercialPercentage}
                  onChange={(e) => handleFieldChange('commercialPercentage', e.target.value)}
                />
              </div>
            </div>
            
            {formData.residentialPercentage && formData.commercialPercentage && 
             (parseInt(formData.residentialPercentage) + parseInt(formData.commercialPercentage)) !== 100 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  Note: Residential and Commercial percentages should add up to 100%
                </p>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-navy">
            Property Details - {dealName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid grid-cols-4 bg-secondary">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Property Details</TabsTrigger>
              <TabsTrigger value="rental">Rental Info</TabsTrigger>
              <TabsTrigger value="valuation">Valuation</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="w-5 h-5" />
                    <span>Property Type & Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Classification</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => setFormData({...formData, propertyType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="mixed">Mixed Use</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buildingType">Building Type</Label>
                      <Select
                        value={formData.buildingType}
                        onValueChange={(value) => setFormData({...formData, buildingType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select building type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="bungalow">Bungalow</SelectItem>
                          <SelectItem value="hmo">HMO</SelectItem>
                          <SelectItem value="mufb">MUFB</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.propertyType === 'mixed' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="residentialPercentage">Residential % Usage</Label>
                        <Input
                          id="residentialPercentage"
                          type="number"
                          placeholder="60"
                          max="100"
                          value={formData.residentialPercentage}
                          onChange={(e) => setFormData({...formData, residentialPercentage: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commercialPercentage">Commercial % Usage</Label>
                        <Input
                          id="commercialPercentage"
                          type="number"
                          placeholder="40"
                          max="100"
                          value={formData.commercialPercentage}
                          onChange={(e) => setFormData({...formData, commercialPercentage: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="planning">Planning Status</Label>
                    <Select
                      value={formData.planning}
                      onValueChange={(value) => setFormData({...formData, planning: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select planning status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="with-planning">With Planning Permission</SelectItem>
                        <SelectItem value="without-planning">Without Planning Permission</SelectItem>
                        <SelectItem value="pending">Planning Application Pending</SelectItem>
                        <SelectItem value="not-required">Planning Not Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Property Specifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        placeholder="3"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        placeholder="2"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kitchens">Number of Kitchens</Label>
                      <Input
                        id="kitchens"
                        type="number"
                        placeholder="1"
                        value={formData.kitchens}
                        onChange={(e) => setFormData({...formData, kitchens: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="units">Number of Units (if applicable)</Label>
                      <Input
                        id="units"
                        type="number"
                        placeholder="1"
                        value={formData.units}
                        onChange={(e) => setFormData({...formData, units: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parking">Parking Provision</Label>
                      <Select
                        value={formData.parking}
                        onValueChange={(value) => setFormData({...formData, parking: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parking" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Parking</SelectItem>
                          <SelectItem value="on-street">On-Street Parking</SelectItem>
                          <SelectItem value="garage">Garage</SelectItem>
                          <SelectItem value="driveway">Driveway</SelectItem>
                          <SelectItem value="multiple">Multiple Spaces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyAge">Property Age (years)</Label>
                      <Input
                        id="propertyAge"
                        type="number"
                        placeholder="25"
                        value={formData.propertyAge}
                        onChange={(e) => setFormData({...formData, propertyAge: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rental" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PoundSterling className="w-5 h-5" />
                    <span>Rental Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentlyLet">Property Status</Label>
                    <Select
                      value={formData.currentlyLet}
                      onValueChange={(value) => setFormData({...formData, currentlyLet: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="already-let">Already Let</SelectItem>
                        <SelectItem value="to-be-let">To Be Let</SelectItem>
                        <SelectItem value="owner-occupied">Owner Occupied</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.currentlyLet === 'already-let' || formData.currentlyLet === 'to-be-let') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passingRent">Passing Rent (£ per month)</Label>
                        <Input
                          id="passingRent"
                          type="number"
                          placeholder="1500"
                          value={formData.passingRent}
                          onChange={(e) => setFormData({...formData, passingRent: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marketRent">Market Rent (£ per month)</Label>
                        <Input
                          id="marketRent"
                          type="number"
                          placeholder="1600"
                          value={formData.marketRent}
                          onChange={(e) => setFormData({...formData, marketRent: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="valuation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Property Valuation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price (£)</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        placeholder="400000"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valuation">Current Valuation (£)</Label>
                      <Input
                        id="valuation"
                        type="number"
                        placeholder="450000"
                        value={formData.valuation}
                        onChange={(e) => setFormData({...formData, valuation: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gdv">Gross Development Value - GDV (£)</Label>
                    <Input
                      id="gdv"
                      type="number"
                      placeholder="500000"
                      value={formData.gdv}
                      onChange={(e) => setFormData({...formData, gdv: e.target.value})}
                    />
                    <div className="text-xs text-muted-foreground">
                      Only applicable for development/refurbishment projects
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any important notes about condition, environmental factors, etc."
                      className="min-h-[100px]"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              Save Property Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}