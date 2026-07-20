import { db } from './firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { EventData } from '@/types';

/**
 * Generates an SEO-friendly URL for an event.
 * Format: /events/slugified-title-eventID
 */
export function getEventLink(event: { id: string; title: string }) {
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `/events/${slug}-${event.id}`;
}

/**
 * Extracts the raw Firebase event ID from a slugified URL parameter.
 * e.g. "my-cool-event-abc123" -> "abc123"
 */
export function extractEventId(sluggedId: string) {
  const parts = sluggedId.split('-');
  // Firebase IDs are exactly 20 chars long usually, but to be safe we just take the last part.
  return parts.length > 1 ? parts.pop()! : sluggedId;
}

const EVENTS_PER_PAGE = 9;

/**
 * Retrieves a paginated list of active events, ordered by date ascending (closest first).
 * Optionally computes the lowest available ticket price for each event.
 * 
 * @param lastDoc - The last document snapshot from the previous query page, used for pagination. If null or undefined, fetches the first page.
 * @returns An object containing an array of `EventData` and the `lastVisible` document snapshot for the next pagination query.
 * @throws Will throw an error if Firestore queries fail.
 */
export async function getEvents(lastDoc?: QueryDocumentSnapshot<DocumentData> | null) {
  const eventsRef = collection(db, 'events');
  let q;

  const nowString = new Date().toISOString();

  // Closest first means ascending by date
  // Also only fetch active events that are >= now
  if (lastDoc) {
    q = query(eventsRef, where('status', '==', 'active'), where('date', '>=', nowString), orderBy('date', 'asc'), startAfter(lastDoc), limit(EVENTS_PER_PAGE));
  } else {
    q = query(eventsRef, where('status', '==', 'active'), where('date', '>=', nowString), orderBy('date', 'asc'), limit(EVENTS_PER_PAGE));
  }

  const snapshot = await getDocs(q);
  
  const events: EventData[] = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    
    /** 
     * Internal Logic: Fetch the lowest ticket tier price for the event to display a "starting at" price.
     * Iterates through all ticket tiers for the event to find the minimum price.
     */
    // Fetch lowest ticket tier price
    const { collection: fsCollection, getDocs: fsGetDocs } = await import('firebase/firestore');
    const tiersRef = fsCollection(db, `events/${doc.id}/ticketTiers`);
    const tiersSnap = await fsGetDocs(tiersRef);
    let minPrice = Infinity;
    tiersSnap.forEach(tierDoc => {
      const price = tierDoc.data().price;
      if (typeof price === 'number' && price < minPrice) {
        minPrice = price;
      }
    });

    const priceString = minPrice !== Infinity ? `$${minPrice.toFixed(2)}` : 'TBA';

    return {
      id: doc.id,
      title: data.title,
      date: data.date,
      time: data.time,
      description: data.description,
      location: data.location,
      imageUrl: data.imageUrl,
      organizerId: data.organizerId,
      createdAt: data.createdAt,
      status: data.status,
      price: priceString,
      salesPaused: data.salesPaused,
      organizerName: data.organizerName
    };
  }));

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { events, lastVisible };
}

/**
 * Represents a specific tier or type of ticket available for an event (e.g., General Admission, VIP).
 */
export interface TicketTier {
  id: string;
  name: string;
  price: number;
  inventory: number;
  sold: number;
  reserved: number;
  expiresAt?: string;
  salesPaused?: boolean;
}

/**
 * Retrieves up to 5 featured active events.
 * If no events are marked as featured, it falls back to fetching the 3 closest active events by date.
 * 
 * @returns A promise that resolves to an array of featured or fallback `EventData` objects.
 * @throws Will throw an error if Firestore queries fail.
 */
export async function getFeaturedEvents() {
  const eventsRef = collection(db, 'events');
  // Query active events that are featured
  const q = query(
    eventsRef, 
    where('status', '==', 'active'),
    where('isFeatured', '==', true),
    limit(5)
  );

  const snapshot = await getDocs(q);
  
  const nowString = new Date().toISOString();

  let events: EventData[] = snapshot.docs.map(doc => {
    return { id: doc.id, ...doc.data() } as EventData;
  });

  // Filter out past events in memory to avoid needing a new composite index for isFeatured + date
  events = events.filter(event => event.date >= nowString);

  // If no featured events, fetch the closest 3 active events as fallback
  if (events.length === 0) {
    const fallbackQ = query(eventsRef, where('status', '==', 'active'), where('date', '>=', nowString), orderBy('date', 'asc'), limit(3));
    const fallbackSnap = await getDocs(fallbackQ);
    return fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventData));
  }

  return events;
}

/**
 * Fetches a single event by its unique ID.
 * 
 * @param id - The unique identifier of the event to retrieve.
 * @returns A promise that resolves to the `EventData` if found, or `null` if the event does not exist.
 * @throws Will throw an error if the Firestore `getDoc` operation fails.
 */
