import { useState } from "react";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileEditModal } from "./ProfileEditModal";
import { SettingsModal } from "./SettingsModal";
import { SecurityModal } from "./SecurityModal";
import { NotificationBell } from "./NotificationBell";

export const UserProfileMenu = () => {
  const { user, signOut, userRoles } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const getInitials = () => {
    // Try to get from user metadata first
    const firstName = user?.user_metadata?.first_name;
    const lastName = user?.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-background z-50" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.email}</p>
              <div className="flex gap-1 flex-wrap mt-2">
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSecurityModal(true)}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Security</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>

        <ProfileEditModal open={showProfileModal} onOpenChange={setShowProfileModal} />
        <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
        <SecurityModal open={showSecurityModal} onOpenChange={setShowSecurityModal} />
      </DropdownMenu>
    </>
  );
};
