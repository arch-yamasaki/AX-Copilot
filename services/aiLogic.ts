import app from './firebaseClient';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { ChatMessage, Carte } from '../types';

type ChatLike = {
  sendMessageStream: (args: { message: string }) => AsyncIterable<{ text: string }> | Promise<AsyncIterable<{ text: string }>>;
};

const SYSTEM_INSTRUCTION = `あなたは「AX Copilot」、企業の業務改善を支援するAIコンサルタントです。ユーザーには常に1文の質問をJSON形式で返し、suggestions配列を含めてください。最終的に業務名を尋ねた後は text に [GENERATE_CARTE] のみ返してください。`;

function extractTextFromResponse(resp: any): string {
  try {
    if (resp?.text) {
      return typeof resp.text === 'function' ? resp.text() : resp.text;
    }
    const cand = resp?.candidates?.[0];
    const parts = cand?.content?.parts || [];
    return parts.map((p: any) => p.text).filter(Boolean).join('');
  } catch {
    return '';
  }
}

export const createChat = (): ChatLike => {
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash', systemInstruction: SYSTEM_INSTRUCTION } as any);
  const history: any[] = [];

  return {
    async sendMessageStream({ message }) {
      const contents = [...history, { role: 'user', parts: [{ text: message }] }];
      // Firebase AI Logic: stream API
      const stream: any = await (model as any).generateContentStream({ contents });
      const iterator: AsyncIterable<{ text: string }> = {
        [Symbol.asyncIterator]: async function* () {
          const full = await stream.response;
          const text = extractTextFromResponse(full);
          history.push({ role: 'user', parts: [{ text: message }] });
          history.push({ role: 'model', parts: [{ text }] });
          yield { text };
        },
      };
      return iterator;
    },
  };
};

function buildFinalPrompt(chatHistory: ChatMessage[]): string {
  const conversation = chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n');
  return `あなたは、アクセンチュアのトップクラスの業務改革コンサルタント「AX Consultant」です。` +
         `以下の対話履歴を分析し、指定のJSONだけを出力してください。\n\n# 対話履歴\n${conversation}\n\n` +
         `出力は application/json のみ。{ "carte": {...} } を返し、フィールドは既存UIが期待する日本語名を使用してください。`;
}

export const generateCarteData = async (chatHistory: ChatMessage[]): Promise<Carte> => {
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' } as any);
  const prompt = buildFinalPrompt(chatHistory);
  const resp: any = await (model as any).generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' } as any,
  } as any);
  const rawText = typeof resp.text === 'function' ? resp.text() : extractTextFromResponse(resp.response ?? resp);
  let jsonText = (rawText || '').trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3);
  else if (jsonText.startsWith('```')) jsonText = jsonText.substring(3, jsonText.length - 3);
  const parsed = JSON.parse(jsonText);
  if (!parsed.carte) throw new Error('Invalid data structure received from AI Logic');
  return parsed.carte as Carte;
};



