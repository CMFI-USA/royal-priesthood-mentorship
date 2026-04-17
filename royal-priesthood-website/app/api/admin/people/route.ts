import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/adminAuth';
import { addPerson, findPersonByPhoneNumber, listMessageHistory, listPeople } from '@/lib/adminStore';
import { PersonType } from '@/lib/adminTypes';
import { getTwilioConfigStatus } from '@/lib/twilioMessaging';

const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const phoneNumber = String(body.phoneNumber ?? '').trim();
  const type = body.type as PersonType;

  if (!name || !phoneNumber || !type) {
    return NextResponse.json(
      { ok: false, error: 'Name, phone number, and type are required.' },
      { status: 400 },
    );
  }

  if (type !== 'mentor' && type !== 'mentee') {
    return NextResponse.json({ ok: false, error: 'Invalid person type.' }, { status: 400 });
  }

  if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Phone number must be in E.164 format, for example +15551234567.',
      },
      { status: 400 },
    );
  }

  if (await findPersonByPhoneNumber(phoneNumber)) {
    return NextResponse.json(
      { ok: false, error: 'A person with this phone number already exists.' },
      { status: 409 },
    );
  }

  await addPerson({ name, phoneNumber, type });

  return NextResponse.json({
    ok: true,
    data: {
      people: await listPeople(),
      messageHistory: await listMessageHistory(),
      twilio: getTwilioConfigStatus(),
    },
  });
}
