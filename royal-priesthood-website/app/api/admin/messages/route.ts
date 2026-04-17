import { NextResponse } from 'next/server';

import { getCurrentAdminUser, isAdminAuthenticated } from '@/lib/adminAuth';
import { addMessageHistory, getRecipients, listMessageHistory, listPeople } from '@/lib/adminStore';
import { RecipientMode } from '@/lib/adminTypes';
import { getTwilioConfigStatus, sendSmsMessage } from '@/lib/twilioMessaging';

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const author = String(body.author ?? 'Admin').trim() || 'Admin';
  const message = String(body.message ?? '').trim();
  const recipientMode = body.recipientMode as RecipientMode;
  const selectedRecipientIds = Array.isArray(body.selectedRecipientIds)
    ? body.selectedRecipientIds.map((value: unknown) => String(value))
    : [];

  if (!message) {
    return NextResponse.json({ ok: false, error: 'Message is required.' }, { status: 400 });
  }

  if (!recipientMode || !['all-mentees', 'all-mentors', 'all', 'selected'].includes(recipientMode)) {
    return NextResponse.json({ ok: false, error: 'Recipient mode is invalid.' }, { status: 400 });
  }

  const providerStatus = getTwilioConfigStatus();

  if (!providerStatus.configured) {
    return NextResponse.json(
      {
        ok: false,
        error: `SMS provider is not configured. Missing: ${providerStatus.missing.join(', ')}`,
      },
      { status: 400 },
    );
  }

  const recipients = await getRecipients(recipientMode, selectedRecipientIds);

  if (recipients.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'No recipients matched the current selection.' },
      { status: 400 },
    );
  }

  const sentAt = new Date().toISOString();
  const deliveries = await Promise.all(
    recipients.map(async (recipient) => {
      try {
        const result = await sendSmsMessage({
          to: recipient.phoneNumber,
          body: message,
        });

        return {
          dateSent: sentAt,
          author,
          message,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientPhoneNumber: recipient.phoneNumber,
          recipientType: recipient.type,
          status: 'sent' as const,
          twilioSid: result.sid,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown SMS provider error';

        return {
          dateSent: sentAt,
          author,
          message,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientPhoneNumber: recipient.phoneNumber,
          recipientType: recipient.type,
          status: 'failed' as const,
          error: errorMessage,
        };
      }
    }),
  );

  const historyEntries = await addMessageHistory(deliveries);
  const successCount = historyEntries.filter((entry) => entry.status === 'sent').length;
  const failureCount = historyEntries.length - successCount;
  const responseStatus = 200;
  const currentUser = await getCurrentAdminUser();

  return NextResponse.json(
    {
      ok: failureCount === 0,
      summary: {
        recipientCount: historyEntries.length,
        successCount,
        failureCount,
      },
      data: {
        people: await listPeople(),
        messageHistory: await listMessageHistory(),
        twilio: getTwilioConfigStatus(),
        currentUserName: currentUser?.name ?? 'Admin',
      },
    },
    { status: responseStatus },
  );
}
