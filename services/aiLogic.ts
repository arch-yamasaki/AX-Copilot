import app from './firebaseClient';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { ChatMessage, Carte } from '../types';

type ChatLike = {
  sendMessageStream: (args: { message: string }) => AsyncIterable<{ text: string }> | Promise<AsyncIterable<{ text: string }>>;
};

const SYSTEM_INSTRUCTION = `あなたは「AX Copilot」、企業の業務改善を支援するAIコンサルタントです。ユーザーとの対話を通じて、自動化や効率化の対象となる業務の詳細をヒアリングし、「業務カルテ」を作成するのがあなたの役割です。

【対話進行のフェーズ】
あなたは以下のフェーズに従って、厳密に対話を進めてください。
1.  **フェーズ1: 挨拶と業務概要の把握**
    *   最初のメッセージで挨拶し、どのような業務を改善したいか、概要を尋ねてください。
    *   必ず入力候補(suggestions)を提示してください。(例: ["資料作成", "データ入力", "情報収集"])
2.  **フェーズ2: 現状業務(As-Is)の詳細ヒアリング**
    *   業務の具体的な流れ、使用ツール、インプットとアウトプット、データの種類・状態、現状の課題などを深掘りします。
    *   このフェーズでは、**数値に関する質問（時間、回数など）は絶対にしないでください。**
3.  **フェーズ3: 定量情報のヒアリング**
    *   フェーズ2が終わったら、「ありがとうございます。次に、業務の量についていくつか質問します。」のように、フェーズの切り替えをユーザーに伝えてください。
    *   このフェーズで初めて、「1.業務の頻度、2.月間回数、3.1回あたりの所要時間、4.その業務を実施する人数」の、**数値に関する質問をしてください。ここは必ず全て聞いて下さい。**
4.  **フェーズ4: 最終確認**
    *   全てのヒアリングが終わったら、**最後の質問として**「最後に、この業務に分かりやすい名前を付けてください。（例：週次売上レポート作成）」と尋ねてください。これが、ユーザーへの最後の質問です。
5.  **フェーズ5: カルテ生成**
    *   ユーザーが業務名を回答したら、応答として 'text' に '[GENERATE_CARTE]' という文字列だけを含むJSONを返してください。

【最重要ルール】
- **必ず、一度に一つの質問だけをしてください。** 複数の質問を一つのメッセージに含めてはいけません。
- **質問は、誰が読んでも理解できるように、非常に簡潔で明確にしてください。**
- **数値（時間、回数）を尋ねる質問は、必ずフェーズ3で行い、質問文は「1回あたり、平均で何分かかりますか？」のように、目的の数値だけを問う単純な形式にしてください。** これにより、UIが正しくスライダーを表示できます。
- ユーザーの入力を補助するため、適切な入力候補(suggestions)を積極的に提示してください。

応答フォーマット:
あなたの応答は、必ず以下の厳密なJSON形式で返してください。
{
  "text": "ユーザーへの返答や質問の文章（1文にすること）",
  "suggestions": ["提案1", "提案2"]
}
- 'text'にはユーザーへの質問を **1文** で記述します。
- 'suggestions'は、ユーザーが答えやすいように入力候補を提示する配列です。不要な場合は空配列 \`[]\` にしてください。`;

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
  return `
あなたは、アクセンチュアのトップクラスの業務改革コンサルタント「AX Consultant」です。
以下のユーザーとの対話履歴を深く分析し、企業の業務改善に繋がる実践的で質の高い「業務カルテ」を生成してください。

# 対話履歴
${conversation}

# 指示
上記対話履歴を専門的に分析し、以下の要件を満たすJSONデータを出力してください。

1.  **ID**: \`業務ID\`としてランダムな英数字3桁を割り当ててください。
2.  **As-Is分析 (現状分析)**:
  *   対話から現状の業務フローを5〜7工程で具体的に\`asIsSteps\`として再構成してください。各ステップの\`業務ID\`は統一してください。
  *   \`総時間_分\`と各工程の\`時間_分\`の合計が一致するように調整してください。
  *   \`現状のボトルネック\`を専門家の視点で2〜3点、配列で的確に言語化してください。
  *   \`AsIsフロー要約\`を専門家の視点で的確に言語化してください。

3.  **To-Be提案 (改善提案) - 最重要**:
  *   **推奨ツールカテゴリの選定**: 業務内容を深く理解し、以下の基準に基づいて最も適切な\`推奨ツールカテゴリ\`を一つだけ選択してください。安易な選択はせず、プロのコンサルタントとして最適なツールを選び抜いてください。
      - **'ノーコード連携 (Zapier, Power Automate)'**: **メール受信をトリガーとした処理、定型的なデータ転記、複数アプリ間の連携**など、明確なルールベースのワークフロー自動化に最適。ユーザーが「Power Automate」などの単語を出した場合、これを第一候補とすること。
      - **'生成AIチャット (Gemini, ChatGPT)'**: **文章の要約、アイデア出し、メール文面作成、翻訳**など、人間の思考や創造性を補助するタスクに最適。
      - **'カスタムAIチャットボット (GPTs, Gemini)'**: FAQ対応、社内情報検索など、**対話形式でユーザーからの問い合わせに答える**システム構築に最適。
      - **'GAS (Google Apps Script)'**: **Google Workspace (スプレッドシート、ドキュメント等) 内でのデータ処理や自動化**に特化した場合に最適。
      - **'コード開発 (AI Studio, Vertex AI)'**: 独自のAIモデルや、複雑なロジック、高度なシステム連携が必要な場合に選択。
      - **'その他'**: 上記に当てはまらない場合。
  *   **推奨ソリューション**: 選定したツールカテゴリを活用し、最も効果的で実現可能な解決策を\`推奨ソリューション\`として具体的に提案してください。
  *   **To-Beフロー**: 提案ソリューションに基づき、改善後の業務フローを\`toBeSteps\`として具体的に記述してください。各工程が**「手動」か「自動化」かを判断し、\`実行主体\`に設定**してください。自動化されるステップは明確に記述してください。
  *   **改善インパクト**: この改善がビジネスにもたらす定性的・定量的な効果を\`改善インパクト\`として要約してください。**重要な数値や結果は必ずMarkdownの太字表記(\`**text**\`)で強調してください。**

4.  **評価と将来展望**:
  *   \`自動化可能度\`を0〜100の数値で客観的に評価し、その**評価根拠**を\`自動化可能度根拠\`として具体的に記述してください。（例：「主要工程がルールベースであり、API連携可能なため」）
  *   \`属人性\`を「高」「中」「低」の3段階で評価し、その根拠を\`属人性根拠\`として単文で記述してください。
  *   改善による月間の削減時間/回を分単位で計算し\`月間削減時間_分\`に格納してください。
  *   削減時間の計算過程を\`削減時間詳細\`として「(改善前XX分 - 改善後YY分) × 月ZZ回 = WW分」の形式で記述してください。
  *   **高度な提案**: 今回の改善のさらに先を見据えた、一歩進んだ提案（例：データ分析基盤との連携、プロアクティブな顧客提案への応用など）を\`高度な提案\`として記述してください。

JSONスキーマに厳密に従い、\`carte\`オブジェクトを含むJSONデータのみを出力してください。
`;
}

