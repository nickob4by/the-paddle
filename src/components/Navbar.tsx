'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Search, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  onOpenLookup: () => void;
}

export default function Navbar({ onOpenLookup }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink min-w-0">
          <div className="relative h-11 sm:h-13 w-auto flex items-center group-hover:scale-105 transition-transform">
            {/* Light mode logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/the-paddle-logo-light.png"
              alt="The Paddle - Recreational Hub"
              className="h-10 sm:h-12 w-auto object-contain dark:hidden"
            />
            {/* Dark mode logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/the-paddle-logo-dark.png"
              alt="The Paddle - Recreational Hub"
              className="h-10 sm:h-12 w-auto object-contain hidden dark:block"
            />
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-300" />
            )}
          </button>

          {/* Check Reservation Button */}
          <button
            onClick={onOpenLookup}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
            title="Check Reservation Status"
          >
            <Search className="w-4 h-4 text-lime-600 dark:text-lime-400 flex-shrink-0" />
            <span className="hidden md:inline">Check Reservation</span>
            <span className="hidden sm:inline md:hidden">Check</span>
          </button>

          {/* Book Now (desktop) */}
          <Link
            href="#courts-section"
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 shadow-md shadow-lime-500/25 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Now</span>
          </Link>

          {/* Admin Link */}
          <Link
            href="/admin"
            className="flex items-center gap-1 px-2.5 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title="Admin Portal"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
