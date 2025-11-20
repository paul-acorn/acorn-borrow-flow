import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignSequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  trigger_conditions: any;
  created_at: string;
}

interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  channel: string;
  delay_days: number;
  subject: string | null;
  content: string;
}

export function CampaignSequences() {
  const [campaigns, setCampaigns] = useState<CampaignSequence[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignSequence | null>(null);
  const [steps, setSteps] = useState<CampaignStep[]>([]);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    trigger_type: "manual",
    trigger_conditions: {},
    is_active: true,
  });

  const [stepForm, setStepForm] = useState({
    step_order: 1,
    channel: "email",
    delay_days: 0,
    subject: "",
    content: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchSteps(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_sequences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSteps = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("step_order", { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("campaign_sequences").insert({
        ...campaignForm,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign created successfully",
      });

      setShowCampaignDialog(false);
      setCampaignForm({
        name: "",
        description: "",
        trigger_type: "manual",
        trigger_conditions: {},
        is_active: true,
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveStep = async () => {
    if (!selectedCampaign) return;

    try {
      const { error } = await supabase.from("campaign_steps").insert({
        ...stepForm,
        campaign_id: selectedCampaign.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Step added successfully",
      });

      setShowStepDialog(false);
      setStepForm({
        step_order: 1,
        channel: "email",
        delay_days: 0,
        subject: "",
        content: "",
      });
      fetchSteps(selectedCampaign.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleCampaignStatus = async (campaign: CampaignSequence) => {
    try {
      const { error } = await supabase
        .from("campaign_sequences")
        .update({ is_active: !campaign.is_active })
        .eq("id", campaign.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${campaign.is_active ? "paused" : "activated"}`,
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaign Sequences</h2>
        <Button onClick={() => setShowCampaignDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className={`cursor-pointer ${
                    selectedCampaign?.id === campaign.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <Badge variant={campaign.is_active ? "default" : "secondary"}>
                            {campaign.is_active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground">{campaign.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Trigger: {campaign.trigger_type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCampaignStatus(campaign);
                        }}
                      >
                        {campaign.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {campaigns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No campaigns yet. Create your first campaign to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Steps */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Campaign Steps</CardTitle>
              {selectedCampaign && (
                <Button size="sm" onClick={() => setShowStepDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedCampaign ? (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <Card key={step.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge>{step.channel}</Badge>
                            {step.delay_days > 0 && (
                              <span className="text-xs text-muted-foreground">
                                +{step.delay_days} days
                              </span>
                            )}
                          </div>
                          {step.subject && (
                            <p className="text-sm font-medium">{step.subject}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">{step.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {steps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No steps added yet. Click "Add Step" to create the first step.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a campaign to view its steps
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trigger_type">Trigger Type</Label>
              <Select
                value={campaignForm.trigger_type}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="deal_status_change">Deal Status Change</SelectItem>
                  <SelectItem value="time_based">Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={campaignForm.is_active}
                onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Step Dialog */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Campaign Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="step_order">Step Order</Label>
              <Input
                id="step_order"
                type="number"
                value={stepForm.step_order}
                onChange={(e) => setStepForm({ ...stepForm, step_order: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="channel">Channel</Label>
              <Select
                value={stepForm.channel}
                onValueChange={(value) => setStepForm({ ...stepForm, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="delay_days">Delay (days)</Label>
              <Input
                id="delay_days"
                type="number"
                value={stepForm.delay_days}
                onChange={(e) => setStepForm({ ...stepForm, delay_days: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={stepForm.subject}
                onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={stepForm.content}
                onChange={(e) => setStepForm({ ...stepForm, content: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStepDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStep}>Add Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
