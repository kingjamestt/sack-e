import crypto from 'crypto';
import 'dotenv/config';

async function simulateWiPayWebhook(eventId: string, reservationId: string) {
  const apiKey = process.env.WIPAY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ WIPAY_API_KEY is not set in .env.local');
    process.exit(1);
  }

  const transaction_id = `TEST_${Date.now()}`;
  const order_id = `${eventId}_${reservationId}`;
  const total = '1.00'; // $1 TTD micro-transaction test
  
  // Calculate the MD5 hash exactly as WiPay does
  const stringToHash = `${transaction_id}${total}${apiKey}`;
  const hash = crypto.createHash('md5').update(stringToHash).digest('hex');

  console.log(`\n🚀 Simulating WiPay Webhook for Order: ${order_id}`);
  console.log(`Computed Hash: ${hash}`);

  const payload = new URLSearchParams({
    status: 'success',
    transaction_id,
    order_id,
    total,
    hash
  });

  try {
    const response = await fetch('http://localhost:3000/api/wipay/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString()
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook Success! The backend accepted the payment.');
      console.log('Backend response:', data);
      console.log('\n✉️  Check your email for the Purchase Receipt!');
      console.log('🎟️  Check your /my-tickets page to see the locked QR code!');
    } else {
      console.error('❌ Webhook Failed:', data);
    }
  } catch (err) {
    console.error('❌ Connection error. Is your Next.js server running on port 3000?');
  }
}

// Read arguments from command line
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: npx tsx scripts/simulate_wipay.ts <eventId> <reservationId>');
  process.exit(1);
}

simulateWiPayWebhook(args[0], args[1]);
