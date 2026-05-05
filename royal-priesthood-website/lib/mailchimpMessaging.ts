import { TwilioConfigStatus } from '@/lib/adminTypes';

function getMailchimpSettings() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const senderName = process.env.MAILCHIMP_SMS_FROM;

  return {
    apiKey,
    senderName,
  };
}

export function getMailchimpConfigStatus(): TwilioConfigStatus {
  const settings = getMailchimpSettings();
  const missing: string[] = [];

  if (!settings.apiKey) {
    missing.push('MAILCHIMP_API_KEY');
  }

  if (!settings.senderName) {
    missing.push('MAILCHIMP_SMS_FROM');
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}

export async function sendSmsMessage(input: { to: string; body: string }) {
  const settings = getMailchimpSettings();
  const status = getMailchimpConfigStatus();

  if (!status.configured || !settings.apiKey || !settings.senderName) {
    throw new Error(`Mailchimp is not fully configured. Missing: ${status.missing.join(', ')}`);
  }

  const response = await fetch('https://server.mailchimp.com/3.0/sms/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: settings.senderName,
      to: [
        {
          phone_number: input.to,
        },
      ],
      content: input.body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Mailchimp HTTP error: ${response.status} - ${errorData}`);
  }

  const result = (await response.json()) as {
    id?: string;
    status?: string;
    error?: string;
  };

  if (result.error) {
    throw new Error(`Mailchimp send failed: ${result.error}`);
  }

  return {
    sid: result.id ?? 'mailchimp-message',
    status: 'sent',
  };
}
