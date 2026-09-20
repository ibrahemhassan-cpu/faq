import React from 'react';
import { Loader2, Mic, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { cn } from '@/lib/utils';

type VoiceRecorder = ReturnType<typeof useVoiceRecorder>;

interface VoiceRecordButtonProps {
  voice: VoiceRecorder;
  disabled?: boolean;
  /** "md" matches the Ask AI search bar, "sm" matches compact form inputs. */
  size?: 'sm' | 'md';
}

/** Mic button: tap to record, tap stop to transcribe, or cancel. */
export const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({ voice, disabled, size = 'md' }) => {
  const height = size === 'md' ? 'h-10' : 'h-9';

  if (voice.status === 'recording') {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={voice.cancel}
          className={cn(height, 'px-2 text-slate-500 hover:bg-slate-100')}
          title="Cancel recording"
          aria-label="Cancel recording"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={voice.stop}
          className={cn(height, 'px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white animate-pulse flex items-center gap-1.5')}
          title="Stop and send"
          aria-label="Stop recording"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          <span className="font-mono text-xs">{voice.seconds}s</span>
        </Button>
      </div>
    );
  }

  const isTranscribing = voice.status === 'transcribing';
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={voice.start}
      disabled={disabled || isTranscribing}
      className={cn(height, size === 'md' ? 'w-10' : 'w-9', 'p-0 shrink-0 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600')}
      title="Speak instead of typing"
      aria-label="Record voice"
    >
      {isTranscribing ? (
        <Loader2 className={size === 'md' ? 'h-5 w-5 animate-spin' : 'h-4 w-4 animate-spin'} />
      ) : (
        <Mic className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
      )}
    </Button>
  );
};
