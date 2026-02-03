
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationDetailModal } from "./NotificationDetailModal";
import { ThemeToggle } from "./ThemeToggle";
import { useNotifications } from "@/contexts/NotificationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Notification } from "@/services/notificationService";

export function Header() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, unreadCount, isLoading, refreshNotifications } = useNotifications();
  const isMobile = useIsMobile();

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleNotificationClick = async (notification: Notification) => {
    
    // Tự động đánh dấu là đã đọc khi click vào thông báo
    if (!notification.read) {
      await markAsRead(notification.id);
      
      // Đợi một chút để state được cập nhật
    }
    
    // Lấy notification đã được cập nhật từ state thay vì mutate object
    const updatedNotification = notifications.find(n => n.id === notification.id) || notification;
    setSelectedNotification(updatedNotification);
    setIsNotificationModalOpen(true);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation(); // Ngăn click event bubble up
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const closeNotificationModal = () => {
    setIsNotificationModalOpen(false);
    setSelectedNotification(null);
  };

  const NotificationsBody = () => (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-slate-600">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Thông báo</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Bạn có {unreadCount} thông báo mới</p>
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 px-2 text-xs"
                title="Đánh dấu tất cả đã đọc"
              >
                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tất cả
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Tải lại thông báo"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="max-h-[70vh] md:max-h-96 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white mx-auto mb-2" />
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-slate-400">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div 
              key={notification.id || `notification-${index}`} 
              className={`group p-4 border-b border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{notification.title}</h4>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 break-words">{notification.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-slate-500">{notification.time}</span>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Đánh dấu đã đọc"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-slate-600">
        <Link to="/notifications" onClick={() => isMobile && setIsNotificationSheetOpen(false)}>
          <Button variant="ghost" className="w-full text-sm">
            Xem tất cả thông báo
          </Button>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6 transition-colors">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="p-2" />
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-10 w-48 md:w-56 lg:w-64 xl:w-72 2xl:w-80 bg-muted dark:bg-muted border-input cursor-pointer"
              onClick={handleSearchClick}
              readOnly
            />
          </div>
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={handleSearchClick}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isMobile ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsNotificationSheetOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Sheet open={isNotificationSheetOpen} onOpenChange={setIsNotificationSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-sm p-0">
                  <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
                    <SheetTitle>Thông báo</SheetTitle>
                  </SheetHeader>
                  <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
                    <NotificationsBody />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96 xl:w-[28rem] max-w-[calc(100vw-2rem)] p-0 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600" align="end">
                <NotificationsBody />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isNotificationModalOpen}
        onClose={closeNotificationModal}
      />
    </>
  );
}