export async function getEvent(id: string): Promise<EventData | null> {
  const { doc, getDoc } = await import('firebase/firestore');
  const eventRef = doc(db, 'events', id);
  const snapshot = await getDoc(eventRef);
  
  if (!snapshot.exists()) return null;
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    date: data.date,
    time: data.time,
    description: data.description,
    location: data.location,
    imageUrl: data.imageUrl,
    organizerId: data.organizerId,
    createdAt: data.createdAt,
    status: data.status,
    salesStartDateTime: data.salesStartDateTime,
    salesPaused: data.salesPaused,
    organizerName: data.organizerName,
  };
}

/**
 * Retrieves all ticket tiers associated with a specific event, sorted by price in ascending order.
 * 
 * @param eventId - The unique identifier of the event.
 * @returns A promise that resolves to an array of `TicketTier` objects.
 * @throws Will throw an error if the Firestore `getDocs` operation fails.
 */
export async function getTicketTiers(eventId: string): Promise<TicketTier[]> {
  const { collection, getDocs } = await import('firebase/firestore');
  const tiersRef = collection(db, `events/${eventId}/ticketTiers`);
  const snapshot = await getDocs(tiersRef);
  
  const tiers: TicketTier[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    tiers.push({
      id: doc.id,
      name: data.name,
      price: data.price,
      inventory: data.inventory,
      sold: data.sold,
      reserved: data.reserved || 0,
      expiresAt: data.expiresAt,
      salesPaused: data.salesPaused,
    });
  });
  
  // Sort by price ascending
  return tiers.sort((a, b) => a.price - b.price);
}

/**
 * Represents an item selected by a user to be added to their cart for purchase.
 */
export interface CartItem {
  tierId: string;
  quantity: number;
  name: string;
  price: number;
}

/**
 * Initiates a transaction to reserve tickets for a user, ensuring inventory is available.
 * Temporarily holds the tickets for 15 minutes by creating a reservation document and updating the reserved count.
 * 
 * @param eventId - The unique identifier of the event.
 * @param items - An array of `CartItem` objects representing the requested tickets and quantities.
 * @param userId - The unique identifier of the user making the reservation.
 * @returns A promise that resolves to the newly created reservation document's ID.
 * @throws Will throw an error if the event/tier doesn't exist, sales are paused, or there is insufficient inventory.
 */
export async function reserveTickets(eventId: string, items: CartItem[], userId: string): Promise<string> {
  const { doc, collection, runTransaction, serverTimestamp } = await import('firebase/firestore');
  
  const reservationRef = doc(collection(db, `events/${eventId}/reservations`));
  
  await runTransaction(db, async (transaction) => {
    /**
     * Internal Logic Step 1: Read Phase
     * Read the event document and all requested tier documents first.
     * This ensures we avoid "read after write" errors within the Firestore transaction.
     * Validates that the event and tiers exist and that sales are not paused.
     */
    // 1. Read all tier documents and event document first to avoid "read after write" in the transaction
    const eventDocRef = doc(db, 'events', eventId);
    const eventDoc = await transaction.get(eventDocRef);
    if (!eventDoc.exists()) throw new Error("Event does not exist.");
    if (eventDoc.data().salesPaused) throw new Error("Sales for this event are temporarily paused.");
    
    const tierDocs = [];
    let subtotal = 0;
    
    for (const item of items) {
      if (item.quantity <= 0) continue;
      
      const tierRef = doc(db, `events/${eventId}/ticketTiers/${item.tierId}`);
      const tierDoc = await transaction.get(tierRef);
      if (!tierDoc.exists()) {
        throw new Error(`Ticket tier ${item.name} does not exist!`);
      }
      if (tierDoc.data().salesPaused) {
        throw new Error(`Sales for ticket tier ${item.name} are temporarily paused.`);
      }
      tierDocs.push({ ref: tierRef, doc: tierDoc, requestQuantity: item.quantity, price: item.price });
      subtotal += item.price * item.quantity;
    }
    
    if (tierDocs.length === 0) {
      throw new Error("No tickets selected.");
    }

    /**
     * Internal Logic Step 2: Validation Phase
     * Iterates through all requested tiers to verify that the requested quantity
     * does not exceed the remaining available inventory (inventory - sold - reserved).
     */
    // 2. Validate all quantities
    for (const tier of tierDocs) {
      const data = tier.doc.data();
      const inventory = data.inventory || 0;
      const sold = data.sold || 0;
      const reserved = data.reserved || 0;
      
      if (inventory - (sold + reserved) < tier.requestQuantity) {
        throw new Error(`Not enough tickets available for ${data.name}.`);
      }
    }
    
    /**
     * Internal Logic Step 3: Write Phase
     * Updates the `reserved` count for each ticket tier to hold the tickets.
     * Creates a new pending reservation document that expires in 15 minutes.
     */
    // 3. Write updates
    for (const tier of tierDocs) {
      const data = tier.doc.data();
      const reserved = data.reserved || 0;
      transaction.update(tier.ref, { reserved: reserved + tier.requestQuantity });
    }
    
    // Create reservation document
    const expiresAtDate = new Date();
    expiresAtDate.setMinutes(expiresAtDate.getMinutes() + 15);
    
    transaction.set(reservationRef, {
      userId,
      items: items.map(item => ({ tierId: item.tierId, quantity: item.quantity, name: item.name, price: item.price })),
      total: subtotal * 1.07,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: expiresAtDate.toISOString()
    });
  });
  
  return reservationRef.id;
}

