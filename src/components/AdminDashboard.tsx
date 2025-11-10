import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserManagement } from "./admin/UserManagement";
import { AllDealsView } from "./admin/AllDealsView";
import { CustomerDropdown } from "@/components/CustomerDropdown";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function AdminDashboard() {
  const { signOut, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const isSuperAdmin = hasRole('super_admin');

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4 flex-wrap">
            <h1 className="text-xl font-semibold text-navy">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <CustomerDropdown />
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              All Deals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <AllDealsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
