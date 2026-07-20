import { useState, useEffect } from 'react';
import { subscribeToNotifications } from '@/lib/notifications';
import { NotificationData } from '@/types';

export function useNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToNotifications(userId, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [userId]);

  return notifications;
}
