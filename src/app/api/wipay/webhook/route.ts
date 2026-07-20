import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeReservation } from '@/lib/events';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    // Parse URL encoded body since WiPay usually sends application/x-www-form-urlencoded
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

    // Verify MD5 hash
    // md5(transaction_id + total + api_key)
    const stringToHash = `${transaction_id}${total}${apiKey}`;
    const calculatedHash = crypto.createHash('md5').update(stringToHash).digest('hex');

    if (calculatedHash !== hash) {
      console.error(`Hash mismatch. Expected ${calculatedHash}, got ${hash}`);
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    if (status !== 'success') {
      console.log(`Payment failed or cancelled for order ${order_id}`);
      return NextResponse.json({ message: 'Payment not successful' }, { status: 200 });
    }

    // Parse order_id which is `${eventId}_${reservationId}`
    const [eventId, reservationId] = order_id.split('_');

    if (!eventId || !reservationId) {
      console.error(`Invalid order_id format: ${order_id}`);
      return NextResponse.json({ error: 'Invalid order format' }, { status: 400 });
    }

    // Securely update the reservation and issue tickets
    await finalizeReservation(eventId, reservationId);
    
    console.log(`Successfully finalized reservation for order: ${order_id}`);
    
    // WiPay expects a 200 OK
    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
