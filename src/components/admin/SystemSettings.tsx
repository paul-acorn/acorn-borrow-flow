import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, ExternalLink } from "lucide-react";

export function SystemSettings() {
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("system_settings" as any)
      .select("*")
      .eq("setting_key", "google_drive_root_folder_id")
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Failed to load settings:", error);
    } else if (data) {
      setGoogleDriveFolderId((data as any).setting_value || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("system_settings" as any)
      .update({ setting_value: googleDriveFolderId.trim() })
      .eq("setting_key", "google_drive_root_folder_id");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-4">Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>
          Configure system-wide settings for document management and integrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-drive-folder">Google Drive Root Folder ID</Label>
            <div className="flex gap-2">
              <Input
                id="google-drive-folder"
                value={googleDriveFolderId}
                onChange={(e) => setGoogleDriveFolderId(e.target.value)}
                placeholder="Enter Google Drive folder ID"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                asChild
              >
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This is the root folder where all client folders will be created. 
              To get the folder ID, open the folder in Google Drive and copy the ID from the URL 
              (the part after /folders/)
            </p>
            <div className="text-xs text-muted-foreground space-y-1 mt-2 p-3 bg-muted rounded">
              <p className="font-medium">Example:</p>
              <p className="font-mono break-all">
                https://drive.google.com/drive/folders/<span className="text-primary font-bold">1AbC2DeF3GhI4JkL5MnO6PqR</span>
              </p>
              <p>The folder ID is: <span className="font-mono text-primary">1AbC2DeF3GhI4JkL5MnO6PqR</span></p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Each client will automatically get their own folder created in the root folder</li>
            <li>Client folders are named using their deal code (e.g., "FL250001")</li>
            <li>When clients upload requirement documents, they go directly to their Google Drive folder</li>
            <li>Brokers and admins can access all client folders for file management</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
