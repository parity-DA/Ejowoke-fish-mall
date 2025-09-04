import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  Menu,
  X,
  Fish,
  TrendingUp,
  Truck,
  Shield,
  LogOut,
  User,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Stock", href: "/stock", icon: Truck },
  { name: "Sales Entry", href: "/sales", icon: ShoppingCart },
  { name: "Sales Management", href: "/sales-management", icon: BarChart3 },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Expenses", href: "/expenses", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const superAdminNavigation = [
  { name: "Super Admin", href: "/super-admin", icon: Shield },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg">
          <div className="flex h-full flex-col">
            {/* Mobile header */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center space-x-2">
                <Fish className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-lg font-bold text-primary">EJowoke</h1>
                  <p className="text-xs text-muted-foreground">Fish Mall & Logistics</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
              
              {/* Super Admin Section */}
              <div className="pt-4 border-t">
                <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Admin
                </p>
                {superAdminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-destructive text-destructive-foreground shadow-destructive"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:w-64 lg:flex lg:flex-col">
        <div className="flex grow flex-col bg-card border-r shadow-card">
          {/* Desktop header */}
          <div className="flex h-16 items-center px-4 border-b bg-gradient-primary">
            <div className="flex items-center space-x-2">
              <Fish className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-lg font-bold text-white">EJowoke</h1>
                <p className="text-xs text-white/80">Fish Mall & Logistics</p>
              </div>
            </div>
          </div>
          
           {/* Desktop navigation */}
           <nav className="flex-1 px-2 py-4 space-y-1">
             {navigation.map((item) => {
               const isActive = location.pathname === item.href;
               return (
                 <NavLink
                   key={item.name}
                   to={item.href}
                   className={cn(
                     "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                     isActive
                       ? "bg-primary text-primary-foreground shadow-primary"
                       : "text-muted-foreground hover:text-foreground hover:bg-muted"
                   )}
                 >
                   <item.icon className="mr-3 h-5 w-5" />
                   {item.name}
                 </NavLink>
               );
             })}
             
             {/* Super Admin Section */}
             <div className="pt-4 border-t">
               <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                 Admin
               </p>
               {superAdminNavigation.map((item) => {
                 const isActive = location.pathname === item.href;
                 return (
                   <NavLink
                     key={item.name}
                     to={item.href}
                     className={cn(
                       "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                       isActive
                         ? "bg-destructive text-destructive-foreground shadow-destructive"
                         : "text-muted-foreground hover:text-foreground hover:bg-muted"
                     )}
                   >
                     <item.icon className="mr-3 h-5 w-5" />
                     {item.name}
                   </NavLink>
                 );
               })}
             </div>
           </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-card border-b shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-1 items-center px-4">
            {/* Mobile-only logo */}
            <div className="lg:hidden flex items-center space-x-2">
              <Fish className="h-6 w-6 text-primary" />
              <span className="font-semibold text-primary">EJowoke</span>
            </div>
            
            {/* User profile section, pushed to the right */}
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Welcome back, <span className="font-medium text-foreground">{user?.email?.split('@')[0]}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
