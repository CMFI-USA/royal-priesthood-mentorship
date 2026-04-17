'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getCurrentWeek } from '@/lib/weekCalculator';

export default function Home() {
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    setCurrentWeek(getCurrentWeek());
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Royal Priesthood Mentorship</h1>
        <p className="text-xl mb-2">
          A 8-Week Journey of Identity in Christ
        </p>
        <p className="text-blue-100 mb-4">Theme Verse: 1 Peter 2:9</p>
        <p className="text-blue-100 max-w-3xl mx-auto">
          "But you are a chosen generation, a royal priesthood, a holy nation,
          His own special people, that you may proclaim the praises of Him who
          called you out of darkness into His marvelous light."
        </p>
      </section>

      {/* Current Week Highlight */}
      <section className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-amber-900 mb-2">
          📍 Current Week: Week {currentWeek}
        </h2>
        <p className="text-amber-800">
          You're viewing the program for the week of April 19 - June 14. Use the
          navigation above to explore different sections of the program.
        </p>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/about"
            className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">💡 Why</h3>
            <p className="text-gray-700">
              Understand the vision and purpose behind this program
            </p>
          </Link>

          <Link
            href="/structure"
            className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">🏗️ Structure</h3>
            <p className="text-gray-700">
              Learn how the program is organized and flows week by week
            </p>
          </Link>

          <Link
            href="/responsibilities"
            className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">👥 Roles</h3>
            <p className="text-gray-700">
              Understand mentor and mentee responsibilities
            </p>
          </Link>

          <Link
            href="/schedule"
            className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">📅 Schedule</h3>
            <p className="text-gray-700">
              See the complete 8-week calendar with key dates
            </p>
          </Link>

          <Link
            href="/characters"
            className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">📖 Characters</h3>
            <p className="text-gray-700">
              Explore 20 Bible characters to study during the program
            </p>
          </Link>

          <Link
            href="/weekly-guide"
            className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-blue-600 mb-2">⭐ Weekly Guide</h3>
            <p className="text-gray-700">
              Interactive weekly guides with questions and prompts
            </p>
          </Link>
        </div>
      </section>

      {/* Program Overview */}
      <section className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Program Overview</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✓ <strong>Duration:</strong> 8 weeks (April 19 - June 14, 2026)</li>
          <li>✓ <strong>Age:</strong> 13-25 years old</li>
          <li>✓ <strong>Format:</strong> 1:1 mentorship with accountability squads</li>
          <li>✓ <strong>Meeting:</strong> Minimum 1 hour per week + Monday check-ins</li>
          <li>✓ <strong>Focus:</strong> Personal Bible character study + Identity in Christ</li>
          <li>✓ <strong>Goal:</strong> Spiritual formation and discipleship</li>
        </ul>
      </section>
    </div>
  );
}
