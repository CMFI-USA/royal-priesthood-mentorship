'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminStateSnapshot, Person, RecipientMode } from '@/lib/adminTypes';

const EMPTY_STATE: AdminStateSnapshot = {
  people: [],
  messageHistory: [],
  twilio: {
    configured: false,
    missing: [],
  },
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AdminStateSnapshot>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isImportingPeople, setIsImportingPeople] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [personForm, setPersonForm] = useState({
    name: '',
    phoneNumber: '',
    type: 'mentee' as Person['type'],
  });
  const [messageForm, setMessageForm] = useState({
    author: 'Admin',
    message: '',
    recipientMode: 'all-mentees' as RecipientMode,
  });
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');

  const mentors = useMemo(
    () => snapshot.people.filter((person) => person.type === 'mentor'),
    [snapshot.people],
  );
  const mentees = useMemo(
    () => snapshot.people.filter((person) => person.type === 'mentee'),
    [snapshot.people],
  );
  const selectedRecipientSet = useMemo(() => new Set(selectedRecipientIds), [selectedRecipientIds]);
  const selectedRecipients = useMemo(
    () => snapshot.people.filter((person) => selectedRecipientSet.has(person.id)),
    [snapshot.people, selectedRecipientSet],
  );
  const filteredRecipients = useMemo(() => {
    const normalizedSearch = recipientSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return snapshot.people.slice(0, 100);
    }

    return snapshot.people
      .filter((person) => {
        const searchableText = `${person.name} ${person.phoneNumber} ${person.type}`.toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
      .slice(0, 100);
  }, [snapshot.people, recipientSearchTerm]);

  async function loadState() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/state', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Unable to load admin data.');
        return;
      }

      setSnapshot(payload.data);
    } catch {
      setError('Unable to load admin data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (messageForm.recipientMode !== 'selected') {
      setSelectedRecipientIds([]);
      setRecipientSearchTerm('');
    }
  }, [messageForm.recipientMode]);

  async function handleAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAddingPerson(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personForm),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Unable to add person.');
        return;
      }

      setSnapshot(payload.data);
      setPersonForm({ name: '', phoneNumber: '', type: 'mentee' });
      setFeedback('Person saved to the SQLite database.');
    } catch {
      setError('Unable to add person right now.');
    } finally {
      setIsAddingPerson(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot.twilio.configured) {
      setError(`SMS provider is not configured. Missing: ${snapshot.twilio.missing.join(', ')}`);
      return;
    }

    setIsSendingMessage(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...messageForm,
          selectedRecipientIds,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setSnapshot(payload.data ?? snapshot);
        setError(payload.error ?? 'Message delivery failed.');
        return;
      }

      setSnapshot(payload.data);
      setMessageForm((current) => ({ ...current, message: '' }));
      setSelectedRecipientIds([]);
      setFeedback(
        `Processed ${payload.summary.recipientCount} recipients: ${payload.summary.successCount} sent, ${payload.summary.failureCount} failed.`,
      );

      if (!payload.ok) {
        setError('Some messages failed. Review the history below for details.');
      }
    } catch {
      setError('Unable to send messages right now.');
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }

  async function handleImportPeople(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingPeople(true);
    setFeedback(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Unable to import CSV file.');
        return;
      }

      setSnapshot(payload.data);
      setFeedback(
        `Import complete: ${payload.summary.createdCount} created, ${payload.summary.updatedCount} updated, ${payload.summary.invalidCount} invalid rows.`,
      );
    } catch {
      setError('Unable to import CSV right now.');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }

      setIsImportingPeople(false);
    }
  }

  function toggleRecipient(personId: string) {
    setSelectedRecipientIds((current) =>
      current.includes(personId)
        ? current.filter((value) => value !== personId)
        : [...current, personId],
    );
  }

  function removeSelectedRecipient(personId: string) {
    setSelectedRecipientIds((current) => current.filter((value) => value !== personId));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Admin Portal</p>
            <h1 className="mt-3 text-4xl font-bold">Mentorship Operations</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">
              Manage the SQLite contact list, send SMS to mentors or mentees, and track message history.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Sign Out
          </button>
        </div>
      </section>

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!snapshot.twilio.configured ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">Vonage configuration is incomplete.</p>
          <p className="mt-2">Missing: {snapshot.twilio.missing.join(', ')}</p>
          <p className="mt-2">SMS sending will fail until these environment variables are configured.</p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Mentors</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{mentors.length}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Mentees</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{mentees.length}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Messages Logged</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{snapshot.messageHistory.length}</p>
        </article>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_1.4fr]">
        <form onSubmit={handleAddPerson} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Add Person</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use E.164 phone format, for example +15551234567.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
              <input
                value={personForm.name}
                onChange={(event) => setPersonForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Phone Number</span>
              <input
                value={personForm.phoneNumber}
                onChange={(event) =>
                  setPersonForm((current) => ({ ...current, phoneNumber: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="+15551234567"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
              <select
                value={personForm.type}
                onChange={(event) =>
                  setPersonForm((current) => ({
                    ...current,
                    type: event.target.value as Person['type'],
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="mentee">Mentee</option>
                <option value="mentor">Mentor</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={isAddingPerson}
            className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isAddingPerson ? 'Saving...' : 'Add to Admin Database'}
          </button>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">People</h2>
              <p className="mt-2 text-sm text-slate-600">Separate mentor and mentee lists with phone numbers.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/admin/export"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Export CSV
              </a>

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={isImportingPeople}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImportingPeople ? 'Importing...' : 'Import CSV'}
              </button>

              <button
                type="button"
                onClick={loadState}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportPeople}
            className="hidden"
          />

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading people...</p>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <PersonList title="Mentors" people={mentors} emptyText="No mentors added yet." />
              <PersonList title="Mentees" people={mentees} emptyText="No mentees added yet." />
            </div>
          )}
        </div>
      </section>

      <section>
        <form onSubmit={handleSendMessage} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Bulk SMS</h2>
          <p className="mt-2 text-sm text-slate-600">
            Send to all mentors, all mentees, or a hand-picked group.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Author</span>
              <input
                value={messageForm.author}
                onChange={(event) => setMessageForm((current) => ({ ...current, author: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            <fieldset>
              <legend className="mb-3 text-sm font-medium text-slate-700">Recipients</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <RecipientModeButton
                  label="All Mentees"
                  selected={messageForm.recipientMode === 'all-mentees'}
                  onClick={() => setMessageForm((current) => ({ ...current, recipientMode: 'all-mentees' }))}
                />
                <RecipientModeButton
                  label="All Mentors"
                  selected={messageForm.recipientMode === 'all-mentors'}
                  onClick={() => setMessageForm((current) => ({ ...current, recipientMode: 'all-mentors' }))}
                />
                <RecipientModeButton
                  label="Specific Group"
                  selected={messageForm.recipientMode === 'selected'}
                  onClick={() => setMessageForm((current) => ({ ...current, recipientMode: 'selected' }))}
                />
              </div>
            </fieldset>

            {messageForm.recipientMode === 'selected' ? (
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-700">Select Recipients</p>
                  <p className="text-xs text-slate-500">Selected: {selectedRecipientIds.length}</p>
                </div>

                <div className="mt-3">
                  <input
                    value={recipientSearchTerm}
                    onChange={(event) => setRecipientSearchTerm(event.target.value)}
                    placeholder="Search by name, phone, or role"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                {selectedRecipients.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRecipients.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => removeSelectedRecipient(person.id)}
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        {person.name} x
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-slate-200">
                  <div className="divide-y divide-slate-100">
                    {filteredRecipients.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => toggleRecipient(person.id)}
                        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                          selectedRecipientSet.has(person.id) ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <span>
                          <span className="block font-semibold text-slate-900">{person.name}</span>
                          <span className="mt-1 block text-xs uppercase tracking-[0.15em] text-slate-500">
                            {person.type}
                          </span>
                          <span className="mt-1 block text-slate-600">{person.phoneNumber}</span>
                        </span>
                        <span
                          className={`mt-1 rounded-full px-2 py-1 text-xs font-semibold ${
                            selectedRecipientSet.has(person.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {selectedRecipientSet.has(person.id) ? 'Selected' : 'Add'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
              <textarea
                value={messageForm.message}
                onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))}
                rows={6}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="Write the message to send..."
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSendingMessage || !snapshot.twilio.configured}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSendingMessage ? 'Sending...' : 'Send SMS'}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Message History</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every outbound message attempt is logged in SQLite with recipient and status.
        </p>

        {snapshot.messageHistory.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No messages have been sent yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Author</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Message</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Provider ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {snapshot.messageHistory.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-4 py-3 text-slate-600">{formatDate(entry.dateSent)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{entry.recipientName}</p>
                      <p className="text-xs text-slate-500">{entry.recipientPhoneNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.recipientType}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.author}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          entry.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.status}
                      </span>
                      {entry.error ? <p className="mt-2 text-xs text-red-600">{entry.error}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{entry.message}</td>
                    <td className="px-4 py-3 text-slate-500">{entry.twilioSid ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PersonList({
  title,
  people,
  emptyText,
}: {
  title: string;
  people: Person[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {people.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {people.map((person) => (
            <article key={person.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-semibold text-slate-900">{person.name}</p>
              <p className="mt-1 text-sm text-slate-600">{person.phoneNumber}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RecipientModeButton({
  label,
  onClick,
  selected,
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        selected
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

