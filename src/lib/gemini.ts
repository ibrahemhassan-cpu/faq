import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn(
    '[Gemini] Missing VITE_GEMINI_API_KEY in .env. AI features will run in mock mode.'
  );
}

export const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export const isGeminiConfigured = Boolean(geminiApiKey && geminiApiKey.length > 10);
