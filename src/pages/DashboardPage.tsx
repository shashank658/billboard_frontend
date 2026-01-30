import {
  RectangleHorizontal,
  Calendar,
  IndianRupee,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { formatCurrency } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

// Mock data for dashboard
const stats = [
  {
    title: "Total Billboards",
    value: "245",
    change: "+12",
    changeLabel: "from last month",
    trend: "up",
    icon: RectangleHorizontal,
  },
  {
    title: "Active Bookings",
    value: "182",
    change: "+8",
    changeLabel: "from last month",
    trend: "up",
    icon: Calendar,
  },
  {
    title: "Revenue (MTD)",
    value: formatCurrency(1250000),
    change: "+18%",
    changeLabel: "from last month",
    trend: "up",
    icon: IndianRupee,
  },
  {
    title: "Active Customers",
    value: "67",
    change: "+5",
    changeLabel: "from last month",
    trend: "up",
    icon: Users,
  },
];

const recentBookings = [
  {
    id: "BK-2024-0156",
    customer: "Coca-Cola India",
    billboard: "Mumbai - Bandra Highway",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    value: 150000,
    status: "active",
  },
  {
    id: "BK-2024-0155",
    customer: "Amazon India",
    billboard: "Delhi - Connaught Place",
    startDate: "2024-01-10",
    endDate: "2024-01-25",
    value: 200000,
    status: "completed",
  },
  {
    id: "BK-2024-0154",
    customer: "Flipkart",
    billboard: "Bangalore - MG Road",
    startDate: "2024-01-20",
    endDate: "2024-02-20",
    value: 180000,
    status: "confirmed",
  },
];

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}! Here's an overview of your billboard operations.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
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
                </span>{" "}
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
          <CardDescription>Latest booking activity across all billboards</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <td className="py-3 pr-4 font-medium">{booking.id}</td>
                    <td className="py-3 pr-4">{booking.customer}</td>
                    <td className="py-3 pr-4">{booking.billboard}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">
                      {booking.startDate} - {booking.endDate}
                    </td>
                    <td className="py-3 pr-4">{formatCurrency(booking.value)}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          booking.status === "active"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "completed"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
