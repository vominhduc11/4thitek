import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableWrapper } from "@/components/ui/responsive-table";
import {
  Search,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { CustomerForm } from "./CustomerForm";
import { CustomerDeleteDialog } from "./CustomerDeleteDialog";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { useToast } from "@/hooks/use-toast";
import { dealerApi } from "@/services/api";
import { DEFAULT_ITEMS_PER_PAGE } from "@/constants/business";
import { useDebounce } from "@/hooks/useDebounce";
import { logger } from '@/utils/logger';
import { PageContainer } from "./shared/PageContainer";

interface DealerData {
  accountId: number;
  companyName: string;
  fullName?: string;
  taxCode?: string;
  avatarUrl?: string | null;
  address: string;
  phone: string;
  email: string;
  district: string;
  city: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: DealerData[];
}

const ITEMS_PER_PAGE = DEFAULT_ITEMS_PER_PAGE;

export function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<DealerData[]>([]); // Displayed customers (filtered/searched)
  const [allCustomers, setAllCustomers] = useState<DealerData[]>([]); // All customers for stats calculation
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<DealerData | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  // Fetch dealers from API
  const fetchDealers = useCallback(async (page: number = 0, size: number = ITEMS_PER_PAGE, searchQuery: string = '', isSearch: boolean = false) => {
    try {
      // Use searchLoading for search operations, initialLoading for first load
      if (isSearch) {
        setSearchLoading(true);
      } else {
        setInitialLoading(true);
      }

      let response: ApiResponse;

      // Use search API if query exists, otherwise get all with pagination
      if (searchQuery.trim()) {
        logger.debug('🔍 Searching dealers with query:', searchQuery);
        response = await dealerApi.search(searchQuery);
      } else {
        logger.debug('🔍 Fetching dealers with pagination');
        response = await dealerApi.getAll(page, size);
      }

      // Kiểm tra cấu trúc API mới: {success, message, data: []}
      if (response && response.success && Array.isArray(response.data)) {
        setCustomers(response.data);

        // Save all customers for stats calculation only when NOT searching
        if (!isSearch || !searchQuery.trim()) {
          setAllCustomers(response.data);
        }

        setTotalElements(response.data.length);
        setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
        setCurrentPage(page);
      } else {
        // Fallback nếu response không đúng format
        setCustomers([]);
        setTotalElements(0);
        setTotalPages(0);
        setCurrentPage(0);
      }
    } catch (error) {
      logger.error('Error fetching dealers:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đại lý",
        variant: "destructive",
      });
      setCustomers([]);
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setInitialLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  // Trigger search when debounced search term changes
  useEffect(() => {
    fetchDealers(0, ITEMS_PER_PAGE, debouncedSearchTerm, true); // isSearch = true
  }, [debouncedSearchTerm, fetchDealers]);

  const handleEditCustomer = (customer: DealerData) => {
    setSelectedCustomer(customer);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleOpenForm = (mode: "add" | "edit", customer?: DealerData) => {
    setFormMode(mode);
    setSelectedCustomer(customer ?? null);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customer: DealerData) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveCustomer = async (customerData: Partial<DealerData>) => {
    try {
      if (formMode === "add") {
        await dealerApi.create(customerData);
        toast({
          title: "Thành công",
          description: "Đã thêm đại lý mới",
        });
      } else if (selectedCustomer) {
        await dealerApi.update(selectedCustomer.accountId, customerData);
        setCustomers(prev =>
          prev.map((customer) =>
            customer.accountId === selectedCustomer.accountId ? { ...customer, ...customerData } : customer
          )
        );
        toast({
          title: "Thành công",
          description: "Cập nhật thông tin đại lý thành công",
        });
      }

      setIsFormOpen(false);
      setSelectedCustomer(null);
      fetchDealers(currentPage);
    } catch (error) {
      logger.error('Error saving dealer:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin đại lý",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      await apiRequest(`/api/user/admin/dealers/${selectedCustomer.accountId}`, {
        method: 'DELETE'
      });

      setCustomers(prev => prev.filter(customer => customer.accountId !== selectedCustomer.accountId));
      
      toast({
        title: "Thành công",
        description: "Xóa đại lý thành công",
      });
    } catch (error) {
      logger.error('Error deleting reseller:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đại lý",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };


  const handleViewCustomer = (customer: DealerData) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    fetchDealers(newPage);
  };


  const handleExportClick = () => {
    if (filteredCustomers.length === 0) {
      toast({
        title: "Không có dữ liệu",
        description: "Không có dữ liệu để xuất",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Account ID",
      "Tên công ty",
      "Họ và tên",
      "Mã số thuế",
      "Email",
      "Số điện thoại",
      "Địa chỉ",
      "Quận/Huyện",
      "Thành phố",
      "Avatar URL"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map(customer => [
        `"${customer.accountId}"`,
        `"${customer.companyName}"`,
        `"${customer.fullName || ''}"`,
        `"${customer.taxCode || ''}"`,
        `"${customer.email}"`,
        `"${customer.phone}"`,
        `"${customer.address}"`,
        `"${customer.district}"`,
        `"${customer.city}"`,
        `"${customer.avatarUrl || ''}"`
      ].join(","))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const fileName = `danh-sach-dai-ly-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Xuất Excel thành công", 
      description: `Đã xuất ${filteredCustomers.length} đại lý ra file CSV`,
    });
  };


  // Filter by city and district (search is handled by API)
  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter(customer => {
    const matchesCity = !filterCity || customer.city.toLowerCase().includes(filterCity.toLowerCase());
    const matchesDistrict = !filterDistrict || customer.district.toLowerCase().includes(filterDistrict.toLowerCase());

    return matchesCity && matchesDistrict;
  });

  // Get unique cities and districts for filter dropdowns
  const uniqueCities = Array.from(new Set(customers.map(c => c.city))).sort();
  const uniqueDistricts = Array.from(new Set(customers.map(c => c.district))).sort();

  const clearFilters = () => {
    setFilterCity("");
    setFilterDistrict("");
    toast({
      title: "Đã xóa bộ lọc",
      description: "Tất cả bộ lọc đã được xóa",
    });
  };

  const activeFiltersCount = [filterCity, filterDistrict].filter(f => f !== "").length;

  // Use allCustomers for stats to keep them consistent during search
  const statsCustomers = allCustomers.length > 0 ? allCustomers : customers;

  if (initialLoading) {
    return (
      <PageContainer
        title="Quản lý đại lý"
        description="Quản lý thông tin các đại lý phân phối."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleOpenForm("add")} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm đại lý
            </Button>
            <Button variant="outline" onClick={() => fetchDealers(currentPage)} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        }
      >
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`stat-skeleton-${index}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-12 bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="relative flex-1">
                    <div className="h-10 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} columns={4} />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Quản lý đại lý"
      description="Quản lý thông tin các đại lý phân phối."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleOpenForm("add")} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm đại lý
          </Button>
          <Button variant="outline" onClick={() => fetchDealers(currentPage)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      }
    >
      <motion.div
        className="space-y-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          variants={staggerContainer}
        >
          {[
            { label: "Tổng số đại lý", value: statsCustomers.length, tone: "text-success-600" },
            { label: "TP.HCM", value: statsCustomers.filter(c => c.city.toLowerCase().includes('ho chi minh')).length, tone: "text-info-700" },
            { label: "Hà Nội", value: statsCustomers.filter(c => c.city.toLowerCase().includes('ha noi')).length, tone: "text-primary" }
          ].map((stat, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card className="transition-shadow hover:shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.tone}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm đại lý..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <Button
                      variant={activeFiltersCount > 0 ? "default" : "outline"}
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full sm:w-auto"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </Button>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="icon" onClick={clearFilters} title="Xóa bộ lọc">
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleExportClick}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Xuất Excel
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Thành phố
                      </label>
                      <select
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Tất cả thành phố</option>
                        {uniqueCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Quận/Huyện
                      </label>
                      <select
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Tất cả quận/huyện</option>
                        {uniqueDistricts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {searchLoading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="grid gap-3 md:hidden">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <Card key={customer.accountId}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Account ID</p>
                                <p className="font-semibold text-foreground">{customer.accountId}</p>
                                <p className="font-medium text-foreground mt-1">{customer.companyName}</p>
                                {customer.fullName && (
                                  <p className="text-sm text-muted-foreground">{customer.fullName}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => handleViewCustomer(customer)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => handleEditCustomer(customer)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDeleteCustomer(customer)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{customer.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{`${customer.address}, ${customer.district}, ${customer.city}`}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">Không có dữ liệu</p>
                    )}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <ResponsiveTableWrapper minWidth="1000px">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Công ty</TableHead>
                            <TableHead>Liên hệ</TableHead>
                            <TableHead>Địa chỉ</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <TableRow key={customer.accountId}>
                                <TableCell>
                                  <p className="font-medium text-foreground">{customer.companyName}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span>{customer.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span>{customer.phone}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span className="max-w-[200px] truncate">{customer.address}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{customer.district}, {customer.city}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button variant="ghost" size="icon" onClick={() => handleViewCustomer(customer)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                {searchLoading ? "Đang tải..." : "Không có dữ liệu"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ResponsiveTableWrapper>
                  </div>
                </>
              )}

              {/* Pagination */}
              {!searchLoading && totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalElements)} / {totalElements} khách hàng
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <span className="text-sm">
                      Trang {currentPage + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <CustomerForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveCustomer}
          customer={selectedCustomer}
          mode={formMode}
        />

        <CustomerDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          customer={selectedCustomer}
        />

        <CustomerDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          customer={selectedCustomer}
        />
      </motion.div>
    </PageContainer>
  );
}
