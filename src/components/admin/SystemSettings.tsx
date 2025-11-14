import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, ExternalLink, FolderPlus, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClientProfile {
  id: string;
  deal_code: string;
  first_name: string;
  last_name: string;
  google_drive_folder_id: string | null;
}

export function SystemSettings() {
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [creatingFolders, setCreatingFolders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchClients();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("system_settings" as any)
      .select("*")
      .eq("setting_key", "google_drive_root_folder_id")
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Failed to load settings:", error);
    } else if (data) {
      setGoogleDriveFolderId((data as any).setting_value || "");
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, deal_code, first_name, last_name, google_drive_folder_id")
      .not("deal_code", "is", null)
      .order("deal_code");

    if (error) {
      console.error("Failed to load clients:", error);
    } else {
      setClients((data || []) as ClientProfile[]);
    }
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

  const createClientFolder = async (client: ClientProfile) => {
    if (!googleDriveFolderId) {
      toast({
        title: "Error",
        description: "Please set the root folder ID first",
        variant: "destructive",
      });
      return;
    }

    setCreatingFolders(prev => new Set(prev).add(client.id));

    try {
      const { data, error } = await supabase.functions.invoke("google-drive", {
        body: {
          action: "createFolder",
          folderName: client.deal_code,
          parentFolderId: googleDriveFolderId,
        },
      });

      if (error) throw error;

      const folderId = data.folderId;

      // Update profile with folder ID
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ google_drive_folder_id: folderId } as any)
        .eq("id", client.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Folder created for ${client.deal_code}`,
      });

      // Refresh clients list
      await fetchClients();
    } catch (error: any) {
      console.error("Failed to create folder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    } finally {
      setCreatingFolders(prev => {
        const next = new Set(prev);
        next.delete(client.id);
        return next;
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading settings...</div>;
  }

  return (
    <>
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
            <li>Set the root folder ID above</li>
            <li>Create individual folders for each client using their deal code below</li>
            <li>When clients upload requirement documents, they go directly to their Google Drive folder</li>
            <li>Brokers and admins can access all client folders for file management</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Client Folders</CardTitle>
        <CardDescription>
          Create and manage Google Drive folders for each client
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients with deal codes found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Code</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Folder Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono">{client.deal_code}</TableCell>
                  <TableCell>
                    {client.first_name} {client.last_name}
                  </TableCell>
                  <TableCell>
                    {client.google_drive_folder_id ? (
                      <span className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Folder Created
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No Folder</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!client.google_drive_folder_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createClientFolder(client)}
                        disabled={creatingFolders.has(client.id) || !googleDriveFolderId}
                        className="gap-2"
                      >
                        <FolderPlus className="w-4 h-4" />
                        {creatingFolders.has(client.id) ? "Creating..." : "Create Folder"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </>
  );
}