export const generateCarteData = async (chatHistory: ChatMessage[]): Promise<Carte> => {
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' } as any);
  const prompt = buildFinalPrompt(chatHistory);
  // Structured output schema to enforce required fields
  const asIsStepSchema = {
    type: 'object',
    properties: {
      workId: { type: 'string' },
      stepNo: { type: 'integer' },
      asIsStepName: { type: 'string' },
      toolUsed: { type: 'string', description: '当該ステップで使用するツール' },
      minutes: { type: 'integer', description: '当該ステップの作業時間（分）' },
      input: { type: 'string', description: '当該ステップのインプット' },
      output: { type: 'string', description: '当該ステップのアウトプット' },
      dataState: { type: 'string', description: 'データの状態（例: 未整備、整備済み 等）' },
    },
  } as const;

  const toBeStepSchema = {
    type: 'object',
    properties: {
      workId: { type: 'string' },
      stepNo: { type: 'integer' },
      toBeStepName: { type: 'string' },
      executorType: { type: 'string', enum: ['manual', 'automated'], description: '実行主体（manual: 手動 / automated: 自動化）' },
      toolUsed: { type: 'string', description: '当該ステップで使用するツール' },
      minutes: { type: 'integer', description: '当該ステップの作業時間（分）' },
      improvementPoint: { type: 'string', description: '改善のポイント（要点）' },
    },
  } as const;

  const carteSchema = {
    type: 'object',
    properties: {
      carte: {
        type: 'object',
        properties: {
          workId: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          frequency: { type: 'string' },
          monthlyCount: { type: 'integer' },
          totalMinutes: { type: 'integer', description: '該当業務を1回やるのにかかる総時間（分）。asIsSteps の minutes 合計と整合させること。' },
          numSteps: { type: 'integer' },
          primaryTool: { type: 'string' },
          currentBottlenecks: { type: 'array', items: { type: 'string' }, description: '現状の業務における課題や手間がかかる点' },
          primaryData: { type: 'string' },
          dataFormat: { type: 'string' },
          dataState: { type: 'string' },
          dataStorage: { type: 'string' },
          apiIntegration: { type: 'string' },
          asIsSummary: { type: 'string' },
          asIsSteps: { type: 'array', items: asIsStepSchema },
          automationScore: { type: 'integer', description: '0から100の間の数値' },
          automationScoreRationale: { type: 'string', description: '自動化可能度評価の根拠を単文で記述' },
          humanDependency: { type: 'string', enum: ['high','medium','low'], description: '属人性（high/medium/low のいずれか）' },
          humanDependencyRationale: { type: 'string', description: '属人性評価の根拠を単文で記述' },
          notes: { type: 'string' },
          recommendedSolution: { type: 'string', description: '提案する具体的な解決策やアプローチ' },
          recommendedToolCategory: { type: 'string', enum: ['aiChat','noCodeTool','customAiChat','gas','systemDevelopment','other'], description: '指定の列挙値のみを使用（aiChat/noCodeTool/customAiChat/gas/systemDevelopment/other）' },
          toBeSummary: { type: 'string', description: '改善後の理想的な業務フローの要約' },
          toBeSteps: { type: 'array', items: toBeStepSchema },
          improvementImpact: { type: 'string', description: '改善によってもたらされるビジネス上のインパクトや利点の要約。重要な数値や結果は必要に応じて強調' },
          monthlySavedMinutes: { type: 'integer', description: '改善によって削減が見込まれる月間合計時間（分）' },
          savedMinuteDetails: { type: 'string', description: '削減時間の計算根拠を示す文字列。例: (改善前60分 - 改善後10分) × 月10回 = 500分' },
          advancedProposal: {
            type: 'object',
            properties: {
              title: { type: 'string', description: '一歩進んだ改善提案のタイトル' },
              description: { type: 'string', description: '高度な提案の具体的な内容' },
            },
          },
        },
        required: ['workId','title','recommendedToolCategory','automationScore']
      },
    },
    required: ['carte']
  } as const;

  const resp: any = await (model as any).generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: carteSchema
    } as any,
  } as any);
  const rawText = typeof resp.text === 'function' ? resp.text() : extractTextFromResponse(resp.response ?? resp);
  let jsonText = (rawText || '').trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7, jsonText.length - 3);
  else if (jsonText.startsWith('```')) jsonText = jsonText.substring(3, jsonText.length - 3);
  const parsed = JSON.parse(jsonText);
  if (!parsed.carte) throw new Error('Invalid data structure received from AI Logic');
  return parsed.carte as Carte;
};



