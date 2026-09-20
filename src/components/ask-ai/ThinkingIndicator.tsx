import React, { useEffect, useState } from 'react';
import { Brain, BookOpenCheck, Sparkles } from 'lucide-react';

const STEPS = [
  { icon: Brain, text: 'Understanding your question' },
  { icon: BookOpenCheck, text: 'Reading every FAQ' },
  { icon: Sparkles, text: 'Picking the best answer' },
];

/** Shown while the AI works: a shimmering card whose status steps advance over time. */
export const ThinkingIndicator: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-4xl mx-auto rounded-2xl border border-blue-100 bg-white p-5 shadow-md animate-fade-in-up"
    >
      <ol className="space-y-2.5">
        {STEPS.map(({ icon: Icon, text }, index) => {
          const state = index < step ? 'done' : index === step ? 'active' : 'pending';
          return (
            <li
              key={text}
              className={`flex items-center gap-2.5 text-sm transition-all duration-500 ${
                state === 'pending' ? 'opacity-30 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
            >
              <span
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors duration-500 ${
                  state === 'active' ? 'bg-blue-600 text-white' : state === 'done' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className={`h-4 w-4 ${state === 'active' ? 'animate-pulse' : ''}`} />
              </span>
              <span className={state === 'active' ? 'font-semibold text-slate-900' : 'text-slate-600'}>{text}</span>
            </li>
          );
        })}
      </ol>

      {/* Skeleton lines where the answer will appear */}
      <div className="mt-4 space-y-2">
        {['w-11/12', 'w-4/5', 'w-2/3'].map((width) => (
          <div
            key={width}
            className={`${width} h-3 rounded-full bg-[linear-gradient(90deg,#f1f5f9_0%,#dbeafe_50%,#f1f5f9_100%)] bg-[length:200%_100%] animate-shimmer`}
          />
        ))}
      </div>
    </div>
  );
};
