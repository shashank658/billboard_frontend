import { useEffect, useState } from "react";
import {
  RectangleHorizontal,
  Calendar,
  IndianRupee,
  Users,
  TrendingUp,
  TrendingDown,
  Megaphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { formatCurrency, formatDate } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import {
  dashboardService,
  type DashboardStats,
  type RecentBooking,
} from "../services/dashboard.service";

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, bookingsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentBookings(5),
        ]);

        setStats(statsData);
        setRecentBookings(bookingsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateChange = (
    current: number,
    previous: number
  ): { value: string; trend: "up" | "down" | "neutral" } => {
    if (previous === 0) {
      return current > 0
        ? { value: `+${current}`, trend: "up" }
        : { value: "0", trend: "neutral" };
    }
    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return { value: `+${change.toFixed(0)}%`, trend: "up" };
    } else if (change < 0) {
      return { value: `${change.toFixed(0)}%`, trend: "down" };
    }
    return { value: "0%", trend: "neutral" };
  };

  const getStatCards = (): StatCard[] => {
    if (!stats) return [];

    const revenueChange = calculateChange(
      stats.revenueThisMonth,
      stats.revenueLastMonth
    );
    const bookingsChange = calculateChange(
      stats.bookingsThisMonth,
      stats.bookingsLastMonth
    );

    return [
      {
        title: "Total Billboards",
        value: stats.totalBillboards.toString(),
        change: `${stats.activeBillboards} active`,
        changeLabel: "",
        trend: "neutral",
        icon: RectangleHorizontal,
      },
      {
        title: "Active Bookings",
        value: stats.activeBookings.toString(),
        change: bookingsChange.value,
        changeLabel: "from last month",
        trend: bookingsChange.trend,
        icon: Calendar,
      },
      {
        title: "Revenue (MTD)",
        value: formatCurrency(stats.revenueThisMonth),
        change: revenueChange.value,
        changeLabel: "from last month",
        trend: revenueChange.trend,
        icon: IndianRupee,
      },
      {
        title: "Active Customers",
        value: stats.activeCustomers.toString(),
        change: `${stats.totalCustomers} total`,
        changeLabel: "",
        trend: "neutral",
        icon: Users,
      },
      {
        title: "Active Campaigns",
        value: stats.activeCampaigns.toString(),
        change: `${stats.totalCampaigns} total`,
        changeLabel: "",
        trend: "neutral",
        icon: Megaphone,
      },
    ];
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "completed":
      case "po_generated":
      case "invoiced":
        return "bg-gray-100 text-gray-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "created":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">
          Error Loading Dashboard
        </h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = getStatCards();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}! Here's an overview of your billboard
          operations.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.trend !== "neutral" ? (
                  <span
                    className={
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="inline h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </span>
                ) : (
                  <span>{stat.change}</span>
                )}{" "}
                {stat.changeLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>
            Latest booking activity across all billboards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bookings found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Booking ID</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Billboard</th>
                    <th className="pb-3 pr-4">Period</th>
                    <th className="pb-3 pr-4">Value</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {booking.referenceCode}
                      </td>
                      <td className="py-3 pr-4">{booking.customerName}</td>
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-medium">{booking.billboardName}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.billboardCode}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-muted-foreground">
                        {formatDate(booking.startDate)} -{" "}
                        {formatDate(booking.endDate)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(parseFloat(booking.notionalValue))}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                            booking.status
                          )}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bookings</span>
                <span className="font-semibold">{stats.totalBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Bookings This Month
                </span>
                <span className="font-semibold">{stats.bookingsThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Bookings Last Month
                </span>
                <span className="font-semibold">{stats.bookingsLastMonth}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.revenueThisMonth)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Month</span>
                <span className="font-semibold">
                  {formatCurrency(stats.revenueLastMonth)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Change</span>
                <span
                  className={`font-semibold ${
                    stats.revenueThisMonth >= stats.revenueLastMonth
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {calculateChange(
                    stats.revenueThisMonth,
                    stats.revenueLastMonth
                  ).value}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
