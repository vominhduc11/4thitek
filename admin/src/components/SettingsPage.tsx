
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, User, Bell, Shield, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { adminService, AdminInfo } from "@/services/adminService";
import { logger } from '@/utils/logger';

export function SettingsPage() {
  const { toast } = useToast();
  const { updateNotificationSettings } = useNotifications();
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    dealerRegistrations: true,
  });
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  }>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdatingEmailConfirmation, setIsUpdatingEmailConfirmation] = useState(false);

  // Load admin info from API
  useEffect(() => {
    const loadAdminInfo = async () => {
      if (!user?.userId) return;

      setIsLoadingAdmin(true);
      try {
        const data = await adminService.getAdminInfo(user.userId);
        setAdminInfo(data);

        // Validate loaded data
        setErrors({
          name: validateName(data.name),
          email: validateEmail(data.email),
          phone: validatePhone(data.phone),
          companyName: validateCompanyName(data.companyName),
        });
      } catch (error) {
        logger.error('Error loading admin info:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin tài khoản",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAdmin(false);
      }
    };

    loadAdminInfo();
  }, [user?.userId, toast]);

  // Load notification settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Tên không được để trống';
    }
    if (value.length > 255) {
      return 'Tên không được vượt quá 255 ký tự';
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Email không được để trống';
    }
    if (value.length > 255) {
      return 'Email không được vượt quá 255 ký tự';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email không đúng định dạng';
    }
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Số điện thoại không được để trống';
    }
    if (value.length > 20) {
      return 'Số điện thoại không được vượt quá 20 ký tự';
    }
    return undefined;
  };

  const validateCompanyName = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Tên công ty không được để trống';
    }
    if (value.length > 255) {
      return 'Tên công ty không được vượt quá 255 ký tự';
    }
    return undefined;
  };

  // Handle input changes with validation
  const handleNameChange = (value: string) => {
    setAdminInfo(prev => prev ? { ...prev, name: value } : null);
    const error = validateName(value);
    setErrors(prev => ({ ...prev, name: error }));
    setHasUnsavedChanges(true);
  };

  const handleEmailChange = (value: string) => {
    setAdminInfo(prev => prev ? { ...prev, email: value } : null);
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error }));
    setHasUnsavedChanges(true);
  };

  const handlePhoneChange = (value: string) => {
    setAdminInfo(prev => prev ? { ...prev, phone: value } : null);
    const error = validatePhone(value);
    setErrors(prev => ({ ...prev, phone: error }));
    setHasUnsavedChanges(true);
  };

  const handleCompanyNameChange = (value: string) => {
    setAdminInfo(prev => prev ? { ...prev, companyName: value } : null);
    const error = validateCompanyName(value);
    setErrors(prev => ({ ...prev, companyName: error }));
    setHasUnsavedChanges(true);
  };

  // Check if form has errors
  const hasErrors = () => {
    return !!(errors.name || errors.email || errors.phone || errors.companyName);
  };

  // Password validation functions
  const validateCurrentPassword = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Mật khẩu hiện tại không được để trống';
    }
    return undefined;
  };

  const validateNewPassword = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Mật khẩu mới không được để trống';
    }
    if (value.length < 6 || value.length > 100) {
      return 'Mật khẩu phải từ 6-100 ký tự';
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string, newPassword: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Xác nhận mật khẩu không được để trống';
    }
    if (value !== newPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }
    return undefined;
  };

  // Handle password form changes
  const handleCurrentPasswordChange = (value: string) => {
    setPasswordForm(prev => ({ ...prev, currentPassword: value }));
    const error = validateCurrentPassword(value);
    setPasswordErrors(prev => ({ ...prev, currentPassword: error }));
  };

  const handleNewPasswordChange = (value: string) => {
    setPasswordForm(prev => ({ ...prev, newPassword: value }));
    const error = validateNewPassword(value);
    setPasswordErrors(prev => ({ ...prev, newPassword: error }));

    // Re-validate confirm password if it exists
    if (passwordForm.confirmPassword) {
      const confirmError = validateConfirmPassword(passwordForm.confirmPassword, value);
      setPasswordErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setPasswordForm(prev => ({ ...prev, confirmPassword: value }));
    const error = validateConfirmPassword(value, passwordForm.newPassword);
    setPasswordErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  // Check if password form has errors
  const hasPasswordErrors = () => {
    return !!(passwordErrors.currentPassword || passwordErrors.newPassword || passwordErrors.confirmPassword);
  };

  // Handle change password - show confirmation dialog
  const handleChangePasswordClick = () => {
    // Validate all fields
    const currentError = validateCurrentPassword(passwordForm.currentPassword);
    const newError = validateNewPassword(passwordForm.newPassword);
    const confirmError = validateConfirmPassword(passwordForm.confirmPassword, passwordForm.newPassword);

    setPasswordErrors({
      currentPassword: currentError,
      newPassword: newError,
      confirmPassword: confirmError,
    });

    if (currentError || newError || confirmError) {
      return;
    }

    // Show confirmation dialog
    setShowPasswordConfirm(true);
  };

  // Actual password change after confirmation
  const handleChangePassword = async () => {
    setShowPasswordConfirm(false);
    setIsChangingPassword(true);
    try {
      await adminService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      // Clear form on success
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});

      toast({
        title: "Thành công",
        description: "Đã đổi mật khẩu thành công",
      });
    } catch (error: any) {
      logger.error('Error changing password:', error);

      // Handle specific error messages from backend
      let errorMessage = "Không thể đổi mật khẩu";
      if (error?.message) {
        if (error.message.includes('Current password is incorrect')) {
          errorMessage = "Mật khẩu hiện tại không đúng";
        } else if (error.message.includes('must be different from current password')) {
          errorMessage = "Mật khẩu mới phải khác mật khẩu hiện tại";
        } else if (error.message.includes('do not match')) {
          errorMessage = "Mật khẩu xác nhận không khớp";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Save settings to localStorage whenever they change
  const handleNotificationChange = (key: 'orderNotifications' | 'dealerRegistrations', value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      [key]: value,
    };
    setNotificationSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));

    // Update WebSocket subscriptions
    updateNotificationSettings();

    toast({
      title: "Đã lưu",
      description: `Cài đặt thông báo ${value ? 'bật' : 'tắt'} thành công`,
    });
  };

  // Update admin info
  const handleUpdateAdminInfo = async () => {
    if (!adminInfo?.accountId) return;

    setIsUpdating(true);
    try {
      const updatedInfo = await adminService.updateAdminInfo(adminInfo.accountId, {
        name: adminInfo.name,
        email: adminInfo.email,
        phone: adminInfo.phone,
        companyName: adminInfo.companyName,
      });
      setAdminInfo(updatedInfo);
      setHasUnsavedChanges(false);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin tài khoản",
      });
    } catch (error) {
      logger.error('Error updating admin info:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin tài khoản",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle login email confirmation
  const handleToggleLoginEmailConfirmation = async (enabled: boolean) => {
    if (!adminInfo?.accountId) return;

    setIsUpdatingEmailConfirmation(true);
    try {
      const updatedInfo = await adminService.updateLoginEmailConfirmation(
        adminInfo.accountId,
        enabled
      );
      setAdminInfo(updatedInfo);
      toast({
        title: "Thành công",
        description: `Đã ${enabled ? 'bật' : 'tắt'} xác thực email khi đăng nhập`,
      });
    } catch (error) {
      logger.error('Error updating login email confirmation:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cài đặt xác thực email",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmailConfirmation(false);
    }
  };


  return (
    <motion.div
      className="space-y-6 p-4 sm:p-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <motion.div className="flex items-center gap-3" variants={fadeInUp}>
        <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Cài đặt hệ thống</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Quản lý cấu hình và tùy chỉnh hệ thống</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-3xl mx-auto w-full">
        {/* Thông tin tài khoản */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <User className="h-5 w-5 text-primary" />
              Thông tin tài khoản
            </CardTitle>
            <CardDescription className="text-sm">
              Cập nhật thông tin cá nhân và mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAdmin ? (
              <>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={adminInfo?.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`transition-all ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminInfo?.email || ''}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={adminInfo?.phone || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">
                    Tên công ty <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    value={adminInfo?.companyName || ''}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    className={errors.companyName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <Button
                    onClick={handleUpdateAdminInfo}
                    disabled={isUpdating || !adminInfo || hasErrors() || !hasUnsavedChanges}
                    className="w-full sm:w-auto transition-colors"
                  >
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cập nhật thông tin
                  </Button>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 animate-pulse">
                      Có thay đổi chưa lưu
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Thông báo */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Bell className="h-5 w-5 text-primary" />
              Cài đặt thông báo
            </CardTitle>
            <CardDescription className="text-sm">
              Quản lý các loại thông báo bạn muốn nhận
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label>Đơn hàng</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thông báo về đơn hàng mới và cập nhật trạng thái</p>
              </div>
              <Switch
                checked={notificationSettings.orderNotifications}
                onCheckedChange={(checked) => handleNotificationChange('orderNotifications', checked)}
                className="flex-shrink-0"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label>Đăng ký đại lý</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thông báo khi có đại lý đăng ký mới</p>
              </div>
              <Switch
                checked={notificationSettings.dealerRegistrations}
                onCheckedChange={(checked) => handleNotificationChange('dealerRegistrations', checked)}
                className="flex-shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bảo mật */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Shield className="h-5 w-5 text-primary" />
              Bảo mật
            </CardTitle>
            <CardDescription className="text-sm">
              Cài đặt bảo mật và quyền truy cập
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label>Xác thực email khi đăng nhập</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Yêu cầu xác nhận qua email mỗi lần đăng nhập</p>
              </div>
              <Switch
                checked={adminInfo?.requireLoginEmailConfirmation || false}
                onCheckedChange={handleToggleLoginEmailConfirmation}
                disabled={isUpdatingEmailConfirmation || isLoadingAdmin}
                className="flex-shrink-0"
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Đổi mật khẩu</h4>
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                  className={passwordErrors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  className={passwordErrors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>
                )}
                <p className="text-xs text-gray-500">Mật khẩu phải từ 6-100 ký tự</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={passwordErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleChangePasswordClick}
                disabled={isChangingPassword || hasPasswordErrors() || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="w-full sm:w-auto transition-colors"
              >
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đổi mật khẩu
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Password Change Confirmation Dialog */}
      <AlertDialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Xác nhận đổi mật khẩu
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Bạn có chắc chắn muốn đổi mật khẩu không?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại bằng mật khẩu mới.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} className="bg-primary hover:bg-primary/90">
              Xác nhận đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
