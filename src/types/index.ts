export interface EventData {
  id: string;
  title: string;
  date: string;
  time?: string;
  description: string;
  location: string;
  imageUrl: string;
  organizerId: string;
  createdAt: string;
  status: string;
  price?: string;
  salesStartDateTime?: string;
  salesPaused?: boolean;
  isFeatured?: boolean;
  organizerName?: string;
  requiresApproval?: boolean;
}

export interface TicketData {
  id: string;
  eventId: string;
  tierId: string;
  name: string;
  quantity: number;
  status: string;
  owner_id?: string;
  transfer_pending_to?: string;
  createdAt: string;
  eventDetails?: {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl: string;
    status?: string;
  };
}

export type NotificationType = 'ticket_transfer' | 'approval_request' | 'system' | 'team_invite';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedDocId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export type TeamRole = 'owner' | 'admin' | 'scanner' | 'committee';

export interface TeamMember {
  id: string;
  email: string;
  role: TeamRole;
  status: 'pending' | 'active' | 'requested';
  userId?: string;
  createdAt: string;
}

export interface ReservationData {
  id?: string;
  userId: string;
  eventId: string;
  status: 'requested' | 'approved' | 'paid';
  committeeMemberId?: string;
  items: { tierId: string; quantity: number; price: number; name: string }[];
  totalAmount: number;
  createdAt: string;
  eventDetails?: {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl?: string;
  };
}

export interface UserData {
  id?: string;
  name: string;
  email: string;
  role: string;
  photoURL?: string;
  createdAt?: string;
}
