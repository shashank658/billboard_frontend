import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  RectangleHorizontal,
  Calendar,
  Users,
  Building2,
  FileText,
  BarChart3,
  Settings,
  Shield,
  MapPin,
  Receipt,
  FileCheck,
  Image,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permissions?: string[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permissions: ["dashboard.view"] },
  { name: "Billboards", href: "/billboards", icon: RectangleHorizontal, permissions: ["billboards.view"] },
  { name: "Regions", href: "/regions", icon: MapPin, permissions: ["locations.view"] },
  { name: "Bookings", href: "/bookings", icon: Calendar, permissions: ["bookings.view"] },
  { name: "Campaigns", href: "/campaigns", icon: FileText, permissions: ["campaigns.view"] },
  { name: "Customers", href: "/customers", icon: Users, permissions: ["customers.view"] },
  { name: "Landlords", href: "/landlords", icon: Building2, permissions: ["landlords.view"] },
  { name: "Taxes", href: "/taxes", icon: Receipt, permissions: ["taxes.view"] },
];

const financeNavigation: NavItem[] = [
  { name: "Purchase Orders", href: "/purchase-orders", icon: FileCheck, permissions: ["purchase_orders.view"] },
  { name: "Invoices", href: "/invoices", icon: FileText, permissions: ["invoices.view"] },
];

const operationsNavigation: NavItem[] = [
  { name: "Audit Media", href: "/audit-media", icon: Image, permissions: ["audit_media.view"] },
  { name: "Reports", href: "/reports", icon: BarChart3, permissions: ["reports.view"] },
];

const adminNavigation: NavItem[] = [
  { name: "Users", href: "/users", icon: Users, permissions: ["users.view"] },
  { name: "Roles", href: "/roles", icon: Shield, permissions: ["roles.view"] },
  { name: "Settings", href: "/settings", icon: Settings, permissions: ["settings.view"] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { hasAnyPermission } = useAuth();

  const filterByPermission = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasAnyPermission(...item.permissions);
    });
  };

  const visibleNavigation = filterByPermission(navigation);
  const visibleFinanceNavigation = filterByPermission(financeNavigation);
  const visibleOperationsNavigation = filterByPermission(operationsNavigation);
  const visibleAdminNavigation = filterByPermission(adminNavigation);

  const renderNavItems = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </NavLink>
      ))}
    </div>
  );

  const renderNavSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-6">
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {renderNavItems(items)}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <RectangleHorizontal className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">Billboard</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main navigation */}
        {renderNavItems(visibleNavigation)}

        {/* Finance section */}
        {renderNavSection("Finance", visibleFinanceNavigation)}

        {/* Operations section */}
        {renderNavSection("Operations", visibleOperationsNavigation)}

        {/* Admin section */}
        {renderNavSection("Administration", visibleAdminNavigation)}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
