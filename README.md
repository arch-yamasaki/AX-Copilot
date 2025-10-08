
# AX Copilot

インタラクティブなヒアリングを通じて業務カルテを生成・可視化する React + Vite 製アプリケーションです。Gemini API を用いたチャット体験と、カルテのダッシュボード表示を組み合わせています。

---

## 技術スタック概要
- **フロントエンド**: React 19, TypeScript, Vite, Tailwind (CDN)、Recharts、Framer Motion
- **AI 連携**: Gemini 2.5 Flash (Google AI Studio / @google/genai)
- **推奨バックエンド基盤**: Firebase (Authentication, Firestore, Cloud Functions)
- 

---

## 認証必須とホーム導線（重要）

- 本アプリは **ログイン必須** です。未ログイン時は常にホーム（ランディング）画面のみが表示され、アプリ本編（チャット/ダッシュボード）はアクセスできません。
- ホーム画面（`components/HomeView.tsx`）にはサービス概要と「Googleでログイン」ボタンのみを配置しています。
- ログイン完了後にチャット/ダッシュボードへ遷移し、以降はヘッダーのタブで切り替え可能です。
- ドメイン制限を行う場合は、クライアント側での簡易チェック（許可ドメイン以外は即サインアウト）に加え、必要に応じて Firestore ルールで補強してください。

関連ファイル:
- `App.tsx`: 認証状態を監視し、未ログイン時は `HomeView` のみ表示。ログイン時のみチャット/ダッシュボードのナビを表示。
- `components/HomeView.tsx`: ランディングとログインCTA。
- `services/authService.ts`: Googleサインイン/サインアウト、簡易ドメイン判定。

---

## 0. 事前準備
1. **Node.js 18+** と **pnpm 8+**（または npm）をインストール
2. **Firebase CLI** をセットアップ
   ```sh
   npm install -g firebase-tools
   firebase login
   ```
3. **gcloud CLI** が未導入の場合は [インストール](https://cloud.google.com/sdk/docs/install) し、`gcloud auth login` を実行
4. **Gemini API キー** を [Google AI Studio](https://ai.google.dev/aistudio) から取得
5. Firebase で使用する Google Cloud プロジェクト（必要に応じて Identity Platform を有効化）を用意

---

## 1. Firebase プロジェクト設定
Firebase をバックエンドに採用する際は、以下の初期設定を行います。

1. Firebase コンソールで新規プロジェクトを作成
2. **Authentication**
   - メールリンク、Google サインインなど必要なプロバイダを有効化
   - ドメイン制限が必要な場合は Auth Blocking Functions を使う予定である旨を確認
3. **Firestore**
   - Native モードで有効化
   - セキュリティルールは後述のテンプレートを参考に調整
4. **Cloud Functions**
   - `firebase init functions` で TypeScript / npm (または pnpm) を選択
   - Gemini との連携用 callable function を追加予定
5. **プロジェクト構成ファイルに Firebase Web App 設定を追加**
   - Firebase コンソールで Web アプリを追加し、Config を取得

---

## 2. 環境変数の準備

### フロントエンド (`.env.local`)
プロジェクト直下に `.env.local` を作成し、以下を記入します。Firebase 連携前でも既存構成で `GEMINI_API_KEY` が必要です。
```
# Gemini (既存フロント実装用)
GEMINI_API_KEY=your-gemini-api-key

# Firebase 連携時に利用
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:xxxx:web:xxxx
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxx
VITE_GEMINI_FUNCTION_NAME=generateCarte   # callable function 名 (例)
```
> `.env.local` は `.gitignore` 済みです。そのままコミットしないでください。

## 2. ローカル開発
1. 依存関係インストール
   ```sh
   pnpm install
   # または npm install
   ```
2. フロントエンド開発サーバー起動
   ```sh
   pnpm dev
   # npm run dev でも可
   ```
3. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

> 現時点ではカルテ保存が `localStorage` ベースです。Firebase 連携後は `services/` 配下に追加するリポジトリ層を通じて Firestore を利用する想定です。

---


## 3. デプロイ

### 3-1. Firebase Hosting 
1. ビルド
   ```sh
   pnpm deploy:all
   ```
2. ルールだけ
   ```sh
   pnpm deploy:rules
   ```


