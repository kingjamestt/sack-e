import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'sackie-online'
  });
  console.log('Firebase Admin initialized.');
} catch (error) {
  console.error('Initialization error:', error);
}

const db = getFirestore();

async function updatePrices() {
  const eventsSnapshot = await db.collection('events').get();
  for (const eventDoc of eventsSnapshot.docs) {
    const tiersSnapshot = await eventDoc.ref.collection('ticketTiers').get();
    for (const tierDoc of tiersSnapshot.docs) {
      const tier = tierDoc.data();
      const name = tier.name.toLowerCase();
      let newPrice;
      
      if (name.includes('early bird')) {
        newPrice = Math.random() > 0.5 ? 100 : 150;
      } else if (name.includes('vip')) {
        const prices = [350, 400, 450, 500, 600, 750, 800, 1000, 1200, 1500];
        newPrice = prices[Math.floor(Math.random() * prices.length)];
      } else {
        const prices = [200, 250, 300, 350, 400];
        newPrice = prices[Math.floor(Math.random() * prices.length)];
      }
      
      await tierDoc.ref.update({ price: newPrice });
      console.log(`Updated event ${eventDoc.id} tier ${tierDoc.id} (${tier.name}) to $${newPrice}`);
    }
  }
  console.log('Done!');
}

updatePrices().catch(console.error);