/**
 * Requests tickets requiring committee approval. Does not reserve inventory.
 */
export async function requestTickets(eventId: string, items: CartItem[], userId: string, committeeMemberId: string): Promise<string> {
  const { doc, collection, serverTimestamp, getDoc } = await import('firebase/firestore');
  
  const eventDocRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventDocRef);
  if (!eventDoc.exists()) throw new Error("Event does not exist.");
  if (eventDoc.data().salesPaused) throw new Error("Sales for this event are temporarily paused.");
  
  let subtotal = 0;
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const tierRef = doc(db, `events/${eventId}/ticketTiers/${item.tierId}`);
    const tierDoc = await getDoc(tierRef);
    if (!tierDoc.exists()) throw new Error(`Ticket tier ${item.name} does not exist!`);
    if (tierDoc.data().salesPaused) throw new Error(`Sales for ticket tier ${item.name} are temporarily paused.`);
    subtotal += item.price * item.quantity;
  }
  
  if (subtotal === 0) throw new Error("No tickets selected.");

  const reservationRef = doc(collection(db, `events/${eventId}/reservations`));
  
  const { setDoc } = await import('firebase/firestore');
  await setDoc(reservationRef, {
    userId,
    eventId,
    committeeMemberId,
    items: items.map(item => ({ tierId: item.tierId, quantity: item.quantity, name: item.name, price: item.price })),
    totalAmount: subtotal * 1.07,
    status: 'requested',
    createdAt: serverTimestamp()
  });
  
  return reservationRef.id;
}


/**
 * Releases previously reserved tickets back to the available inventory if the reservation expires or is cancelled.
 * Marks the reservation status as 'expired'.
 * 
 * @param eventId - The unique identifier of the event.
 * @param reservationId - The unique identifier of the reservation to be released.
 * @throws Will throw an error if the Firestore transaction fails.
 */
export async function releaseTickets(eventId: string, reservationId: string): Promise<void> {
  const { doc, runTransaction } = await import('firebase/firestore');
  
  const reservationRef = doc(db, `events/${eventId}/reservations/${reservationId}`);
  
  await runTransaction(db, async (transaction) => {
    const resDoc = await transaction.get(reservationRef);
    if (!resDoc.exists()) return;
    
    const resData = resDoc.data();
    if (resData.status !== 'pending') return; // Already completed or expired
    
    /**
     * Internal Logic: Read Phase
     * Fetch the reservation document and confirm it is still 'pending'.
     * Retrieve all associated ticket tier documents to prepare for inventory adjustments.
     */
    // Read all tier documents first
    const items = resData.items || [];
    const tierDocs = [];
    for (const item of items) {
      const tierRef = doc(db, `events/${eventId}/ticketTiers/${item.tierId}`);
      const tierDoc = await transaction.get(tierRef);
      if (tierDoc.exists()) {
        tierDocs.push({ ref: tierRef, doc: tierDoc, quantity: item.quantity });
      }
    }
    
    /**
     * Internal Logic: Write Phase
     * Decrement the `reserved` count for each ticket tier by the quantity held in the reservation.
     * Update the reservation status to 'expired'.
     */
    // Update reservations
    for (const tier of tierDocs) {
      const data = tier.doc.data();
      const reserved = data.reserved || 0;
      if (reserved >= tier.quantity) {
        transaction.update(tier.ref, { reserved: reserved - tier.quantity });
      } else {
        // Fallback in case of data inconsistency
        transaction.update(tier.ref, { reserved: 0 });
      }
    }
    
    transaction.update(reservationRef, { status: 'expired' });
  });
}

/**
 * Finalizes a pending reservation after successful payment.
 * Deducts the reserved quantity, increments the sold quantity, generates individual ticket documents, 
 * calculates fees and revenue shares, and marks the reservation as 'completed'.
 * 
 * @param eventId - The unique identifier of the event.
 * @param reservationId - The unique identifier of the reservation to be finalized.
 * @throws Will throw an error if the Firestore transaction fails or if data is inconsistent.
 */
