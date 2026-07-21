import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
      
      // If API key is configured, optionally validate the hash to prevent fake success redirects
      // Note: Finalization is handled securely by the webhook, so this is just for UI redirect correctness.
      if (apiKey && hash && transaction_id && total) {
        const hashString = `${transaction_id}${total}${apiKey}`;
        const calculatedHash = crypto.createHash('md5').update(hashString).digest('hex');
        
        if (calculatedHash !== hash) {
          console.error("WiPay Hash mismatch in callback! Potential spoofing attempt.");
          return NextResponse.redirect(`${origin}/checkout/callback?status=failed&error=invalid_hash`);
        }
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

