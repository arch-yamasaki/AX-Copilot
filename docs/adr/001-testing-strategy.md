## ADR: Vitest による認証・チャット・カルテ保存フローのテスト戦略

- 日付: 2025-10-10
- ステータス: Accepted
- 参照: App.tsx, components/ChatView.tsx, hooks/useDiscoveryBot.ts, services/{authService, carteRepository, aiLogic}.ts

### コンテキスト
本プロダクトは、Firebase Auth/Firestore と AI 生成ロジック（`services/aiLogic.ts`）に依存し、以下のフローで動作する。

1) 認証監視（`observeAuth`）でログイン状態を検知し、`App.tsx` が初期データ（`listCartes`）をロードしてビューを切替。
2) チャット進行（`ChatView` → `useDiscoveryBot`）で、AI応答を逐次受け取り、最終的に `[GENERATE_CARTE]` を検知後に `generateCarteData` を実行。
3) 生成されたカルテを `addCarte` で保存し、ダッシュボードに反映。

外部依存（Firebase/Auth/Firestore/AI）はネットワークを伴い不安定・遅い。UI 結合に近い軽量なテストで振る舞いを担保しつつも、テストの読みやすさを最優先にするため、外部依存はテストごとに最小限のモックで置き換える。

### 決定（Decision）
- テストランナーに Vitest、環境に jsdom、UI 操作に Testing Library を採用する。
- 外部依存（`services/authService`, `services/carteRepository`, `services/aiLogic`）は各テストでモックする。
- 最小の結合テストを 2 本作成する：
  - テスト1: ログイン済みのときチャット画面（またはログアウトボタン）が表示される。
  - テスト2: 複数回のチャット往復の後、`[GENERATE_CARTE]` → `generateCarteData` → `addCarte` が呼ばれ、ダッシュボードに新規カルテが表示される。
- 防御的プログラミングは行わず、モックは「想定通りのハッピー経路」のみを用意する。
- 重複する旧実装（`services/geminiService.ts`）はテスト対象外とし、`services/aiLogic.ts` を正とする。

### 代替案の検討
- E2E（Playwright など）: 実ブラウザ・実 Firebase と統合可能だが、セットアップ負荷・実行時間・テストの不安定さが増すため現時点では不採用。
- より細粒度のユニットテスト拡充: 実装変更に対して脆くなり読みやすさが下がるため、本 ADR のスコープでは最小限に留める。

### 影響（Consequences）
- 利点
  - テストが短く・読みやすく・速い（外部 I/O を全てモック）。
  - 主要なユーザ価値（ログイン→チャット→カルテ保存）の回帰を素早く検知できる。
- 欠点
  - 実インフラ差異（Auth/Firestore/AIの実挙動）は検証しない。
  - モックと実装の乖離リスクはある（ただし読みやすさを優先し割り切る）。

### 実装計画（非コード変更の方針）
1) 依存追加（devDependencies）：
   - `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
2) 設定:
   - `vitest.config.ts` に `test.environment = 'jsdom'`, `test.setupFiles = ['tests/setup.ts']`
   - `tests/setup.ts` で `import '@testing-library/jest-dom/vitest'`
3) モック方針:
   - `services/authService`: `observeAuth(cb)` は即時に `cb({ uid: 'u1' })` を呼ぶ。
   - `services/carteRepository`: `listCartes` は `[]`; `addCarte` はスパイ。
   - `services/aiLogic`: `createChat().sendMessageStream` は 3〜4 ステップで最終的に `[GENERATE_CARTE]` を返す簡易ストリーム。`generateCarteData` は固定 `Carte` を返す。
4) テスト構成:
   - `tests/App.auth.test.tsx`: テスト1（ログイン UI 表示）
   - `tests/App.chat-carte.test.tsx`: テスト2（チャット後にカルテ登録）
   - 任意: `tests/useDiscoveryBot.test.ts`（単体で `onCarteGenerated` が呼ばれること）
5) 実行スクリプト:
   - `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`

### スコープ/原則
- 可読性最優先・防御的分岐は不要。
- テストは「モック前提のハッピー経路」に集中。
- 将来的に E2E を追加して実インフラ差異を補完する余地を残す。


