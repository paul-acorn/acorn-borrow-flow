import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Briefcase } from "lucide-react";
import { AdminDashboard } from "./AdminDashboard";
import { Dashboard } from "./Dashboard";
import { UserProfileMenu } from "./UserProfileMenu";

export const SuperAdminDashboard = () => {
  const [activeMainTab, setActiveMainTab] = useState("admin");

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Top-level header with navigation */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-premium" />
                <h1 className="text-xl font-semibold text-navy">
                  Super Admin
                </h1>
              </div>
              <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
                <TabsList>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Admin
                  </TabsTrigger>
                  <TabsTrigger value="deals" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Broker
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* Content based on active tab */}
      <div>
        {activeMainTab === "admin" ? (
          <div className="pt-0">
            <AdminDashboard hideHeader />
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
};