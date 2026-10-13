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
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-tr from-lime-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-lime-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="10" cy="10" r="1" fill="currentColor" />
              <circle cx="14" cy="10" r="1" fill="currentColor" />
              <circle cx="10" cy="14" r="1" fill="currentColor" />
              <circle cx="14" cy="14" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                THE PADDLE
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold bg-lime-500/20 text-lime-600 dark:text-lime-400 border border-lime-500/30 hidden min-[380px]:inline-block">
                CLUB
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">
              Premier Pickleball Courts & Booking
            </p>
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
