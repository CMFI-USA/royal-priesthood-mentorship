'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminStateSnapshot, Person, RecipientMode } from '@/lib/adminTypes';

type PeopleSortField = 'name' | 'phoneNumber' | 'type';

const EMPTY_STATE: AdminStateSnapshot = {
  people: [],
  messageHistory: [],
  twilio: {
    configured: false,
    missing: [],
  },
  currentUserName: '',
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
  const [isDeletingPersonId, setIsDeletingPersonId] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isImportingPeople, setIsImportingPeople] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [peopleSearchTerm, setPeopleSearchTerm] = useState('');
  const [peopleRoleFilter, setPeopleRoleFilter] = useState<'all' | Person['type']>('all');
  const [peopleSortField, setPeopleSortField] = useState<PeopleSortField>('name');
  const [peopleSortDirection, setPeopleSortDirection] = useState<'asc' | 'desc'>('asc');
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
  const visiblePeople = useMemo(() => {
    const normalizedSearch = peopleSearchTerm.trim().toLowerCase();
    const filtered = snapshot.people.filter((person) => {
      const matchesRole = peopleRoleFilter === 'all' || person.type === peopleRoleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${person.name} ${person.phoneNumber} ${person.type}`.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });

    return filtered.sort((left, right) => {
      const leftValue = String(left[peopleSortField]).toLowerCase();
      const rightValue = String(right[peopleSortField]).toLowerCase();
      const comparison = leftValue.localeCompare(rightValue);
      return peopleSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [peopleRoleFilter, peopleSearchTerm, peopleSortDirection, peopleSortField, snapshot.people]);

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
    const normalizedName = personForm.name.trim();
    const normalizedPhoneNumber = personForm.phoneNumber.trim();

    if (!normalizedName || !normalizedPhoneNumber) {
      setFeedback(null);
      setError('Name and phone number are required.');
      return;
    }

    setIsAddingPerson(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...personForm,
          name: normalizedName,
          phoneNumber: normalizedPhoneNumber,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Unable to add person.');
        return;
      }

      setSnapshot(payload.data);
      setPersonForm({ name: '', phoneNumber: '', type: 'mentee' });
      setFeedback('Person added successfully.');
    } catch {
      setError('Unable to add person right now.');
    } finally {
      setIsAddingPerson(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!messageForm.message.trim()) {
      setFeedback(null);
      setError('Message is required.');
      return;
    }

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

  async function handleDeletePerson(person: Person) {
    const confirmed = window.confirm(`Delete ${person.name}? This will also remove their message history.`);

    if (!confirmed) {
      return;
    }

    setIsDeletingPersonId(person.id);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/people', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personId: person.id }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Unable to delete person.');
        return;
      }

      setSnapshot(payload.data);
      setFeedback(`${person.name} deleted successfully.`);
    } catch {
      setError('Unable to delete person right now.');
    } finally {
      setIsDeletingPersonId(null);
    }
  }

  function handleSortChange(field: PeopleSortField) {
    if (peopleSortField === field) {
      setPeopleSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setPeopleSortField(field);
    setPeopleSortDirection('asc');
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Admin Portal</p>
            <h1 className="mt-3 text-4xl font-bold">Welcome back, {snapshot.currentUserName || 'Admin'}</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">
              Manage contacts, send bulk SMS to mentors or mentees, and track message history.
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
          <p className="text-sm text-slate-500">Messages Sent</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{snapshot.messageHistory.length}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">People</h2>
            <p className="mt-1 text-sm text-slate-600">Use E.164 phone format, e.g. +15551234567.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/admin/export"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </a>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={isImportingPeople}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingPeople ? 'Importing...' : 'Import CSV'}
            </button>
            <button
              type="button"
              onClick={loadState}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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

        {/* Add Person form */}
        <form onSubmit={handleAddPerson} className="mt-6 rounded-2xl border border-slate-200 p-4">
          <p className="mb-4 text-sm font-semibold text-slate-700">Add Person</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input
              value={personForm.name}
              onChange={(event) => setPersonForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-500"
              required
            />
            <input
              value={personForm.phoneNumber}
              onChange={(event) => setPersonForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              placeholder="+15551234567"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-500"
              required
            />
            <select
              value={personForm.type}
              onChange={(event) =>
                setPersonForm((current) => ({ ...current, type: event.target.value as Person['type'] }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-500"
            >
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>
            <button
              type="submit"
              disabled={isAddingPerson}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isAddingPerson ? 'Saving...' : 'Add Person'}
            </button>
          </div>
        </form>

        {/* People table */}
        {isLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading...</p>
        ) : snapshot.people.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No people added yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={peopleSearchTerm}
                onChange={(event) => setPeopleSearchTerm(event.target.value)}
                placeholder="Search by name, phone, or role"
                className="w-full max-w-md rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-500"
              />

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filter</span>
                <select
                  value={peopleRoleFilter}
                  onChange={(event) => setPeopleRoleFilter(event.target.value as 'all' | Person['type'])}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="mentor">Mentors</option>
                  <option value="mentee">Mentees</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    <button type="button" onClick={() => handleSortChange('name')} className="inline-flex items-center gap-1">
                      Name
                      {peopleSortField === 'name' ? (peopleSortDirection === 'asc' ? '↑' : '↓') : null}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    <button type="button" onClick={() => handleSortChange('phoneNumber')} className="inline-flex items-center gap-1">
                      Phone
                      {peopleSortField === 'phoneNumber' ? (peopleSortDirection === 'asc' ? '↑' : '↓') : null}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    <button type="button" onClick={() => handleSortChange('type')} className="inline-flex items-center gap-1">
                      Role
                      {peopleSortField === 'type' ? (peopleSortDirection === 'asc' ? '↑' : '↓') : null}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visiblePeople.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{person.name}</td>
                    <td className="px-4 py-3 text-slate-600">{person.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          person.type === 'mentor'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {person.type === 'mentor' ? 'Mentor' : 'Mentee'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePerson(person)}
                        disabled={isDeletingPersonId === person.id}
                        className="rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeletingPersonId === person.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {visiblePeople.length === 0 ? (
              <p className="text-sm text-slate-500">No people match the current filter.</p>
            ) : null}
          </div>
        )}
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
              <div className="grid gap-3 sm:grid-cols-4">
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
                  label="All (Everyone)"
                  selected={messageForm.recipientMode === 'all'}
                  onClick={() => setMessageForm((current) => ({ ...current, recipientMode: 'all' }))}
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
                required
              />
              {(() => {
                const len = messageForm.message.length;
                const smsPerRecipient = len === 0 ? 1 : Math.ceil(len / 160);
                const recipientCount =
                  messageForm.recipientMode === 'all-mentees'
                    ? snapshot.people.filter((p) => p.type === 'mentee').length
                    : messageForm.recipientMode === 'all-mentors'
                      ? snapshot.people.filter((p) => p.type === 'mentor').length
                      : messageForm.recipientMode === 'all'
                        ? snapshot.people.length
                        : selectedRecipientIds.length;
                const totalSms = smsPerRecipient * recipientCount;
                const charsInSegment = len === 0 ? 0 : len % 160 === 0 ? 160 : len % 160;
                const charsRemaining = 160 - charsInSegment;
                return (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      <span className={len > 0 && charsRemaining <= 20 ? 'font-semibold text-amber-600' : ''}>
                        {len} character{len !== 1 ? 's' : ''}
                      </span>
                      {' · '}
                      <span className={smsPerRecipient > 1 ? 'font-semibold text-amber-600' : ''}>
                        {smsPerRecipient} SMS segment{smsPerRecipient !== 1 ? 's' : ''} per recipient
                      </span>
                      {len > 0 && (
                        <span className="ml-1 text-slate-400">
                          ({charsRemaining} char{charsRemaining !== 1 ? 's' : ''} left in current segment)
                        </span>
                      )}
                    </span>
                    {recipientCount > 0 && len > 0 && (
                      <span className="font-semibold text-blue-600">
                        {totalSms} total SMS to send ({recipientCount} recipient{recipientCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                );
              })()}
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
          Outbound messages grouped by send batch.
        </p>

        {snapshot.messageHistory.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No messages have been sent yet.</p>
        ) : (() => {
          // Group entries by (dateSent, author, message) — same bulk send shares these
          type BatchKey = string;
          const batchMap = new Map<BatchKey, typeof snapshot.messageHistory>();
          for (const entry of snapshot.messageHistory) {
            const key: BatchKey = `${entry.dateSent}__${entry.author}__${entry.message}`;
            if (!batchMap.has(key)) batchMap.set(key, []);
            batchMap.get(key)!.push(entry);
          }
          const batches = Array.from(batchMap.values());

          function recipientLabel(entries: typeof snapshot.messageHistory): string {
            const allMentors = snapshot.people.filter((p) => p.type === 'mentor').map((p) => p.id);
            const allMentees = snapshot.people.filter((p) => p.type === 'mentee').map((p) => p.id);
            const ids = entries.map((e) => e.recipientId);
            const idSet = new Set(ids);
            const isAllMentors = allMentors.length > 0 && allMentors.every((id) => idSet.has(id)) && ids.length === allMentors.length;
            const isAllMentees = allMentees.length > 0 && allMentees.every((id) => idSet.has(id)) && ids.length === allMentees.length;
            const isAll = snapshot.people.length > 0 && snapshot.people.every((p) => idSet.has(p.id)) && ids.length === snapshot.people.length;
            if (isAll) return 'All (Everyone)';
            if (isAllMentors) return 'All Mentors';
            if (isAllMentees) return 'All Mentees';
            if (ids.length === 1) return entries[0].recipientName;
            return entries.map((e) => e.recipientName).join(', ');
          }

          return (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Recipients</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Author</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {batches.map((entries, index) => {
                    const first = entries[0];
                    const sentCount = entries.filter((e) => e.status === 'sent').length;
                    const failCount = entries.length - sentCount;
                    return (
                      <tr key={index} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(first.dateSent)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{recipientLabel(entries)}</p>
                          <p className="mt-1 text-xs text-slate-500">{entries.length} recipient{entries.length !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{first.author}</td>
                        <td className="px-4 py-3">
                          {sentCount > 0 && (
                            <span className="mr-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              {sentCount} sent
                            </span>
                          )}
                          {failCount > 0 && (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              {failCount} failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs">{first.message}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </section>
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

