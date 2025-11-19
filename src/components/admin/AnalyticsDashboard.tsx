import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { CalendarIcon, TrendingUp, DollarSign, CheckCircle, Users, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type TimeRange = "today" | "week" | "month" | "quarter" | "year" | "custom";

const COLORS = ['hsl(var(--premium))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfMonth(new Date()));

  // Update date range based on preset
  const updateDateRange = (range: TimeRange) => {
    const now = new Date();
    setTimeRange(range);
    
    switch (range) {
      case "today":
        setDateFrom(now);
        setDateTo(now);
        break;
      case "week":
        setDateFrom(subDays(now, 7));
        setDateTo(now);
        break;
      case "month":
        setDateFrom(startOfMonth(now));
        setDateTo(endOfMonth(now));
        break;
      case "quarter":
        setDateFrom(startOfQuarter(now));
        setDateTo(endOfQuarter(now));
        break;
      case "year":
        setDateFrom(startOfYear(now));
        setDateTo(endOfYear(now));
        break;
    }
  };

  // Fetch deals data
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["analytics-deals", dateFrom, dateTo, selectedBroker],
    queryFn: async () => {
      let query = supabase
        .from("deals")
        .select(`
          *,
          client:profiles!deals_user_id_fkey(id, first_name, last_name, assigned_broker)
        `);

      if (dateFrom) query = query.gte("created_at", dateFrom.toISOString());
      if (dateTo) query = query.lte("created_at", dateTo.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      // Filter by broker if selected
      if (selectedBroker !== "all") {
        return data?.filter((deal: any) => deal.client?.assigned_broker === selectedBroker) || [];
      }

      return data || [];
    },
  });

  // Fetch brokers list
  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", (
          await supabase.from("user_roles").select("user_id").eq("role", "broker")
        ).data?.map(r => r.user_id) || []);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalDeals = deals.length;
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const approvedDeals = deals.filter(d => d.status === "approved").length;
    const conversionRate = totalDeals > 0 ? (approvedDeals / totalDeals) * 100 : 0;

    // Deal status breakdown
    const statusBreakdown = [
      { name: "Draft", value: deals.filter(d => d.status === "draft").length },
      { name: "In Progress", value: deals.filter(d => d.status === "in_progress").length },
      { name: "Submitted", value: deals.filter(d => d.status === "submitted").length },
      { name: "Approved", value: deals.filter(d => d.status === "approved").length },
      { name: "Declined", value: deals.filter(d => d.status === "declined").length },
    ];

    // Revenue by deal type
    const revenueByType = deals.reduce((acc, deal) => {
      const type = deal.type || "unknown";
      acc[type] = (acc[type] || 0) + (deal.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const typeData = Object.entries(revenueByType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Broker performance
    const brokerPerformance = deals.reduce((acc, deal: any) => {
      const brokerId = deal.client?.assigned_broker;
      if (!brokerId) return acc;
      
      const broker = brokers.find(b => b.id === brokerId);
      const brokerName = broker ? `${broker.first_name} ${broker.last_name}` : "Unknown";
      
      if (!acc[brokerName]) {
        acc[brokerName] = { name: brokerName, deals: 0, revenue: 0, approved: 0 };
      }
      
      acc[brokerName].deals += 1;
      acc[brokerName].revenue += deal.amount || 0;
      if (deal.status === "approved") acc[brokerName].approved += 1;
      
      return acc;
    }, {} as Record<string, { name: string; deals: number; revenue: number; approved: number }>);

    const brokerData = Object.values(brokerPerformance);

    return {
      totalDeals,
      totalRevenue,
      approvedDeals,
      conversionRate,
      statusBreakdown,
      typeData,
      brokerData,
    };
  }, [deals, brokers]);

  return (
    <div className="space-y-6 p-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive deal performance insights</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={(value) => updateDateRange(value as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Select value={selectedBroker} onValueChange={setSelectedBroker}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brokers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brokers</SelectItem>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.id}>
                  {broker.first_name} {broker.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-premium/10 to-premium/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <BarChart3 className="h-4 w-4 text-premium" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.approvedDeals} approved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: £{metrics.totalDeals > 0 ? (metrics.totalRevenue / metrics.totalDeals).toFixed(0) : 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.approvedDeals} of {metrics.totalDeals} approved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brokers</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.brokerData.length}</div>
            <p className="text-xs text-muted-foreground">
              Managing deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Deal Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Status Distribution</CardTitle>
            <CardDescription>Current pipeline breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.statusBreakdown.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--premium))"
                  dataKey="value"
                >
                  {metrics.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Deal Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Deal Type</CardTitle>
            <CardDescription>Total revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `£${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(var(--premium))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Broker Performance - Deals */}
        <Card>
          <CardHeader>
            <CardTitle>Broker Performance - Deals</CardTitle>
            <CardDescription>Total deals by broker</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.brokerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deals" fill="hsl(var(--premium))" name="Total Deals" />
                <Bar dataKey="approved" fill="hsl(var(--success))" name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Broker Performance - Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Broker Performance - Revenue</CardTitle>
            <CardDescription>Revenue generated by broker</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.brokerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `£${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
