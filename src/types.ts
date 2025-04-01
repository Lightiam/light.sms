
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at?: string;
}

export interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  optimalSendTime?: Date;
  averageResponseTime?: number;
  lastMessageHour?: number;
  messageOpenRate?: number;
  engagementScore?: number;
}

export interface ContactGroup {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface SmsMessage {
  id: string;
  contactId: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  contactGroupIds: string[];
  scheduledTime: string;
  useOptimalTime: boolean;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}
