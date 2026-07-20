'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { faker } from '@faker-js/faker';

export default function SeedPage() {
  const [status, setStatus] = useState('Idle');

  const seedDatabase = async () => {
    setStatus('Seeding...');
    try {
      const eventsRef = collection(db, 'events');

      for (let i = 0; i < 20; i++) {
        // Generate an event date in the future (sorted closest first later)
        const date = faker.date.soon({ days: 90 });
        
        const eventDoc = await addDoc(eventsRef, {
          title: faker.music.songName() + ' ' + faker.helpers.arrayElement(['Festival', 'Concert', 'Live', 'Experience']),
          date: date.toISOString(),
          description: faker.lorem.paragraph(),
          location: faker.location.streetAddress() + ', ' + faker.location.city(),
          imageUrl: faker.image.urlLoremFlickr({ category: 'concert,neon,party' }),
          organizerId: 'system',
          createdAt: new Date().toISOString(),
          status: 'active'
        });

        // Add Ticket Tiers subcollection
        const tiersRef = collection(db, `events/${eventDoc.id}/ticketTiers`);
        
        await addDoc(tiersRef, {
          name: 'Early Bird',
          price: parseFloat(faker.commerce.price({ min: 20, max: 50 })),
          inventory: 100,
          sold: 0
        });

        await addDoc(tiersRef, {
          name: 'General Admission',
          price: parseFloat(faker.commerce.price({ min: 60, max: 120 })),
          inventory: 500,
          sold: 0
        });

        await addDoc(tiersRef, {
          name: 'VIP',
          price: parseFloat(faker.commerce.price({ min: 150, max: 300 })),
          inventory: 50,
          sold: 0
        });
      }

      setStatus('Seeding Complete! 20 Events created.');
    } catch (err) {
      const error = err as Error;
      console.error('Error seeding data:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-12 pt-24 md:pt-32">
      <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
      <button 
        onClick={seedDatabase}
        className="px-6 py-2 bg-primary text-on-primary font-bold rounded"
      >
        Seed Events & Ticket Tiers
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}
