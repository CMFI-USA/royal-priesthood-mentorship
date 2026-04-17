export default function Schedule() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">8-Week Schedule</h1>

      <section className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <p className="text-gray-700 mb-2">
          <strong>Program Duration:</strong> April 26 - June 21, 2026
        </p>
        <p className="text-gray-700">
          <strong>Week 4 (May 18):</strong> Midpoint Mentor Meeting
        </p>
        <p className="text-gray-700">
          <strong>June 21:</strong> End of Program Celebration (after church)
        </p>
      </section>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Week</th>
              <th className="px-4 py-3 text-left">Theme</th>
              <th className="px-4 py-3 text-left">Monday Check-In</th>
              <th className="px-4 py-3 text-left">Dates</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-600">1</td>
              <td className="px-4 py-3">Origin</td>
              <td className="px-4 py-3">Mon, Apr 27</td>
              <td className="px-4 py-3">Apr 26 - May 2</td>
            </tr>
            <tr className="border-b hover:bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-600">2</td>
              <td className="px-4 py-3">Design</td>
              <td className="px-4 py-3">Mon, May 4</td>
              <td className="px-4 py-3">May 3 - May 9</td>
            </tr>
            <tr className="border-b hover:bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-600">3</td>
              <td className="px-4 py-3">Belonging</td>
              <td className="px-4 py-3">Mon, May 11</td>
              <td className="px-4 py-3">May 10 - May 16</td>
            </tr>
            <tr className="border-b bg-amber-50 hover:bg-amber-100">
              <td className="px-4 py-3 font-bold text-amber-600">4 ⭐</td>
              <td className="px-4 py-3 font-bold">Purpose</td>
              <td className="px-4 py-3 font-bold">Mon, May 18 (Mentor Meeting)</td>
              <td className="px-4 py-3">May 17 - May 23</td>
            </tr>
            <tr className="border-b hover:bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-600">5</td>
              <td className="px-4 py-3">Character</td>
              <td className="px-4 py-3">Mon, May 25</td>
              <td className="px-4 py-3">May 24 - May 30</td>
            </tr>
            <tr className="border-b hover:bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-600">6</td>
              <td className="px-4 py-3">Redemption</td>
              <td className="px-4 py-3">Mon, Jun 1</td>
              <td className="px-4 py-3">May 31 - Jun 6</td>
            </tr>
            <tr className="border-b hover:bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-600">7</td>
              <td className="px-4 py-3">Community</td>
              <td className="px-4 py-3">Mon, Jun 8</td>
              <td className="px-4 py-3">Jun 7 - Jun 13</td>
            </tr>
            <tr className="bg-green-50 hover:bg-green-100">
              <td className="px-4 py-3 font-bold text-green-600">8 🎉</td>
              <td className="px-4 py-3 font-bold">Commission</td>
              <td className="px-4 py-3 font-bold">Mon, Jun 15</td>
              <td className="px-4 py-3">Jun 14 - Jun 21</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Key Milestone Dates</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="font-bold text-blue-600 mr-4 min-w-fit">📍 April 26</span>
            <span className="text-gray-700">Program Launch on Sunday morning</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-blue-600 mr-4 min-w-fit">💬 Every Monday</span>
            <span className="text-gray-700">
              Mentor check-ins (via text, call, or voice message)
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-amber-600 mr-4 min-w-fit">⭐ May 18</span>
            <span className="text-gray-700">Midpoint Mentor Meeting (all mentors gather)</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-green-600 mr-4 min-w-fit">🎉 June 21</span>
            <span className="text-gray-700">
              End of Program Celebration and reflection (after church service)
            </span>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Flexibility Within Structure</h2>
        <p className="text-gray-700 mb-3">
          The dates above provide structure, but the program is flexible in execution:
        </p>
        <ul className="space-y-2 text-gray-700">
          <li>
            • <strong>Meeting Times:</strong> Mentors and mentees can schedule meetings at any
            time during the week (not just Mondays)
          </li>
          <li>
            • <strong>Makeup Meetings:</strong> If a meeting is missed, it can be rescheduled
            that week
          </li>
          <li>
            • <strong>Holiday Adjustments:</strong> Contact the planning team if your week has
            conflicts
          </li>
          <li>
            • <strong>Pace:</strong> Follow the weekly themes, but take the time your mentee needs
          </li>
        </ul>
      </section>
    </div>
  );
}
