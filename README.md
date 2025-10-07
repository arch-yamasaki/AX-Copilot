<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1k-eAMBQeuoQ5uVUusUDSBSE7gYLJQR2K

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## プロジェクト要件

### 認証・アクセス制御
- OAuth認証を実装し、**社用ドメインのみ**から(or 登録したアドレスのみから)のアクセスに制限する
- Google Workspaceの組織ドメイン制限を使用して、承認されたドメインのユーザーのみがログイン可能にする

### インフラ・デプロイ
- **Firebase**もしくは**Cloud Run**へのデプロイを前提とした構成にする
- スケーラビリティとコスト効率を考慮した設計

### データ永続化
- ユーザーごとの会話履歴を永続化し、後から参照可能にする
- 生成されたカルテ(Carte)データも保存し、ダッシュボードで管理できるようにする