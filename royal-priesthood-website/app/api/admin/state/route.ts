import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/adminAuth';
import { listMessageHistory, listPeople } from '@/lib/adminStore';
import { getTwilioConfigStatus } from '@/lib/twilioMessaging';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      people: listPeople(),
      messageHistory: listMessageHistory(),
      twilio: getTwilioConfigStatus(),
    },
  });
}
