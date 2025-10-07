export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  suggestions?: string[];
}

export type ToolCategory = 
    '生成AIチャット (Gemini, ChatGPT)' | 
    'ノーコード連携 (Zapier, Power Automate)' | 
    'カスタムAIチャットボット (GPTs, Gemini)' | 
    'GAS (Google Apps Script)' | 
    'コード開発 (AI Studio, Vertex AI)' | 
    'その他';

export interface Carte {
    業務ID: string;
    業務タイトル: string;
    業務カテゴリ: string;
    頻度: string;
    月間回数: number;
    総時間_分: number; // AsIs time per task
    工程数: number;
    主要ツール: string;
    現状のボトルネック: string[];
    主要データ: string;
    データ形式: string;
    データ状態: string;
    データ保存場所: string;
    API連携: string;
    AsIsフロー要約: string;
    asIsSteps: AsIsStep[]; // Embedded AsIs steps
    自動化可能度: number;
    自動化可能度根拠: string; // New field for automation potential rationale
    属人性: string;
    属人性根拠: string;
    備考: string;
    推奨ソリューション: string;
    推奨ツールカテゴリ: ToolCategory;
    ToBeフロー要約: string;
    toBeSteps: ToBeStep[]; // Embedded ToBe steps
    改善インパクト: string;
    月間削減時間_分: number;
    削減時間詳細: string;
    高度な提案: { // New field for advanced suggestions
        タイトル: string;
        説明: string;
    };
}

export interface AsIsStep {
    業務ID: string;
    工程No: number;
    AsIsステップ名: string;
    実行主体: string;
    使用ツール: string;
    時間_分: number;
    インプット: string;
    アウトプット: string;
    データ状態: string;
}

export interface ToBeStep {
    業務ID: string;
    工程No: number;
    ToBeステップ名: string;
    実行主体: '手動' | '自動化';
    使用ツール: string;
    時間_分: number;
    改善のポイント: string;
}

export type Answers = {
  [key: string]: string | null;
};