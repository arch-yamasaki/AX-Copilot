
# AX Copilot

インタラクティブなヒアリングを通じて業務カルテを生成・可視化する React + Vite 製アプリケーションです。Gemini API を用いたチャット体験と、カルテのダッシュボード表示を組み合わせています。

---

## 技術スタック概要
- **フロントエンド**: React 19, TypeScript, Vite, Tailwind (CDN)、Recharts、Framer Motion
- **AI 連携**: Gemini 2.5 Flash (Google AI Studio / @google/genai)
- **推奨バックエンド基盤**: Firebase (Authentication, Firestore, Cloud Functions)
- 

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

### Cloud Functions 側
将来的に Gemini API 呼び出しを Functions へ移す際は、以下いずれかの方法でキーを安全に保持します。
1. `.runtimeconfig.json` / `firebase functions:config:set` を使用
   ```sh
   firebase functions:config:set gemini.api_key="your-gemini-api-key"
   ```
2. `functions/.env`（Functions v2 の dotenv 対応）に記入し、`.gitignore` を確認

---

## 3. ローカル開発
1. 依存関係インストール
   ```sh
   pnpm install
   # または npm install
   ```
2. (任意) Firebase Emulator を動かす場合
   ```sh
   firebase emulators:start --only auth,firestore,functions
   ```
3. フロントエンド開発サーバー起動
   ```sh
   pnpm dev
   # npm run dev でも可
   ```
4. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

> 現時点ではカルテ保存が `localStorage` ベースです。Firebase 連携後は `services/` 配下に追加するリポジトリ層を通じて Firestore を利用する想定です。

---

## 4. Firebase 連携の実装ガイド（概要）
1. `services/firebaseClient.ts` を作成し `initializeApp` と `getAuth` / `getFirestore` / `getFunctions` をエクスポート
2. `services/authService.ts` でサインイン／サインアウト処理をラップし、`App.tsx` のビュー制御へ接続
3. `services/carteRepository.ts` で Firestore CRUD を定義。`App.tsx` が使用している `localStorage` ロジックを置き換え
4. Gemini 呼び出しを Cloud Functions callable (`generateCarte`) へ移行し、`services/geminiService.ts` はクライアント -> Functions 呼び出しに変更
5. Firestore セキュリティルール例
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/cartes/{carteId} {
         allow read, write: if request.auth != null
           && request.auth.uid == userId
           && request.auth.token.email.matches('.*@example.com$');
       }
     }
   }
   ```
6. ドメイン制限を行う場合は Auth Blocking Functions (`beforeUserCreated`) で `user.email` をチェック

---

## 5. デプロイ

### 5-1. Firebase Hosting + Cloud Functions
1. ビルド
   ```sh
   pnpm build
   ```
2. Cloud Functions をデプロイ（Gemini 連携を追加した場合）
   ```sh
   firebase deploy --only functions
   ```
3. フロントを Hosting へデプロイ
   ```sh
   firebase deploy --only hosting
   ```
4. 必要に応じて Firebase Hosting のリライトルールで API を Cloud Functions / Cloud Run へ転送
5. ドメイン制限が必要な場合
   - Auth Blocking Functions で許可ドメインのみ通す
   - さらに厳格化したい場合は Cloud IAP + Allowed Domains を併用

### 5-2. Cloud Run（オプション）
Firebase Hosting ではなく Cloud Run から配信したい場合は、次の Docker 流れを取ります。
1. ルートに `Dockerfile` を作成（例: Node.js か Nginx で `dist` を配信）
2. コンテナビルド・プッシュ
   ```sh
   gcloud builds submit --tag "gcr.io/PROJECT_ID/ax-copilot"
   ```
3. Cloud Run へデプロイ
   ```sh
   gcloud run deploy ax-copilot \
     --image "gcr.io/PROJECT_ID/ax-copilot" \
     --platform managed \
     --region asia-northeast1 \
     --allow-unauthenticated
   ```
4. IAP で保護する場合は HTTPS ロードバランサを経由し、Allowed Domains で社内ドメインに限定

---

## 6. トラブルシューティング
- **Gemini API 401**: `.env.local` の `GEMINI_API_KEY` または Functions 側のキー設定を確認
- **Firebase Auth でドメイン制限が効かない**: Blocking Functions のデプロイ状況や正規表現を再確認
- **Firestore Permission denied**: ルールに許可ドメイン条件を入れている場合、`request.auth.token.email` が期待通りか Emulator で確認
- **Cloud Run からの配信が 502 になる**: `PORT` 環境変数でアプリがリッスンしているか、`npm run preview` でローカルチェック

---

## 参考リンク
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firebase Auth Blocking Functions](https://firebase.google.com/docs/functions/auth-blocking-events)
- [Cloud IAP Allowed Domains](https://cloud.google.com/iap/docs/allowed-domains)
- [Deploying React Apps to Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy)
- [Google AI Studio](https://ai.google.dev/)
