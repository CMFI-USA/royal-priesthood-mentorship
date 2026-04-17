import { NextResponse } from 'next/server';

import { getCurrentAdminUser, isAdminAuthenticated } from '@/lib/adminAuth';
import { listMessageHistory, listPeople } from '@/lib/adminStore';
import { getTwilioConfigStatus } from '@/lib/twilioMessaging';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await getCurrentAdminUser();

  return NextResponse.json({
    ok: true,
    data: {
      people: await listPeople(),
      messageHistory: await listMessageHistory(),
      twilio: getTwilioConfigStatus(),
      currentUserName: currentUser?.name ?? 'Admin',
    },
  });
}
