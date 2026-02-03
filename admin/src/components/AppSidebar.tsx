
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Tổng quan",
    url: "/",
    icon: Home,
  },
  {
    title: "Tai nghe SCS",
    url: "/products",
    icon: Package,
  },
  {
    title: "Đơn hàng",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Khách hàng",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Báo cáo",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Blogs",
    url: "/blogs",
    icon: FileText,
  },
  {
    title: "Chiết khấu bán sỉ",
    url: "/bulk-discounts",
    icon: Percent,
  },
  {
    title: "Quản lý Admin",
    url: "/admins",
    icon: ShieldCheck,
    requiresRole: "SYSTEM", // Only show for SYSTEM role
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Filter menu items based on user roles
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.requiresRole) return true;
    return user?.roles?.includes(item.requiresRole);
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi hệ thống.",
    });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      className="border-r border-border bg-background shadow-lg shadow-foreground/5"
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-to-b from-background/50 to-background">
        {/* Logo Section - Hidden when collapsed */}
        <div className="px-4 py-6 border-b border-border group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="font-bold text-lg text-primary-foreground">4T</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 ml-3">
              <span className="font-bold text-xl text-foreground tracking-tight">4ThiTek</span>
              <span className="text-muted-foreground text-sm font-medium">Tai nghe SCS</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={isCollapsed ? item.title : undefined}
                    className={`
                      group relative overflow-hidden rounded-lg transition-all duration-200 ease-out h-11
                      ${isActive(item.url)
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-primary-foreground shadow-lg shadow-blue-500/20 scale-[1.02]'
                        : 'hover:bg-muted/80 text-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="w-full h-full flex items-center gap-3 relative z-10 px-3"
                    >
                      <item.icon className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${
                        isActive(item.url) ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                      <span className={`font-medium transition-all duration-200 group-data-[collapsible=icon]:hidden ${
                        isActive(item.url) ? 'text-primary-foreground' : 'text-foreground group-hover:text-foreground'
                      }`}>
                        {item.title}
                      </span>
                      {isActive(item.url) && !isCollapsed && (
                        <ChevronRight className="h-4 w-4 ml-auto text-primary-foreground/90" />
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Footer - Hidden when collapsed */}
      <SidebarFooter className="border-t border-border bg-muted/30 p-4 group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-14 px-3 hover:bg-card/80 rounded-lg border border-border bg-card/60 shadow-sm transition-all duration-200 hover:shadow-md backdrop-blur-sm">
                  <Avatar className="mr-3 h-8 w-8 ring-2 ring-primary/20 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-primary-foreground font-semibold text-sm">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-foreground text-sm truncate w-full">{user?.username}</span>
                    <span className="text-xs text-muted-foreground truncate w-full">Quản trị viên</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-screen max-w-[90vw] sm:w-64 p-2 bg-popover/95 backdrop-blur-sm border border-border shadow-xl rounded-xl">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-primary-foreground font-semibold">
                        {user?.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate">{user?.username}</span>
                      <span className="text-sm text-muted-foreground truncate">4ThiTek Admin</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/80 transition-colors focus:bg-muted/80"
                >
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-red-50/80 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors focus:bg-red-50/80 dark:focus:bg-red-950/30"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
