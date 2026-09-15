import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Types each phrase character by character, holds it, deletes it, then moves to the next.
 * Pass a stable (module-level) array so the cycle isn't restarted on every render.
 */
export function useTypewriter(phrases: readonly string[], enabled = true) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const phrase = phrases.length ? phrases[index % phrases.length] : '';

  useEffect(() => {
    if (!enabled || reducedMotion || !phrase) return;

    const finishedTyping = !deleting && length >= phrase.length;
    const finishedDeleting = deleting && length === 0;
    const delay = finishedTyping ? 1800 : finishedDeleting ? 350 : deleting ? 22 : 55;

    const timer = window.setTimeout(() => {
      if (finishedTyping) {
        setDeleting(true);
      } else if (finishedDeleting) {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      } else {
        setLength((l) => l + (deleting ? -1 : 1));
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [enabled, reducedMotion, phrase, phrases.length, length, deleting]);

  if (reducedMotion) {
    return { text: phrases[0] ?? '', phrase: phrases[0] ?? '' };
  }
  return { text: phrase.slice(0, length), phrase };
}

/**
 * Reveals `text` word by word, like it is being typed. Restarts when the text changes.
 * Returns the visible part and whether the reveal is still running.
 */
export function useRevealText(text: string, msPerWord = 28) {
  const reducedMotion = usePrefersReducedMotion();
  // Progress is stored with the text it belongs to, so a new text starts from zero on its first render.
  const [progress, setProgress] = useState({ text, count: 0 });
  const words = text.split(/(\s+)/); // keep whitespace (and line breaks) as separate tokens
  const visibleWords = progress.text === text ? progress.count : 0;

  useEffect(() => {
    if (reducedMotion || visibleWords >= words.length) return;
    const timer = window.setTimeout(() => setProgress({ text, count: visibleWords + 2 }), msPerWord);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, text, visibleWords, words.length, msPerWord]);

  const done = reducedMotion || visibleWords >= words.length;
  return {
    visible: done ? text : words.slice(0, visibleWords).join(''),
    isRevealing: !done,
    skip: () => setProgress({ text, count: words.length }),
  };
}
