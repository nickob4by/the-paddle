'use client';

import React from 'react';
import { Court } from '@/lib/types';
import { Check, Sparkles, MapPin, Zap } from 'lucide-react';

interface CourtCardProps {
  court: Court;
  isSelected: boolean;
  onSelect: (court: Court) => void;
}

export default function CourtCard({ court, isSelected, onSelect }: CourtCardProps) {
  return (
    <div
      onClick={() => onSelect(court)}
      className={`group relative rounded-2xl p-6 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-slate-800/95 border-lime-400 ring-2 ring-lime-400/30 shadow-xl shadow-lime-500/10'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:shadow-lg'
      }`}
    >
      {/* Selection indicator pill */}
      {isSelected && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-lime-500 text-slate-950 text-xs font-bold shadow-sm">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Selected</span>
        </div>
      )}

      {/* Surface tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3 h-3" />
          {court.surfaceType || 'Championship Court'}
        </span>
      </div>

      {/* Court Title */}
      <h3 className="text-xl font-bold text-white group-hover:text-lime-300 transition-colors">
        {court.name}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed">
        {court.description || 'Professional pickleball court ready for singles and doubles play.'}
      </p>

      {/* Highlights / Features */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md">
          <Zap className="w-3 h-3 text-amber-400" /> Tournament Lighting
        </span>
        <span className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md">
          <MapPin className="w-3 h-3 text-sky-400" /> Regulation Size
        </span>
      </div>

      {/* Pricing and Action footer */}
      <div className="mt-5 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-lime-400">₱{court.hourlyRate}</span>
          <span className="text-xs text-slate-400 ml-1 font-medium">/ hour</span>
        </div>

        <button
          type="button"
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            isSelected
              ? 'bg-lime-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
          }`}
        >
          {isSelected ? 'Ready to Book' : 'Choose Court'}
        </button>
      </div>
    </div>
  );
}
