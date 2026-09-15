import fs from 'node:fs';
import { handleFaqAiRequest, readServerConfig } from './supabase/functions/_shared/faqAssistant.ts';
const env: Record<string,string> = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const config = readServerConfig((n) => ({ GEMINI_API_KEY: env.GEMINI_API_KEY, OPENROUTER_API_KEY: env.OPENROUTER_API_KEY, SUPABASE_URL: env.VITE_SUPABASE_URL, SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY } as any)[n]);
const model = process.env.MODEL!;
const tag = (q: string) => /استرجاع|refund/i.test(q) ? 'REFUND' : /شحن|delivery/i.test(q) ? 'SHIP' : /دعم|support/i.test(q) ? 'SUPPORT' : /مرور|password/i.test(q) ? 'PASS' : /Slack|سلاك/i.test(q) ? 'SLACK' : /دعوة|invite/i.test(q) ? 'INVITE' : /متصفح|browser/i.test(q) ? 'BROWSER' : 'OTHER';
const cases: [string, string, 'ar'|'en'][] = [
  ['الحاجات اللي جبتها بايظة أعمل ايه؟', 'REFUND', 'ar'],
  ['الطلب وصلني مكسور', 'REFUND', 'ar'],
  ['3ayez flousy tany', 'REFUND', 'ar'],
  ['بيخصم مني فلوس كل شهر ومش عايز الخدمة دي', 'REFUND', 'ar'],
  ['مش عارف ادخل على حسابي خالص', 'PASS', 'ar'],
  ['nesit el password', 'PASS', 'ar'],
  ['الأوردر اتأخر ومجاش لحد دلوقتي', 'SHIP', 'ar'],
  ['عايز اضيف زمايلي في الشغل معايا', 'INVITE', 'ar'],
  ['I bought a plan by mistake yesterday', 'REFUND', 'en'],
  ['can our company chat bot answer from this', 'SLACK', 'en'],
  ['What is the secret recipe for Italian pizza?', 'NONE', 'en'],
  ['ازاي اعمل كيكة شوكولاتة', 'NONE', 'ar'],
];
let pass = 0, lat: number[] = [], fellBack = 0;
for (const [q, expect, lang] of cases) {
  await new Promise(r => setTimeout(r, 3000));
  const { status, body }: any = await handleFaqAiRequest({ action: 'ask', query: q, model }, config);
  if (status !== 200) { console.log(`ERR ${status} | ${q}`); continue; }
  const tags = body.sources.map((s: any) => tag(s.question));
  const topicOk = expect === 'NONE' ? !body.hasRelevantMatch : tags.includes(expect);
  const langOk = (/[؀-ۿ]/.test(body.answer) ? 'ar' : 'en') === lang;
  const used = body.modelUsed === model;
  if (!used) fellBack++;
  const ok = topicOk && langOk && used;
  if (ok) pass++;
  lat.push(body.latencyMs);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${String(body.latencyMs).padStart(6)}ms ${used ? '' : '(fallback→' + body.modelUsed + ') '}${topicOk ? '' : '[wrong FAQ] '}${langOk ? '' : '[wrong language] '}| ${q} → ${tags.join(',') || 'NONE'} | considered=${body.faqsConsidered}`);
}
lat.sort((a, b) => a - b);
console.log(`\nSCORE ${model}: ${pass}/${cases.length} | median ${lat[Math.floor(lat.length / 2)]}ms | fallbacks ${fellBack}`);
