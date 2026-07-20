import { initializeApp, applicationDefault, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Try to initialize firebase admin
let app;
try {
  // If serviceAccountKey.json exists, use it
  if (fs.existsSync(path.join(process.cwd(), 'serviceAccountKey.json'))) {
    const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  } else {
    // Otherwise use application default credentials (from gcloud auth)
    app = initializeApp({
      credential: applicationDefault(),
      projectId: 'sack-e',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  }
} catch (e) {
  if (!getApps().length) {
    console.error("Failed to initialize firebase-admin. Make sure you are authenticated.", e);
    process.exit(1);
  }
}

const db = getFirestore();
const bucket = getAdminStorage().bucket();

async function uploadImages() {
  console.log('📤 Uploading images to Firebase Storage...');
  const imagesDir = path.join(process.cwd(), 'public/images/events');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));
  
  const uploadMap = new Map<string, string>(); // Local filename -> Firebase Storage URL
  
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const destination = `events/system/${file}`;
    
    // Upload the file
    await bucket.upload(filePath, {
      destination,
      metadata: {
        contentType: 'image/jpeg',
      }
    });
    
    // Make the file publicly accessible
    await bucket.file(destination).makePublic();
    
    // Get the public URL
    const publicUrl = bucket.file(destination).publicUrl();
    console.log(`✅ Uploaded ${file} to ${publicUrl}`);
    uploadMap.set(file, publicUrl);
  }
  
  return uploadMap;
}

async function updateEvents(uploadMap: Map<string, string>) {
  console.log('\n📝 Updating Events in Firestore...');
  const snapshot = await db.collection('events').get();
  
  let updated = 0;
  for (const doc of snapshot.docs) {
    const event = doc.data();
    if (event.imageUrl && event.imageUrl.startsWith('/images/events/')) {
      const filename = path.basename(event.imageUrl);
      const newUrl = uploadMap.get(filename);
      if (newUrl) {
        await doc.ref.update({ imageUrl: newUrl });
        console.log(`✅ Updated event ${doc.id} with new URL`);
        updated++;
      }
    }
  }
  console.log(`Total events updated: ${updated}`);
}

async function generateAttendees() {
  console.log('\n🧑‍🤝‍🧑 Generating 15 Test Attendees...');
  const eventsSnapshot = await db.collection('events').get();
  const eventDocs = eventsSnapshot.docs;
  
  if (eventDocs.length === 0) {
    console.log('No events found to assign attendees to.');
    return;
  }

  let attendeesCreated = 0;
  for (let i = 0; i < 15; i++) {
    const userId = faker.string.uuid();
    const name = faker.person.fullName();
    const email = faker.internet.email();
    const photoURL = faker.image.avatar();

    // 1. Create User
    await db.collection('users').doc(userId).set({
      uid: userId,
      email: email,
      displayName: name,
      photoURL: photoURL,
      role: 'user',
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp()
    });
    
    // 2. Select a random event
    const randomEventDoc = eventDocs[Math.floor(Math.random() * eventDocs.length)];
    const eventId = randomEventDoc.id;
    const eventData = randomEventDoc.data();

    // 3. Create Reservation
    const reservationId = faker.string.uuid();
    await db.collection(`events/${eventId}/reservations`).doc(reservationId).set({
      userId,
      userEmail: email,
      userName: name,
      status: 'confirmed',
      ticketCount: 1,
      totalAmount: 1, // dummy amount
      createdAt: FieldValue.serverTimestamp()
    });

    // 4. Create Ticket
    const ticketId = faker.string.uuid();
    await db.collection('tickets').doc(ticketId).set({
      eventId,
      reservationId,
      owner_id: userId,
      status: 'active',
      qr_code: `sacke-${ticketId}-${Date.now()}`,
      purchase_date: FieldValue.serverTimestamp(),
      eventDetails: {
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        imageUrl: eventData.imageUrl // it will use the new Firebase Storage URL since we run this after updateEvents
      }
    });

    console.log(`✅ Created attendee ${name} and booked ticket for event: ${eventData.title}`);
    attendeesCreated++;
  }
  
  console.log(`\n🎉 Successfully flooded the live site with ${attendeesCreated} attendees!`);
}

async function run() {
  try {
    const uploadMap = await uploadImages();
    await updateEvents(uploadMap);
    await generateAttendees();
    process.exit(0);
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
}

run();
