'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'Why' },
    { href: '/structure', label: 'Structure' },
    { href: '/responsibilities', label: 'Roles' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/characters', label: 'Bible Characters' },
    { href: '/weekly-guide', label: 'Weekly Guide' },
  ];

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Royal Priesthood Mentorship</h1>
          <p className="text-sm text-blue-100">April 19 - June 14, 2026</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded transition-colors ${
                pathname === item.href
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
