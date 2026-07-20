import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  return handleWiPayCallback(req);
}

export async function GET(req: Request) {
  return handleWiPayCallback(req);
}

async function handleWiPayCallback(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;
    
    let data: Record<string, any> = {};
    if (req.method === 'POST') {
      const text = await req.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) {
        data[key] = value;
      }
    } else {
      for (const [key, value] of url.searchParams.entries()) {
        data[key] = value;
      }
    }

    const { status, order_id, transaction_id, hash, total } = data;
    
    // Validate required fields
    if (!order_id || !status) {
      return NextResponse.redirect(`${origin}/checkout/callback?status=failed`);
    }

    if (status === 'success' || status === 'approved') {
      const apiKey = process.env.WIPAY_API_KEY;
      
      // If API key is configured, validate the hash
      if (apiKey && hash && transaction_id && total) {
        // Example WiPay hash validation: md5(transaction_id + total + api_key)
        // Adjust the concatenation string based on exact WiPay version documentation
        const hashString = `${transaction_id}${total}${apiKey}`;
        const calculatedHash = crypto.createHash('md5').update(hashString).digest('hex');
        
        if (calculatedHash !== hash) {
          console.error("WiPay Hash mismatch! Potential spoofing attempt.");
          return NextResponse.redirect(`${origin}/checkout/callback?status=failed&error=invalid_hash`);
        }
      } else if (process.env.NODE_ENV === 'production' && !apiKey) {
        console.warn("WIPAY_API_KEY is not set in production! Payment validation is bypassed (DANGEROUS).");
      }

      // Finalize the reservation securely on the server
      const parts = order_id.split('_');
      if (parts.length >= 2) {
        const eventId = parts[0];
        const resId = parts[1];
        
        await finalizeReservationAdmin(eventId, resId, transaction_id);
      }

      return NextResponse.redirect(`${origin}/checkout/callback?status=success&order_id=${order_id}&transaction_id=${transaction_id || 'UNKNOWN'}`);
    } else {
      return NextResponse.redirect(`${origin}/checkout/callback?status=failed&order_id=${order_id}`);
    }
  } catch (error) {
    console.error("Error in WiPay Webhook:", error);
    const url = new URL(req.url);
    return NextResponse.redirect(`${url.origin}/checkout/callback?status=failed`);
  }
}

async function finalizeReservationAdmin(eventId: string, reservationId: string, transactionId?: string) {
  const reservationRef = adminDb.doc(`events/${eventId}/reservations/${reservationId}`);
  
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
    
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
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
      transactionId: transactionId || null,
      completedAt: FieldValue.serverTimestamp()
    });
  });
}
