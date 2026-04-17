export type PersonType = 'mentor' | 'mentee';

export type Person = {
  id: string;
  name: string;
  phoneNumber: string;
  type: PersonType;
  createdAt: string;
};

export type MessageDeliveryStatus = 'sent' | 'failed';

export type MessageHistoryEntry = {
  id: string;
  dateSent: string;
  author: string;
  message: string;
  recipientId: string;
  recipientName: string;
  recipientPhoneNumber: string;
  recipientType: PersonType;
  status: MessageDeliveryStatus;
  twilioSid?: string;
  error?: string;
};

export type RecipientMode = 'all-mentees' | 'all-mentors' | 'selected';

export type TwilioConfigStatus = {
  configured: boolean;
  missing: string[];
};

export type AdminStateSnapshot = {
  people: Person[];
  messageHistory: MessageHistoryEntry[];
  twilio: TwilioConfigStatus;
};
