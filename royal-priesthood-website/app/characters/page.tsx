'use client';

import { useState, useEffect } from 'react';

interface Character {
  name: string;
  category: string;
  references: string;
}

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch('/data/characters.json');
        const data = await response.json();
        setCharacters(data.characters);
      } catch (error) {
        console.error('Error loading characters:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading characters...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Bible Characters to Study</h1>
        <p className="text-gray-600">
          Choose one character to study throughout the 8-week program. Each character's story
          reveals something about identity in Christ.
        </p>
      </div>

      <section className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-3">How to Choose</h2>
        <ul className="space-y-2 text-gray-700">
          <li>• Is there a person in the Bible you've always been curious about?</li>
          <li>• Is there a theme (courage, purpose, belonging, overcoming) that feels close to your life right now?</li>
          <li>• Is there a character who reminds you of yourself?</li>
          <li>• Trust the Holy Spirit in your selection — there's no wrong choice</li>
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Character</th>
                <th className="px-4 py-3 text-left">Identity Theme</th>
                <th className="px-4 py-3 text-left">Bible References</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character, index) => (
                <tr key={index} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{character.name}</td>
                  <td className="px-4 py-3 text-gray-700">{character.category}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{character.references}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="bg-green-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-3">Character Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-green-900 mb-2">Chosen Before You Understood It</p>
            <p className="text-gray-700 text-sm">
              Joseph, Esther, Jeremiah, Gideon — selected by God before they realized it
            </p>
          </div>
          <div>
            <p className="font-bold text-green-900 mb-2">Overcoming a Broken Beginning</p>
            <p className="text-gray-700 text-sm">
              Moses, Ruth, Rahab, Mephibosheth — discovering God's redemptive identity
            </p>
          </div>
          <div>
            <p className="font-bold text-green-900 mb-2">Courage When It Cost Everything</p>
            <p className="text-gray-700 text-sm">
              Daniel, Shadrach/Meshach/Abednego, David, Mary — tested and staying faithful
            </p>
          </div>
          <div>
            <p className="font-bold text-green-900 mb-2">Transformed—Not Who You Used To Be</p>
            <p className="text-gray-700 text-sm">
              Paul, Peter, Zacchaeus — radically changed by encountering God's grace
            </p>
          </div>
          <div>
            <p className="font-bold text-green-900 mb-2">Purpose Beyond What You Expected</p>
            <p className="text-gray-700 text-sm">
              Nehemiah, Joshua, Deborah, Solomon, John — stepping into surprising callings
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-600 mb-3">Study Tips</h2>
        <ul className="space-y-2 text-gray-700">
          <li>📖 Start by reading the main Bible passages listed for your character</li>
          <li>✍️ Take notes on their background, struggles, and victories</li>
          <li>❓ Ask yourself: How is their story like mine?</li>
          <li>💭 What does their life teach me about identity in Christ?</li>
          <li>🙏 Pray and ask God to reveal truths through their story</li>
          <li>💬 Share your discoveries with your mentor each week</li>
        </ul>
      </section>
    </div>
  );
}
