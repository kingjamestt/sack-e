import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/notifications';

/**
 * Initiates a ticket transfer to a specific email address.
 * 
 * @param ticketId - The ID of the ticket to transfer.
 * @param ticketStatus - The current status of the ticket (e.g., 'valid', 'scanned').
 * @param eventStatus - The current status of the event (e.g., 'active', 'cancelled').
 * @param transferEmail - The email address of the recipient.
 * @returns A promise that resolves when the transfer is successfully initiated.
 * @throws Will throw an error if the ticket is already used or the event is cancelled.
 */
export async function transferTicket(ticketId: string, ticketStatus: string, eventStatus: string | undefined, transferEmail: string): Promise<void> {
  if (ticketStatus === 'scanned' || ticketStatus === 'used') {
    throw new Error('Cannot transfer a used ticket.');
  }
  if (eventStatus === 'cancelled') {
    throw new Error('Cannot transfer a ticket for a cancelled event.');
  }
  
  const ticketRef = doc(db, 'tickets', ticketId);
  const updatedEmail = transferEmail.toLowerCase().trim();
  await updateDoc(ticketRef, {
    transfer_pending_to: updatedEmail
  });

  // Try to find the user with this email and send them a notification
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', updatedEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const recipientId = querySnapshot.docs[0].id;
      await createNotification(recipientId, {
        title: 'Ticket Transfer',
        message: 'You have been sent a ticket!',
        type: 'ticket_transfer',
        link: `/tickets/transfer/${ticketId}`
      });
    }
  } catch (notifErr) {
    console.error('Error sending notification:', notifErr);
    // Continue even if notification fails
  }
}

/**
 * Cancels a pending ticket transfer.
 * 
 * @param ticketId - The ID of the ticket with the pending transfer.
 * @returns A promise that resolves when the transfer is successfully cancelled.
 */
export async function cancelTicketTransfer(ticketId: string): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  await updateDoc(ticketRef, {
    transfer_pending_to: null
  });
}

/**
 * Verifies and uses a ticket by marking it as scanned.
 * 
 * @param ticketId - The ID of the ticket being scanned.
 * @param eventId - The ID of the event the scanner is verifying for.
 * @param userId - The ID of the user (scanner) who is verifying the ticket.
 * @param scannedOwnerId - (Optional) The owner ID extracted from the QR code.
 * @returns A promise that resolves to the scan result, containing validity, data, and a message.
 * @throws Will throw an error if the ticket is not found, doesn't match the event, or is locked.
 */
export async function verifyAndUseTicket(ticketId: string, eventId: string, userId: string, scannedOwnerId?: string) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const ticketSnap = await getDoc(ticketRef);
  
  if (!ticketSnap.exists()) {
    throw new Error('Ticket not found in database.');
  }
  
  const tData = ticketSnap.data();
  
  if (tData.eventId !== eventId) {
    throw new Error('Ticket does not match this event.');
  }

  // Validate owner ID if provided by the QR code
  if (scannedOwnerId && tData.owner_id && tData.owner_id !== scannedOwnerId) {
    throw new Error('Invalid or outdated ticket QR code. This ticket may have been transferred.');
  }

  if (tData.transfer_pending_to) {
    throw new Error('Ticket is locked pending a transfer.');
  }

  if (tData.status === 'scanned' || tData.status === 'used') {
    return {
      valid: false,
      data: tData,
      message: 'TICKET ALREADY SCANNED'
    };
  } else {
    // valid, mark as scanned/used
    await updateDoc(ticketRef, {
      status: 'used',
      scannedAt: new Date().toISOString(),
      scannedBy: userId
    });
    
    return {
      valid: true,
      data: { ...tData, status: 'used' },
      message: 'VALID!'
    };
  }
}

/**
 * Accepts a pending ticket transfer.
 * 
 * @param ticketId - The ID of the ticket to accept.
 * @param userId - The ID of the user accepting the ticket.
 * @param userEmail - The email of the user accepting the ticket (must match `transfer_pending_to`).
 * @returns A promise that resolves when the ticket has been successfully accepted.
 * @throws Will throw an error if the ticket is not found, or if the email doesn't match.
 */
export async function acceptTicketTransfer(ticketId: string, userId: string, userEmail: string): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const ticketSnap = await getDoc(ticketRef);
  
  if (!ticketSnap.exists()) {
    throw new Error('Ticket not found.');
  }
  
  const data = ticketSnap.data();
  
  if (!data.transfer_pending_to || data.transfer_pending_to !== userEmail.toLowerCase()) {
    throw new Error('This ticket is not pending transfer to your email address.');
  }
  
  await updateDoc(ticketRef, {
    owner_id: userId,
    transfer_pending_to: null,
    // Add a record of who transferred it if needed, but for now just updating owner is enough
  });
}
