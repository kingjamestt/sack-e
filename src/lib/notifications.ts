import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

import { NotificationData, NotificationType } from '@/types';

/**
 * Creates a new notification for a specific user in Firestore.
 * 
 * @param userId - The unique identifier of the user to receive the notification.
 * @param data - The notification details omitting auto-generated fields (`id`, `createdAt`, `read`).
 * @throws Will throw an error if the Firestore `addDoc` operation fails.
 */
export async function createNotification(userId: string, data: Omit<NotificationData, 'id' | 'createdAt' | 'read'>) {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Marks a specific notification as read for a given user.
 * 
 * @param userId - The unique identifier of the user who owns the notification.
 * @param notificationId - The unique identifier of the notification to be marked as read.
 * @throws Will throw an error if the Firestore `updateDoc` operation fails.
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Subscribes to a user's notifications in real-time. Listens for updates and triggers the callback.
 * Limits the results to the 50 most recent notifications, ordered by creation date descending.
 * 
 * @param userId - The unique identifier of the user whose notifications are being monitored.
 * @param callback - A function that is called with the updated array of `NotificationData` whenever a change occurs.
 * @returns An unsubscribe function that can be called to stop listening for updates.
 */
export function subscribeToNotifications(userId: string, callback: (notifications: NotificationData[]) => void) {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedDocId: data.relatedDocId,
        read: data.read || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as NotificationData;
    });
    callback(notifications);
  }, (error) => {
    console.error('Error subscribing to notifications:', error);
  });
}
