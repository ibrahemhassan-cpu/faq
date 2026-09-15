import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToWavBase64 } from '@/lib/audio';
import { transcribeAudio } from '@/services/aiService';

export type VoiceStatus = 'idle' | 'recording' | 'transcribing';

const MAX_RECORDING_SECONDS = 60;

/**
 * Records a voice question from the microphone and returns its transcript.
 * Transcription runs on the server, so no AI key is needed in the browser.
 */
export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const isSupported =
    typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && 'MediaRecorder' in window;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (status !== 'idle') return;
    setError(null);

    if (!isSupported) {
      setError('Voice input is not supported in this browser. • المتصفح ده مش بيدعم التسجيل الصوتي.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Microphone permission was denied. • لازم تسمح للمتصفح يستخدم المايك.'
          : name === 'NotFoundError'
            ? 'No microphone found. • مفيش مايك متوصل.'
            : 'Could not access the microphone. • مقدرناش نوصل للمايك.'
      );
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    cancelledRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = async () => {
      clearTimer();
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;

      if (cancelledRef.current || chunks.length === 0) {
        setStatus('idle');
        return;
      }

      setStatus('transcribing');
      try {
        const audio = await blobToWavBase64(new Blob(chunks, { type: recorder.mimeType }));
        const text = await transcribeAudio(audio);
        if (text) {
          onTranscriptRef.current(text);
        } else {
          setError("Didn't catch any speech, please try again. • مسمعتش كلام واضح، جرّب تاني.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transcription failed.');
      } finally {
        setStatus('idle');
      }
    };

    recorder.start();
    setSeconds(0);
    setStatus('recording');
    let elapsed = 0;
    timerRef.current = window.setInterval(() => {
      elapsed += 1;
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) stop();
    }, 1000);
  }, [isSupported, status, stop]);

  // Release the microphone if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearTimer();
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    };
  }, []);

  return { status, seconds, error, isSupported, start, stop, cancel, maxSeconds: MAX_RECORDING_SECONDS };
}
