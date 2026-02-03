
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { Routes, Route } from "react-router-dom";
import { ProductsPage } from "@/components/ProductsPage";
import { OrdersPage } from "@/components/OrdersPage";
import { CustomersPage } from "@/components/CustomersPage";
import { BlogsPage } from "@/components/BlogsPage";
import { ReportsPage } from "@/components/ReportsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { NotificationsPage } from "@/components/NotificationsPage";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
