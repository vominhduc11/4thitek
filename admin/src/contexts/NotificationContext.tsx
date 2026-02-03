import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketService } from '@/services/websocketService';
import { notificationService, Notification } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  updateNotificationSettings: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [forceUpdateCount, setForceUpdateCount] = useState(0);

  // Lấy danh sách thông báo từ API
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      // Fallback để UI không bị rỗng/crash nếu API 5xx
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Lấy thông báo từ API khi đăng nhập
      fetchNotifications();

      // Connect to WebSocket only when authenticated
      websocketService.connect();

      // Subscribe to notifications
      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      };

      websocketService.subscribeToNotifications(handleNewNotification);

      // Cleanup function
      return () => {
        websocketService.unsubscribeFromNotifications(handleNewNotification);
        websocketService.disconnect();
      };
    } else {
      // Disconnect when not authenticated
      websocketService.disconnect();
      setNotifications([]);
    }
  }, [isAuthenticated]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = async (id: number) => {
    // Cập nhật state trước khi gọi API để UI responsive hơn
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      return updated;
    });

    // Force re-render
    setForceUpdateCount(prev => prev + 1);

    // Sau đó gọi API
    try {
      const success = await notificationService.markAsRead(id);

      if (!success) {
        // Nếu API fail, revert lại state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, read: false } : notif
          )
        );
      }
    } catch (error) {
      // Revert state nếu có lỗi
      setNotifications(prev => 
        prev.map(notif =>
          notif.id === id ? { ...notif, read: false } : notif
        )
      );
      logger.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // Mark locally first, then sync with backend
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    await notificationService.markAllAsRead();
  };

  const deleteNotification = async (id: number) => {
    await notificationService.deleteNotification(id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateNotificationSettings = () => {
    // Update WebSocket subscriptions based on new settings
    websocketService.updateSubscriptions();
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    updateNotificationSettings
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
