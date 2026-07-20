import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import PurchaseReceipt from '@/emails/PurchaseReceipt';
import * as React from 'react';

// Make sure to set RESEND_API_KEY in your .env.local
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, customerName, eventName, eventDate, orderId, totalAmount, ticketCount } = body;

    if (!email || !eventName || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Attempt to send email
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Must use onboarding@resend.dev until domain is verified in Resend
      to: [email],
      subject: `Your Tickets for ${eventName}`,
      react: PurchaseReceipt({
        customerName,
        eventName,
        eventDate,
        orderId,
        totalAmount,
        ticketCount,
      }) as React.ReactElement,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
