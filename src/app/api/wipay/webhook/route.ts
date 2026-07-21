import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import PurchaseReceipt from '@/emails/PurchaseReceipt';
import * as React from 'react';
import { format, parseISO } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    
    const status = params.get('status');
    const transaction_id = params.get('transaction_id');
    const order_id = params.get('order_id');
    const total = params.get('total');
    const hash = params.get('hash');

    if (!status || !transaction_id || !order_id || !total || !hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.WIPAY_API_KEY;
    if (!apiKey) {
      console.error('WIPAY_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const stringToHash = `${transaction_id}${total}${apiKey}`;
    const calculatedHash = crypto.createHash('md5').update(stringToHash).digest('hex');

    if (calculatedHash !== hash) {
      console.error(`Hash mismatch. Expected ${calculatedHash}, got ${hash}`);
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    if (status !== 'success' && status !== 'approved') {
      console.log(`Payment failed or cancelled for order ${order_id}`);
      return NextResponse.json({ message: 'Payment not successful' }, { status: 200 });
    }

    const [eventId, reservationId] = order_id.split('_');

    if (!eventId || !reservationId) {
      console.error(`Invalid order_id format: ${order_id}`);
      return NextResponse.json({ error: 'Invalid order format' }, { status: 400 });
    }

    // Securely update the reservation and issue tickets
    await finalizeReservationAdmin(eventId, reservationId, transaction_id);
    
    console.log(`Successfully finalized reservation for order: ${order_id}`);
    
    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function finalizeReservationAdmin(eventId: string, reservationId: string, transactionId: string) {
  const reservationRef = adminDb.doc(`events/${eventId}/reservations/${reservationId}`);
  const eventRef = adminDb.doc(`events/${eventId}`);
  
  await adminDb.runTransaction(async (transaction) => {
    const resDoc = await transaction.get(reservationRef);
    if (!resDoc.exists) return;
    
    const resData = resDoc.data()!;
    if (resData.status !== 'pending' && resData.status !== 'approved') return;
    
    const isApprovedRequest = resData.status === 'approved';
    const totalRevenue = resData.total || resData.totalAmount || 0;
    const items = resData.items || [];
    
    const organizerShare = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const sackeFee = totalRevenue - organizerShare;
    const bswebFee = 0;
    
    const tierDocs = [];
    
    for (const item of items) {
      const tierRef = adminDb.doc(`events/${eventId}/ticketTiers/${item.tierId}`);
      const tierDoc = await transaction.get(tierRef);
      if (tierDoc.exists) {
        tierDocs.push({ ref: tierRef, doc: tierDoc, quantity: item.quantity });
      }
    }
    
    if (isApprovedRequest) {
      for (const tier of tierDocs) {
        const data = tier.doc.data()!;
        const inventory = data.inventory || 0;
        const sold = data.sold || 0;
        const reserved = data.reserved || 0;
        if (inventory - (sold + reserved) < tier.quantity) {
          throw new Error(`Not enough tickets available for ${data.name}.`);
        }
      }
    }

    for (const tier of tierDocs) {
      const data = tier.doc.data()!;
      const reserved = data.reserved || 0;
      const sold = data.sold || 0;
      
      transaction.update(tier.ref, { 
        reserved: isApprovedRequest ? reserved : Math.max(0, reserved - tier.quantity),
        sold: sold + tier.quantity
      });
    }
    
    const ticketsCollectionRef = adminDb.collection('tickets');
    let ticketCount = 0;
    
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        ticketCount++;
        const newTicketRef = ticketsCollectionRef.doc();
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
          createdAt: FieldValue.serverTimestamp()
        });
      }
    }
    
    transaction.update(reservationRef, { 
      status: 'completed',
      sackeFee,
      bswebFee,
      organizerShare,
      transactionId: transactionId,
      completedAt: FieldValue.serverTimestamp()
    });

    // Send Receipt Email
    try {
      const eventDoc = await transaction.get(eventRef);
      const userDoc = await transaction.get(adminDb.doc(`users/${resData.userId}`));
      
      if (eventDoc.exists && userDoc.exists) {
        const eventData = eventDoc.data()!;
        const userData = userDoc.data()!;
        
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: [userData.email],
          subject: `Your Tickets for ${eventData.title}`,
          react: PurchaseReceipt({
            customerName: userData.displayName || 'Customer',
            eventName: eventData.title,
            eventDate: eventData.date ? format(parseISO(eventData.date), 'MMM do, yyyy') : 'TBA',
            orderId: reservationId,
            totalAmount: `$${totalRevenue.toFixed(2)}`,
            ticketCount: ticketCount,
          }) as React.ReactElement,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send receipt email:", emailErr);
    }
  });
}
