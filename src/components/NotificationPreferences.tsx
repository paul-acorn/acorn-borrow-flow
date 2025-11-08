import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export interface NotificationPreferences {
  statusChanges: boolean;
  newMessages: boolean;
  newRequirements: boolean;
  documentUploads: boolean;
  enableSounds: boolean;
  enableBadges: boolean;
  enableEmail: boolean;
  enablePush: boolean;
}

const defaultPreferences: NotificationPreferences = {
  statusChanges: true,
  newMessages: true,
  newRequirements: true,
  documentUploads: true,
  enableSounds: true,
  enableBadges: true,
  enableEmail: false,
  enablePush: false,
};

interface NotificationPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPreferencesModal = ({ open, onOpenChange }: NotificationPreferencesModalProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  }, []);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('notificationPreferences', JSON.stringify(updated));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Types</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="status-changes" className="flex-1 cursor-pointer">
                Deal Status Changes
              </Label>
              <Switch
                id="status-changes"
                checked={preferences.statusChanges}
                onCheckedChange={(checked) => updatePreference('statusChanges', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="new-messages" className="flex-1 cursor-pointer">
                New Messages
              </Label>
              <Switch
                id="new-messages"
                checked={preferences.newMessages}
                onCheckedChange={(checked) => updatePreference('newMessages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="new-requirements" className="flex-1 cursor-pointer">
                New Requirements
              </Label>
              <Switch
                id="new-requirements"
                checked={preferences.newRequirements}
                onCheckedChange={(checked) => updatePreference('newRequirements', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="document-uploads" className="flex-1 cursor-pointer">
                Document Uploads
              </Label>
              <Switch
                id="document-uploads"
                checked={preferences.documentUploads}
                onCheckedChange={(checked) => updatePreference('documentUploads', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Settings</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sounds" className="flex-1 cursor-pointer">
                Notification Sounds
              </Label>
              <Switch
                id="sounds"
                checked={preferences.enableSounds}
                onCheckedChange={(checked) => updatePreference('enableSounds', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="badges" className="flex-1 cursor-pointer">
                Badge Indicators
              </Label>
              <Switch
                id="badges"
                checked={preferences.enableBadges}
                onCheckedChange={(checked) => updatePreference('enableBadges', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="flex-1 cursor-pointer">
                Email Notifications
              </Label>
              <Switch
                id="email"
                checked={preferences.enableEmail}
                onCheckedChange={(checked) => updatePreference('enableEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="push" className="flex-1 cursor-pointer">
                Push Notifications
              </Label>
              <Switch
                id="push"
                checked={preferences.enablePush}
                onCheckedChange={(checked) => updatePreference('enablePush', checked)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const getNotificationPreferences = (): NotificationPreferences => {
  const stored = localStorage.getItem('notificationPreferences');
  return stored ? JSON.parse(stored) : defaultPreferences;
};
