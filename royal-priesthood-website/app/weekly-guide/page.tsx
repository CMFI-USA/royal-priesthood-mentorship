'use client';

import { useState, useEffect } from 'react';
import { getCurrentWeek } from '@/lib/weekCalculator';

interface Week {
  week: number;
  date: string;
  mondayCheckIn: string;
  theme: string;
  subtitle: string;
  verse: string;
  versionFull: string;
  exhortation: string;
  questions: string[];
  proclamation: string;
  prayerPrompts: string[];
}

export default function WeeklyGuide() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1);
  const [displayWeekNumber, setDisplayWeekNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeeks() {
      try {
        const response = await fetch('/data/weeks.json');
        const data = await response.json();
        setWeeks(data.weeks);
        const current = getCurrentWeek();
        setCurrentWeekNumber(current);
        setDisplayWeekNumber(current);
      } catch (error) {
        console.error('Error loading weeks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWeeks();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading weekly guide...</div>;
  }

  const currentWeek = weeks.find((w) => w.week === displayWeekNumber);

  if (!currentWeek) {
    return <div className="text-center py-10">Week not found</div>;
  }

  const handlePrevious = () => {
    if (displayWeekNumber > 1) {
      setDisplayWeekNumber(displayWeekNumber - 1);
    }
  };

  const handleNext = () => {
    if (displayWeekNumber < weeks.length) {
      setDisplayWeekNumber(displayWeekNumber + 1);
    }
  };

  const handleWeekSelect = (weekNum: number) => {
    setDisplayWeekNumber(weekNum);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Weekly Program Guide</h1>
        <p className="text-gray-600">
          One week at a time. Use this guide with your mentee to walk through identity formation
          week by week.
        </p>
      </div>

      {/* Current Week Indicator */}
      <section className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
        <p className="text-blue-900">
          📍 <strong>Current Week: {currentWeekNumber}</strong> | Navigate to any week using the
          buttons below
        </p>
      </section>

      {/* Week Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-lg border border-gray-200">
        {weeks.map((week) => (
          <button
            key={week.week}
            onClick={() => handleWeekSelect(week.week)}
            className={`px-3 py-2 rounded font-semibold transition-colors ${
              displayWeekNumber === week.week
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week {week.week} {week.week === currentWeekNumber && '●'}
          </button>
        ))}
      </div>

      {/* Main Week Display */}
      <div className="bg-white rounded-lg border-2 border-blue-300 p-8">
        {/* Header */}
        <div className="mb-6 pb-6 border-b-2 border-blue-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-4xl font-bold text-blue-600">Week {currentWeek.week}</h2>
              <p className="text-gray-600">{currentWeek.date}</p>
              <p className="text-sm text-gray-500">Monday Check-in: {currentWeek.mondayCheckIn}</p>
            </div>
            <div className="text-right">
              {currentWeek.week === currentWeekNumber && (
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  This Week 📍
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Theme */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-4">
            <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">
              Theme
            </p>
            <h3 className="text-3xl font-bold text-blue-900 mb-2">{currentWeek.theme}</h3>
            <p className="text-xl text-gray-700 italic">{currentWeek.subtitle}</p>
          </div>
        </section>

        {/* Memory Verse */}
        <section className="mb-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
          <p className="text-sm uppercase tracking-wide font-semibold text-blue-900 mb-2">
            Memory Verse This Week
          </p>
          <p className="text-2xl font-bold text-blue-900 mb-3">{currentWeek.verse}</p>
          <blockquote className="text-lg text-gray-700 italic mb-2">
            "{currentWeek.versionFull}"
          </blockquote>
          <p className="text-sm text-gray-600">
            Spend time this week memorizing or meditating on this verse.
          </p>
        </section>

        {/* Mentor Exhortation */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">💬 Mentor Exhortation</h3>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 whitespace-pre-wrap text-gray-700 leading-relaxed">
            {currentWeek.exhortation}
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Read this first before your meeting to prepare your heart and mind.
          </p>
        </section>

        {/* Conversation Questions */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">❓ Conversation Questions</h3>
          <p className="text-gray-600 mb-4">
            Use these questions with your mentee. Tie each one to their chosen Bible character.
          </p>
          <div className="space-y-3">
            {currentWeek.questions.map((question, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-bold text-blue-900 mb-1">Question {index + 1}</p>
                <p className="text-gray-700">{question}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Proclamation */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">📣 Weekly Proclamation</h3>
          <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg">
            <p className="text-gray-700 font-semibold leading-relaxed italic">
              {currentWeek.proclamation}
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Speak this aloud together at the end of your meeting. Let your mentee hear you
              declare this truth with conviction.
            </p>
          </div>
        </section>

        {/* Prayer Prompts */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">🙏 Prayer Prompts</h3>
          <p className="text-gray-600 mb-4">
            Ask your mentee these questions. Write down their prayer requests and follow up
            mid-week.
          </p>
          <div className="space-y-3">
            {currentWeek.prayerPrompts.map((prompt, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="font-bold text-purple-900 mb-1">Prayer Point {index + 1}</p>
                <p className="text-gray-700">{prompt}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-white border-2 border-gray-300 p-4 rounded-lg">
            <p className="font-semibold text-gray-700 mb-2">Your Prayer Notes:</p>
            <textarea
              placeholder="Write prayer requests here that you want to remember..."
              className="w-full h-24 p-3 border border-gray-300 rounded resize-none text-gray-700"
            ></textarea>
          </div>
        </section>

        {/* Follow-up Note */}
        <section className="bg-amber-50 p-6 rounded-lg border border-amber-300">
          <p className="font-semibold text-amber-900 mb-2">💌 Mid-Week Tip</p>
          <p className="text-gray-700">
            Reach out mid-week with a brief encouragement: "I'm praying for you." This simple
            gesture keeps the relationship warm and shows you're thinking of them.
          </p>
        </section>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={displayWeekNumber === 1}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            displayWeekNumber === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          ← Previous Week
        </button>

        <p className="text-gray-700 font-semibold">
          Week {displayWeekNumber} of {weeks.length}
        </p>

        <button
          onClick={handleNext}
          disabled={displayWeekNumber === weeks.length}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            displayWeekNumber === weeks.length
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next Week →
        </button>
      </div>

      {/* All Weeks Summary */}
      <section className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Overview of All 8 Weeks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weeks.map((week) => (
            <div
              key={week.week}
              className="bg-white p-4 rounded-lg border border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleWeekSelect(week.week)}
            >
              <p className="font-bold text-blue-600">Week {week.week}</p>
              <p className="text-gray-700 font-semibold">{week.theme}</p>
              <p className="text-sm text-gray-600">{week.subtitle}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
