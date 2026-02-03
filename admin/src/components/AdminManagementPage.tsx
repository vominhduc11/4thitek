import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ShieldAlert,
  Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { adminService, AdminInfo, CreateAdminRequest } from "@/services/adminService";
import { logger } from '@/utils/logger';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Không thể xử lý yêu cầu";

export function AdminManagementPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminInfo | null>(null);
  const [selectedAdminIds, setSelectedAdminIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state for create
  const [formData, setFormData] = useState<CreateAdminRequest>({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    companyName: "",
  });

  // Form state for edit
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
  });

  // Fetch all admins
  const fetchAdmins = useCallback(async () => {
    // Chỉ SYSTEM mới được phép gọi API tránh lỗi 403/500 không cần thiết
    if (!user?.roles?.includes("SYSTEM")) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.getAllAdmins();
      if (response.success) {
        setAdmins(response.data);
      }
    } catch (error) {
      logger.error("Error fetching admins:", error);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách quản trị viên",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins, user]);

  // Handle create admin
  const handleCreateAdmin = async () => {
    // Validate required fields
    if (!formData.username || !formData.password || !formData.name || !formData.email || !formData.phone || !formData.companyName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Validate username length (3-50 characters)
    if (formData.username.length < 3 || formData.username.length > 50) {
      toast({
        title: "Lỗi validation",
        description: "Tên đăng nhập phải có từ 3-50 ký tự",
        variant: "destructive",
      });
      return;
    }

    // Validate password length (8-100 characters)
    if (formData.password.length < 8 || formData.password.length > 100) {
      toast({
        title: "Lỗi validation",
        description: "Mật khẩu phải có từ 8-100 ký tự",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Lỗi validation",
        description: "Email không đúng định dạng",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await adminService.createAdmin(formData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo tài khoản quản trị viên mới",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAdmins();
      }
    } catch (error: unknown) {
      logger.error("Error creating admin:", error);
      toast({
        title: "Lỗi tạo tài khoản",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      setIsSubmitting(true);
      const response = await adminService.deleteAdmin(selectedAdmin.accountId);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa tài khoản quản trị viên",
        });
        setIsDeleteDialogOpen(false);
        setSelectedAdmin(null);
        fetchAdmins();
      }
    } catch (error: unknown) {
      logger.error("Error deleting admin:", error);
      toast({
        title: "Lỗi xóa tài khoản",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      companyName: "",
    });
    setShowPassword(false);
  };

  const openDeleteDialog = (admin: AdminInfo) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (admin: AdminInfo) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone || "",
      companyName: admin.companyName || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle edit admin
  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;

    // Validate required fields
    if (!editFormData.name || !editFormData.email || !editFormData.phone || !editFormData.companyName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormData.email)) {
      toast({
        title: "Lỗi validation",
        description: "Email không đúng định dạng",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.updateAdminInfo(selectedAdmin.accountId, editFormData);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin quản trị viên",
      });
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error: unknown) {
      logger.error("Error updating admin:", error);
      toast({
        title: "Lỗi cập nhật",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle checkbox selection
  const handleSelectAdmin = (adminId: number, checked: boolean) => {
    if (checked) {
      setSelectedAdminIds([...selectedAdminIds, adminId]);
    } else {
      setSelectedAdminIds(selectedAdminIds.filter(id => id !== adminId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAdminIds(admins.map(admin => admin.accountId));
    } else {
      setSelectedAdminIds([]);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedAdminIds.length === 0) return;

    try {
      setIsSubmitting(true);

      // Use batch delete API
      const result = await adminService.batchDeleteAdmins(selectedAdminIds);

      if (result.success) {
        const { successCount, failCount, failedDeletes } = result.data;

        // Show success message
        if (successCount > 0) {
          toast({
            title: "Thành công",
            description: `Đã xóa ${successCount} tài khoản quản trị viên`,
          });
        }

        // Show warning if some deletions failed
        if (failCount > 0) {
          const failedIds = failedDeletes.map(f => f.adminId).join(", ");
          toast({
            title: "Cảnh báo",
            description: `${failCount} tài khoản không thể xóa (ID: ${failedIds})`,
            variant: "destructive",
          });
        }

        setIsBulkDeleteDialogOpen(false);
        setSelectedAdminIds([]);
        fetchAdmins();
      }
    } catch (error: unknown) {
      logger.error("Error bulk deleting admins:", error);
      toast({
        title: "Lỗi xóa tài khoản",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const totalAdmins = admins.length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Quản lý tài khoản Admin
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Quản lý tài khoản quản trị viên hệ thống
            </p>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng số Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <CardTitle>Danh sách Quản trị viên</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} columns={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý tài khoản Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quản lý tài khoản quản trị viên hệ thống
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng số Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalAdmins}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 justify-between items-center sm:flex-nowrap">
              <CardTitle>Danh sách Quản trị viên</CardTitle>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap justify-end flex-1 sm:flex-none">
                {selectedAdminIds.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa {selectedAdminIds.length} mục
                  </Button>
                )}
                <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Thêm Admin
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {admins.length === 0 ? (
              <p className="text-center text-muted-foreground">Chưa có quản trị viên nào</p>
            ) : (
              admins.map((admin) => (
                <Card key={admin.accountId}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedAdminIds.includes(admin.accountId)}
                          onCheckedChange={(checked) => handleSelectAdmin(admin.accountId, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Họ tên</p>
                          <p className="font-semibold text-foreground">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                          <p className="text-sm text-muted-foreground">{admin.phone || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{admin.companyName || "N/A"}</p>
                          <Badge variant={admin.role === "SYSTEM" ? "default" : "secondary"}>
                            {admin.role || "ADMIN"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(admin)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => openDeleteDialog(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <ResponsiveTableWrapper minWidth="760px">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAdminIds.length === admins.length && admins.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Chưa có quản trị viên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.accountId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAdminIds.includes(admin.accountId)}
                          onCheckedChange={(checked) => handleSelectAdmin(admin.accountId, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone || "N/A"}</TableCell>
                      <TableCell>{admin.companyName || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(admin)}
                            className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(admin)}
                            className="hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </ResponsiveTableWrapper>
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản Admin mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo tài khoản quản trị viên mới. Tất cả các trường đều bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Tên đăng nhập <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin_user"
                minLength={3}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">3-50 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={100}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">8-100 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Họ tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+84123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">
                Công ty <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="DevWonder Corp"
              />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateAdmin} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tạo Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin Admin</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin quản trị viên. Tất cả các trường đều bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Họ tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+84123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-companyName">
                Công ty <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-companyName"
                value={editFormData.companyName}
                onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                placeholder="DevWonder Corp"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedAdmin(null);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleEditAdmin} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              Xác nhận xóa Admin
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản quản trị viên này?
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="space-y-2 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Họ tên:</span>
                <span className="font-medium">{selectedAdmin.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{selectedAdmin.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quyền:</span>
                <Badge variant={selectedAdmin.role === "SYSTEM" ? "default" : "secondary"}>
                  {selectedAdmin.role || "ADMIN"}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedAdmin(null);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              Xác nhận xóa nhiều Admin
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedAdminIds.length} tài khoản quản trị viên đã chọn?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến các tài khoản này sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Số lượng tài khoản sẽ bị xóa:</p>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {selectedAdminIds.length}
                </Badge>
                <span className="text-sm text-muted-foreground">tài khoản</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkDeleteDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa {selectedAdminIds.length} tài khoản
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
