import React from 'react';
import { cn } from '@/lib/utils';
import { useTypewriter } from '@/hooks/useTypewriter';

const ARABIC_SCRIPT = /[؀-ۿ]/;

/** Blinking text caret. */
export const Caret: React.FC<{ className?: string }> = ({ className }) => (
  <span
    aria-hidden="true"
    className={cn('inline-block w-[2px] h-[1.1em] align-middle bg-current animate-caret-blink mx-0.5', className)}
  />
);

/** Animated equalizer bars shown while recording. */
export const SoundBars: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn('inline-flex items-center gap-[2px] h-3.5', className)}>
    {[0, 150, 300, 450].map((delay) => (
      <span
        key={delay}
        className="w-[3px] h-full rounded-full bg-current origin-center animate-sound-bar"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

interface InputOverlayProps {
  /** Rendered only when true (e.g. the input is empty). */
  visible: boolean;
  className?: string;
  children: React.ReactNode;
  dir?: 'rtl' | 'ltr';
}

/** Absolutely positioned layer over an input, used instead of the native placeholder. */
export const InputOverlay: React.FC<InputOverlayProps> = ({ visible, className, children, dir }) => {
  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      dir={dir}
      className={cn('pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap', className)}
    >
      {children}
    </div>
  );
};

interface TypewriterPlaceholderProps {
  phrases: readonly string[];
  visible: boolean;
  className?: string;
}

/** Placeholder that types out example phrases in a loop. */
export const TypewriterPlaceholder: React.FC<TypewriterPlaceholderProps> = ({ phrases, visible, className }) => {
  const { text, phrase } = useTypewriter(phrases, visible);
  return (
    <InputOverlay visible={visible} dir={ARABIC_SCRIPT.test(phrase) ? 'rtl' : 'ltr'} className={className}>
      <span className="truncate">{text}</span>
      <Caret className="text-blue-500" />
    </InputOverlay>
  );
};