export async function finalizeReservation(eventId: string, reservationId: string): Promise<void> {
  const { doc, runTransaction } = await import('firebase/firestore');
  
  const reservationRef = doc(db, `events/${eventId}/reservations/${reservationId}`);
  
  await runTransaction(db, async (transaction) => {
    const resDoc = await transaction.get(reservationRef);
    if (!resDoc.exists()) return;
    
    const resData = resDoc.data();
    if (resData.status !== 'pending' && resData.status !== 'approved') return; // Already completed or expired
    
    const isApprovedRequest = resData.status === 'approved';
    
    /**
     * Internal Logic: Fee Calculation
     * Computes platform and payment processor fees.
     * - Sack-E Online Fee: 4%
     * - BSWeb Fee (Stripe/Payment): 1.5%
     * Organizers receive the remainder.
     */
    const totalRevenue = resData.total || 0;
    const items = resData.items || [];
    
    // Organizer gets 100% of the base ticket price, Sack-E gets the 7% markup.
    const organizerShare = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const sackeFee = totalRevenue - organizerShare;
    const bswebFee = 0;
    
    /**
     * Internal Logic: Read Phase
     * Retrieve all associated ticket tier documents corresponding to the items in the reservation.
     */
    // Read all tier documents first
    const tierDocs = [];
    for (const item of items) {
      const tierRef = doc(db, `events/${eventId}/ticketTiers/${item.tierId}`);
      const tierDoc = await transaction.get(tierRef);
      if (tierDoc.exists()) {
        tierDocs.push({ ref: tierRef, doc: tierDoc, quantity: item.quantity });
      }
    }
    
    /**
     * Internal Logic: Write Phase - Update Inventory
     * For each ticket tier, convert the reserved tickets into sold tickets.
     * Decrements `reserved` and increments `sold`.
     */
    // If it's an approved request (not pre-reserved), check inventory first
    if (isApprovedRequest) {
      for (const tier of tierDocs) {
        const data = tier.doc.data();
        const inventory = data.inventory || 0;
        const sold = data.sold || 0;
        const reserved = data.reserved || 0;
        if (inventory - (sold + reserved) < tier.quantity) {
          throw new Error(`Not enough tickets available for ${data.name}.`);
        }
      }
    }

    // Update reservations and sold counts
    for (const tier of tierDocs) {
      const data = tier.doc.data();
      const reserved = data.reserved || 0;
      const sold = data.sold || 0;
      
      transaction.update(tier.ref, { 
        reserved: isApprovedRequest ? reserved : Math.max(0, reserved - tier.quantity),
        sold: sold + tier.quantity
      });
    }
    
    /**
     * Internal Logic: Write Phase - Generate Tickets
     * Create individual ticket documents for each unit purchased, associating them
     * with the buyer, the event, and the specific tier. Calculates per-ticket fees.
     */
    // Generate individual tickets
    const { collection, serverTimestamp } = await import('firebase/firestore');
    const ticketsCollectionRef = collection(db, 'tickets');
    
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const newTicketRef = doc(ticketsCollectionRef);
        transaction.set(newTicketRef, {
          eventId,
          reservationId,
          tierId: item.tierId,
          name: item.name,
          price: item.price,
          sackeFee: item.price * 0.07,
          bswebFee: 0,
          organizerShare: item.price,
          owner_id: resData.userId,
          status: 'active',
          createdAt: serverTimestamp()
        });
      }
    }
    
    transaction.update(reservationRef, { 
      status: 'completed',
      sackeFee,
      bswebFee,
      organizerShare,
      completedAt: serverTimestamp()
    });
  });
}

/**
 * Fetches all requested reservations for an event.
 */
export async function getRequestedReservations(eventId: string) {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const reservationsRef = collection(db, `events/${eventId}/reservations`);
  const q = query(reservationsRef, where('status', '==', 'requested'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      eventId: data.eventId,
      status: data.status,
      committeeMemberId: data.committeeMemberId,
      items: data.items || [],
      totalAmount: data.totalAmount || 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  });
}

/**
 * Approves a requested reservation, allowing the user to pay for it.
 */
export async function approveReservation(eventId: string, reservationId: string) {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const reservationRef = doc(db, `events/${eventId}/reservations/${reservationId}`);
  await updateDoc(reservationRef, {
    status: 'approved',
    approvedAt: serverTimestamp()
  });
}

/**
 * Rejects a requested reservation, effectively deleting or marking it rejected.
 */
export async function rejectReservation(eventId: string, reservationId: string) {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const reservationRef = doc(db, `events/${eventId}/reservations/${reservationId}`);
  await updateDoc(reservationRef, {
    status: 'rejected',
    rejectedAt: serverTimestamp()
  });
}

