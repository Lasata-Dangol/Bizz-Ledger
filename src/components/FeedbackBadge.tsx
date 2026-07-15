import React from 'react';
import { Sparkles, Hourglass, CheckCircle2, RotateCcw } from 'lucide-react';

interface FeedbackBadgeProps {
  status: 'YOUR_TURN' | 'WAITING' | 'ACCEPTED' | 'WITHDRAWN';
}

export default function FeedbackBadge({ status }: FeedbackBadgeProps) {
  if (status === 'YOUR_TURN') {
    return (
      <span className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs animate-pulse">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
        <Sparkles size={13} className="animate-spin-slow" />
        Your Turn to Act
      </span>
    );
  }

  if (status === 'WAITING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shadow-xs">
        <span className="flex h-2 w-2 rounded-full bg-amber-400"></span>
        <Hourglass size={13} className="animate-spin" />
        Waiting for Opponent
      </span>
    );
  }

  if (status === 'WITHDRAWN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-600 text-xs font-semibold">
        <RotateCcw size={13} />
        Offer Withdrawn
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
      <CheckCircle2 size={13} />
      Contract Accepted
    </span>
  );
}
