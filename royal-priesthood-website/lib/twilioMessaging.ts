import { TwilioConfigStatus } from '@/lib/adminTypes';

function getTwilioSettings() {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  const fromNumber = process.env.VONAGE_FROM;

  return {
    apiKey,
    apiSecret,
    fromNumber,
  };
}

export function getTwilioConfigStatus(): TwilioConfigStatus {
  const settings = getTwilioSettings();
  const missing: string[] = [];

  if (!settings.apiKey) {
    missing.push('VONAGE_API_KEY');
  }

  if (!settings.fromNumber) {
    missing.push('VONAGE_FROM');
  }

  if (!settings.apiSecret) {
    missing.push('VONAGE_API_SECRET');
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}

function getVonageRequestPayload(input: { to: string; body: string }) {
  const settings = getTwilioSettings();
  const status = getTwilioConfigStatus();

  if (!status.configured || !settings.apiKey || !settings.apiSecret || !settings.fromNumber) {
    throw new Error(`Vonage is not fully configured. Missing: ${status.missing.join(', ')}`);
  }

  const formPayload = new URLSearchParams({
    api_key: settings.apiKey,
    api_secret: settings.apiSecret,
    to: input.to,
    from: settings.fromNumber,
    text: input.body,
  });

  return formPayload;
}

export async function sendSmsMessage(input: { to: string; body: string }) {
  const payload = getVonageRequestPayload(input);
  const response = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    throw new Error(`Vonage HTTP error: ${response.status}`);
  }

  const result = (await response.json()) as {
    messages?: Array<{
      status?: string;
      'message-id'?: string;
      'error-text'?: string;
    }>;
  };

  const firstMessage = result.messages?.[0];

  if (!firstMessage) {
    throw new Error('Vonage returned no message result.');
  }

  if (firstMessage.status !== '0') {
    throw new Error(firstMessage['error-text'] ?? `Vonage send failed with status ${firstMessage.status}`);
  }

  return {
    sid: firstMessage['message-id'] ?? 'vonage-message',
    status: 'sent',
  };
}
