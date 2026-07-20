import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

import { TeamMember, TeamRole } from '@/types';

/**
 * Fetches all team members associated with a given event.
 * 
 * @param eventId - The unique identifier of the event.
 * @returns A promise that resolves to an array of `TeamMember` objects.
 * @throws Will throw an error if the Firestore query fails.
 */
export async function getTeamMembers(eventId: string): Promise<TeamMember[]> {
  const teamRef = collection(db, 'events', eventId, 'team');
  const snapshot = await getDocs(teamRef);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      role: data.role,
      status: data.status,
      userId: data.userId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as TeamMember;
  });
}

/**
 * Invites a new team member to an event by their email address.
 * Creates a pending team member record in the event's `team` subcollection.
 * 
 * @param eventId - The unique identifier of the event.
 * @param email - The email address of the user being invited.
 * @param role - The role assigned to the new team member.
 * @throws Will throw an error if the Firestore `setDoc` operation fails.
 */
export async function inviteTeamMember(eventId: string, email: string, role: TeamRole) {
  // Using email as the document ID for simplicity to avoid duplicate invites
  // In a real app, you might want to hash it or use auto-generated IDs
  const teamRef = doc(db, 'events', eventId, 'team', email.toLowerCase());
  
  await setDoc(teamRef, {
    email: email.toLowerCase(),
    role,
    status: 'pending',
    createdAt: serverTimestamp()
  });
  
  // Here you would typically trigger a cloud function to send an email invite,
  // or create a notification if the user with this email already exists.
}

/**
 * Updates the role of an existing team member for a specific event.
 * 
 * @param eventId - The unique identifier of the event.
 * @param memberId - The unique identifier (usually email) of the team member.
 * @param role - The new role to assign to the team member.
 * @throws Will throw an error if the Firestore `updateDoc` operation fails.
 */
export async function updateTeamMemberRole(eventId: string, memberId: string, role: TeamRole) {
  const memberRef = doc(db, 'events', eventId, 'team', memberId);
  await updateDoc(memberRef, { role });
}

/**
 * Removes a team member from a specific event by deleting their document from the `team` subcollection.
 * 
 * @param eventId - The unique identifier of the event.
 * @param memberId - The unique identifier (usually email) of the team member to remove.
 * @throws Will throw an error if the Firestore `deleteDoc` operation fails.
 */
export async function removeTeamMember(eventId: string, memberId: string) {
  const memberRef = doc(db, 'events', eventId, 'team', memberId);
  await deleteDoc(memberRef);
}

/**
 * Requests committee access for an event.
 */
export async function requestCommitteeAccess(eventId: string, email: string, userId: string) {
  const teamRef = doc(db, 'events', eventId, 'team', email.toLowerCase());
  
  await setDoc(teamRef, {
    email: email.toLowerCase(),
    role: 'committee', // Default role when requested
    status: 'requested',
    userId,
    createdAt: serverTimestamp()
  });
}

/**
 * Updates the status of an existing team member.
 */
export async function updateTeamMemberStatus(eventId: string, memberId: string, status: 'active' | 'pending' | 'requested') {
  const memberRef = doc(db, 'events', eventId, 'team', memberId);
  await updateDoc(memberRef, { status });
}
