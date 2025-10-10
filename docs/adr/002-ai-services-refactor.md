## 002 — AIサービス層の単一責務化と重複削除

- 日付: 2025-10-10
- ステータス: Accepted
- 影響範囲: `services/aiLogic.ts`, `hooks/useDiscoveryBot.ts`, `components/*`, `services/geminiService.ts`, 新規 `services/ai/*`

### 背景 / 動機

- 現在の `services/aiLogic.ts` は以下を単一ファイルで内包しており、可読性・保守性が低下している。
  - バックエンド選択とフォールバック（Vertex/Google）
  - チャット履歴と送信ストリーム管理
  - システムインストラクション／プロンプト定義
  - JSONレスポンスの抽出・パース
  - スキーマ定義（ランタイム）
  - 業務カルテの派生値計算（`monthlySavedMinutes` など）
- `services/geminiService.ts` が別クライアント・別スキーマで同等機能を重複実装しており未使用。混乱と保守負債の原因。
- プロダクトの方針として「シンプルな設計・可読性を優先」「防御的プログラミングは必要最小限」に合わせ、責務分割と重複削除を行う。

### 決定（Decision）

1) AIサービス層を以下に分割する（単一責務・読みやすい命名）。

```text
services/ai/
  aiBackends.ts        # getAI の取得/キャッシュ、BackendKind、runWithFallback
  chatSession.ts       # チャット履歴と sendMessageStream（当面1チャンクでも可）
  prompts.ts           # SYSTEM_INSTRUCTION と最終プロンプト buildFinalPrompt
  schemas.ts           # ランタイムJSONスキーマ（CARTE_SCHEMA など）
  responseParser.ts    # extractTextFromResponse, コードフェンス除去, JSON抽出
  carteGenerator.ts    # generateCarteData（生成→パース→派生値計算）
  index.ts             # 外部公開ファサード（createChat, generateCarteData）
```

2) 公開APIは維持する。
   - `createChat(): ChatLike`
   - `generateCarteData(chatHistory): Promise<Carte>`

3) 未使用の重複実装 `services/geminiService.ts` は削除する。

4) UI 互換性のため、日本語キーの読み取りフォールバック（`DashboardView` 等）は当面維持。Firestore データのキー正規化は別途マイグレーションで対応。

5) ログは最小限に整理（例: `[AI] <message>` の一貫フォーマット）。

### 非目標（Out of Scope）

- 認証・Firestore リポジトリの設計変更は対象外。
- 生成モデルやプロンプト内容の改善は本ADRでは扱わない。
- 既存データのキー正規化マイグレーション実装は別ADRで扱う。

### 影響（Implications）

- 参照元（`hooks/useDiscoveryBot.ts`、`components/ChatView.tsx`）は既存シグネチャのまま動作。
- 既存の `aiLogic.ts` は分割後に廃止（または `services/ai` への委譲のみ残して最終的に削除）。
- `services/geminiService.ts` を削除してもビルドに影響なし（未参照のため）。

### 実施手順（Phased Plan）

- フェーズ1: 分割と置き換え
  - `aiBackends.ts`, `prompts.ts`, `responseParser.ts`, `carteGenerator.ts`, `chatSession.ts`, `index.ts` を追加。
  - 既存 `aiLogic.ts` から上記に責務を移し、`aiLogic.ts` からエクスポートを `services/ai` ファサード経由に切替。

- フェーズ2: 削除・整理
  - `services/geminiService.ts` を削除。
  - `aiLogic.ts` は空洞化後に削除（または内部実装を `services/ai` 再エクスポートの薄いラッパーに変更し、利用側のimportを順次 `services/ai` に移行）。

- フェーズ3: 改善（任意）
  - 真のストリーミング実装へ移行（チャンクを逐次UIへ）。
  - ログ整備、命名の微修正、ドキュメント更新。

- フェーズ4: データ正規化（別ADR）
  - Firestore 上の日本語キーを英語キーへ正規化する一括マイグレーション。
  - UI の日本語キー読み取りフォールバックを撤廃。

### リスクと緩和策

- 既存データの日本語キー混在: UIのフォールバック継続で閲覧は担保。後日マイグレーションで解消。
- ストリーミング仕様差異: 当面は1チャンクでも動作し、後方互換を維持したまま改善可能。

### 代替案と却下理由

- 代替案: 現状の巨大ファイルを維持しコメントで補強。
  - 却下理由: 可読性・変更容易性が根本的に改善されない。属人化の温床。

### 完了条件（Definition of Done）

- ビルド・型チェックが通ること。
- `createChat` / `generateCarteData` の利用側コード変更が不要であること（もしくはimport先の差し替えのみ）。
- `services/geminiService.ts` が削除されていること。
- 手動スモークテスト: 会話開始→指示→`[GENERATE_CARTE]`→カルテ生成→ダッシュボード表示が通る。

### メモ

- 環境変数は現行の `VITE_*` 系を継続利用（`firebaseClient.ts` に依存）。


