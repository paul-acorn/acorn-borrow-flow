import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, AlertTriangle, Zap, TrendingUp } from 'lucide-react';

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  task_notifications: boolean;
  deal_status_updates: boolean;
  document_requests: boolean;
  campaign_messages: boolean;
  idle_deal_alerts: boolean;
  workflow_notifications: boolean;
  marketing_emails: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_enabled: true,
  sms_enabled: false,
  task_notifications: true,
  deal_status_updates: true,
  document_requests: true,
  campaign_messages: true,
  idle_deal_alerts: true,
  workflow_notifications: true,
  marketing_emails: false,
};

interface NotificationPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPreferencesModal = ({ open, onOpenChange }: NotificationPreferencesModalProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      loadPreferences();
    }
  }, [open, user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          await createDefaultPreferences();
        } else {
          throw error;
        }
      } else if (data) {
        setPreferences({
          email_enabled: data.email_enabled,
          sms_enabled: data.sms_enabled,
          task_notifications: data.task_notifications,
          deal_status_updates: data.deal_status_updates,
          document_requests: data.document_requests,
          campaign_messages: data.campaign_messages,
          idle_deal_alerts: data.idle_deal_alerts,
          workflow_notifications: data.workflow_notifications,
          marketing_emails: data.marketing_emails,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id });

      if (error) throw error;
      setPreferences(defaultPreferences);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences({ ...preferences, [key]: value });
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Loading preferences...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Control which notifications you want to receive
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Communication Channels */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communication Channels
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled" className="cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-enabled" className="cursor-pointer">
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via SMS (coming soon)
                </p>
              </div>
              <Switch
                id="sms-enabled"
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
                disabled
              />
            </div>
          </div>

          <Separator />

          {/* Deal & Task Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Deal & Task Notifications
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-notifications" className="cursor-pointer">
                  Task Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  New tasks and task updates
                </p>
              </div>
              <Switch
                id="task-notifications"
                checked={preferences.task_notifications}
                onCheckedChange={(checked) => updatePreference('task_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deal-status-updates" className="cursor-pointer">
                  Deal Status Updates
                </Label>
                <p className="text-xs text-muted-foreground">
                  When deal status changes
                </p>
              </div>
              <Switch
                id="deal-status-updates"
                checked={preferences.deal_status_updates}
                onCheckedChange={(checked) => updatePreference('deal_status_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="document-requests" className="cursor-pointer">
                  Document Requests
                </Label>
                <p className="text-xs text-muted-foreground">
                  New document requests and uploads
                </p>
              </div>
              <Switch
                id="document-requests"
                checked={preferences.document_requests}
                onCheckedChange={(checked) => updatePreference('document_requests', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="idle-deal-alerts" className="cursor-pointer flex items-center gap-1">
                  Idle Deal Alerts
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Alerts for deals with no activity
                </p>
              </div>
              <Switch
                id="idle-deal-alerts"
                checked={preferences.idle_deal_alerts}
                onCheckedChange={(checked) => updatePreference('idle_deal_alerts', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Automation & Marketing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automation & Marketing
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workflow-notifications" className="cursor-pointer">
                  Workflow Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automated workflow updates
                </p>
              </div>
              <Switch
                id="workflow-notifications"
                checked={preferences.workflow_notifications}
                onCheckedChange={(checked) => updatePreference('workflow_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="campaign-messages" className="cursor-pointer">
                  Campaign Messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  Updates from campaign sequences
                </p>
              </div>
              <Switch
                id="campaign-messages"
                checked={preferences.campaign_messages}
                onCheckedChange={(checked) => updatePreference('campaign_messages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails" className="cursor-pointer flex items-center gap-1">
                  Marketing Emails
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Product updates and offers
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={preferences.marketing_emails}
                onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export helper function for backwards compatibility
export const getNotificationPreferences = () => {
  return defaultPreferences;
};
