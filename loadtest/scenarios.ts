import { createChat, generateCarteData } from './aiLogicAdapter.js';
import { recordMetric } from './metrics.js';
import { ChatMessage } from '../types';

async function runWithTimer(runId: number, scenario: string, promiseFn: () => Promise<{ summary?: string; backend?: string }>) {
    const startTime = Date.now();
    try {
        const { summary, backend } = await promiseFn();
        recordMetric({ scenario, runId, startTime, endTime: Date.now(), success: true, response_summary: summary, backend });
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        recordMetric({ scenario, runId, startTime, endTime: Date.now(), success: false, error: errorMessage });
        console.error(`Run ${runId} failed for scenario ${scenario}:`, error);
    }
}

export async function runStreamScenario(runId: number) {
    await runWithTimer(runId, 'S1-Stream', async () => {
        let backend: string | undefined;
        const chat = createChat({ onBackendResolved: (k) => backend = k });
        const responseStream = await chat.sendMessageStream({ message: "対話を開始してください" });
        
        let fullText = '';
        for await (const chunk of responseStream) {
            fullText += chunk.text;
        }
        // CSVで壊れないように改行やカンマを除外し、長すぎないように先頭200文字を返す
        return { summary: fullText.substring(0, 200).replace(/[\n,]/g, ' '), backend };
    });
}

export async function runCarteScenario(runId: number) {
    const chatHistory: ChatMessage[] = [
        { id: '1', sender: 'user', text: '週次レポート作成業務を改善したい' },
        { id: '2', sender: 'bot', text: 'どのようなレポートですか？' },
        { id: '3', sender: 'user', text: 'Excelで売上データをまとめてPowerPointに貼り付ける作業です' },
        { id: '4', sender: 'bot', text: 'ありがとうございます。次に、業務の量についていくつか質問します。' },
        { id: '5', sender: 'user', text: '週に1回、2時間かかります。担当は3名です。' },
        { id: '6', sender: 'bot', text: '最後に、この業務に分かりやすい名前を付けてください。'},
        { id: '7', sender: 'user', text: '週次売上レポート作成' },
    ];

    await runWithTimer(runId, 'S3-Carte', async () => {
        let backend: string | undefined;
        const carte = await generateCarteData(chatHistory, { onBackendResolved: (k) => backend = k });
        if (!carte || !carte.workId) {
            throw new Error('Generated carte is invalid or missing workId');
        }
        return { summary: `ID: ${carte.workId}, Title: ${carte.title}`, backend };
    });
}

export type Scenario = 'stream' | 'carte';

export const SCENARIOS: Record<Scenario, (runId: number) => Promise<void>> = {
    stream: runStreamScenario,
    carte: runCarteScenario,
};
