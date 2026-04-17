export default function Responsibilities() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">Mentor vs Mentee Roles</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mentee Responsibilities */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Mentee Responsibilities</h2>

          <div className="space-y-4">
            <div>
              <p className="font-bold text-purple-900 mb-1">📖 Choose Your Character</p>
              <p className="text-gray-700 text-sm">
                Select one Bible character at the start that resonates with your season of life
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">📚 Study the Character</p>
              <p className="text-gray-700 text-sm">
                Read and reflect on their story throughout the 8 weeks using provided passages
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">💬 Come Ready to Participate</p>
              <p className="text-gray-700 text-sm">
                Engage honestly with weekly questions and share your thoughts and feelings
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">✍️ Memorize Scripture</p>
              <p className="text-gray-700 text-sm">
                Work each week to memorize or meditate on the weekly verse
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">🙏 Pray</p>
              <p className="text-gray-700 text-sm">
                Pray for your mentor, accountability squad, and your own journey
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">🤝 Connect with Accountability Squad</p>
              <p className="text-gray-700 text-sm">
                Meet weekly with your 3 other mentees for support and prayer
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">📞 Respond to Check-Ins</p>
              <p className="text-gray-700 text-sm">
                Acknowledge your mentor's Monday messages and keep them in the loop
              </p>
            </div>

            <div>
              <p className="font-bold text-purple-900 mb-1">🎯 Be Honest</p>
              <p className="text-gray-700 text-sm">
                Share authentically about your struggles, questions, and growth
              </p>
            </div>
          </div>
        </div>

        {/* Mentor Responsibilities */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Mentor Responsibilities</h2>

          <div className="space-y-4">
            <div>
              <p className="font-bold text-blue-900 mb-1">📋 Know Your Mentee</p>
              <p className="text-gray-700 text-sm">
                Learn their name, background, interests, and what they're carrying
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">⏰ Schedule Regular Meetings</p>
              <p className="text-gray-700 text-sm">
                Meet weekly for at least 1 hour. Be consistent and on time
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">📖 Use the Weekly Guide</p>
              <p className="text-gray-700 text-sm">
                Walk through the provided mentor guide with intentional questions
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">👂 Listen More Than Talk</p>
              <p className="text-gray-700 text-sm">
                Ask good questions and create space for your mentee to process
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">💬 Share Your Story</p>
              <p className="text-gray-700 text-sm">
                Authentically share how God has worked in your own life and identity journey
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">🙏 Pray Consistently</p>
              <p className="text-gray-700 text-sm">
                Pray for your mentee by name daily. Ask them for specific prayer requests
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">💌 Send Monday Check-Ins</p>
              <p className="text-gray-700 text-sm">
                Brief encouragement or question texted/called every Monday of the program
              </p>
            </div>

            <div>
              <p className="font-bold text-blue-900 mb-1">📊 Report & Reflect</p>
              <p className="text-gray-700 text-sm">
                Attend mentor meetings and provide feedback on your mentee's growth
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-amber-50 rounded-lg p-6 border border-amber-300">
        <h2 className="text-2xl font-bold text-amber-900 mb-4">What Mentorship Is NOT</h2>
        <ul className="space-y-2 text-gray-700">
          <li>❌ It's not about fixing problems — it's about walking alongside</li>
          <li>❌ It's not about having all the answers — it's okay to say "I don't know"</li>
          <li>❌ It's not about perfection — mentors are on a journey too</li>
          <li>❌ It's not counseling or therapy — if serious issues arise, involve leadership</li>
          <li>❌ It's not judgment — it's a safe space to be real</li>
          <li>❌ It's not one-directional — mentees teach mentors too</li>
        </ul>
      </section>

      <section className="bg-green-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-4">When to Escalate</h2>
        <p className="text-gray-700 mb-3">
          As a mentor, if your mentee discloses any of the following, contact the planning team immediately:
        </p>
        <ul className="space-y-1 text-gray-700">
          <li>• Abuse (physical, emotional, sexual)</li>
          <li>• Severe mental health crises or suicidal ideation</li>
          <li>• Substance abuse or addiction concerns</li>
          <li>• Criminal activity</li>
          <li>• Any situation you feel unequipped to handle</li>
        </ul>
        <p className="text-gray-700 mt-3 text-sm italic">
          You are not alone. The church leadership team is here to support you.
        </p>
      </section>
    </div>
  );
}
