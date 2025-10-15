# Firestore データベースのバックアップ運用ガイド

AX Copilot プロジェクトで Firestore データを定期的に保護・復旧するための手順をまとめています。  
「Scheduled Backups」を基本とし、必要に応じて Point-in-time Recovery (PITR) や手動エクスポートを組み合わせます。

---

## 1. 前提と権限
- Firebase/Firestore プロジェクトが **Blaze プラン**であること。
- 対象データベースが Cloud Firestore **Native モード**（通常の `(default)` データベース想定）。
- 実施者が以下の IAM 権限を保有していることが望ましい。
  - バックアップの作成・更新: `roles/datastore.backupSchedulesAdmin`
  - バックアップからの復旧: `roles/datastore.restoreAdmin`
- Billing が有効化されていること（バックアップ保存と復旧にコストが発生します）。

---

## 2. Scheduled Backups の設定手順（Firestore コンソール）
1. ブラウザで [Google Cloud Console](https://console.cloud.google.com/) にアクセスし、対象プロジェクトを選択。
2. 左メニューから **Firestore Database** → **Databases** を開く。
3. バックアップ対象データベース（例: `(default)`）行の「Scheduled backups」列で **View backups** または **Edit settings** をクリック。
4. 画面右上の **Edit** を押し、バックアップ設定パネルを開く。
5. 以下を必要に応じて設定。
   - **Daily backup**: 日次バックアップを有効化し、保持期間（最大 14 週間）を入力。
   - **Weekly backup**: 週次バックアップが必要ならチェックを入れ、実行曜日と保持期間を指定。
   - Daily / Weekly はそれぞれ 1 件ずつ設定でき、両方併用も可能。
6. **Save** で確定。保存後、指定頻度でバックアップが自動取得されます。

> 実行時刻は Google 側で最適化されるため任意指定はできません。  
> 取得済みバックアップは保持期間前でも手動削除が可能です。

---

## 3. バックアップ状況の確認
- Databases ページの **Backups** タブで、取得済みバックアップの一覧（取得日時・保持期限・サイズなど）を確認できます。
- 重要なバックアップにはメモを残し、保持期間とリカバリ要件（RPO/RTO）の整合性を定期レビューしてください。

---

## 4. 復旧手順（Scheduled Backup → 新データベース）
Scheduled Backup から復旧する際は **既存データベースを上書きできません**。常に **新しい Firestore データベース**を作成し、必要に応じてデータ移行します。

1. Databases ページで **Backups** タブを開く。
2. 復旧したいバックアップ行を選択し、右側の **Restore** をクリック。
3. 復旧先として新しいデータベース名を指定（例: `restore-20251015`）。リージョンは元データベースと同一である必要があります。
4. 確認ダイアログの内容を確認し、**Restore** を実行。
5. 復旧後、新データベースを検証し、必要なコレクションのみ既存環境へ移行する（手動コピー、スクリプト、またはアプリケーション経由で書き戻し）。

> 復旧先のデータベースはプロジェクト内に追加料金が発生します。不要になった時点で削除してください。

---

## 5. 追加保護オプション

### Point-in-time Recovery (PITR)
- 最大 7 日間、**1 分刻み**で過去状態にアクセスできます。
- Firestore コンソールの Disaster recovery 画面で有効化し、誤削除・誤更新時に短時間で巻き戻しが可能。
- PITR だけでは長期保存はできないため、Scheduled Backups との併用が推奨です。

### Cloud Storage への手動エクスポート
- Cloud Scheduler + Cloud Functions / Cloud Run で `gcloud firestore export` を定期実行すると、長期保管や別プロジェクトでの検証が可能になります。
- 実行時はドキュメントごとに 1 件の読み取り課金が発生するため、データ量に注意してください。

---

## 6. 運用ガイドライン
- **定期レビュー**: バックアップ保持期間・コストを四半期ごとに見直し、要件に沿っているか確認。
- **復旧訓練**: 年 1 回程度、バックアップからのリストア手順をリハーサルし、手順書の更新と担当者の習熟を図る。
- **権限管理**: バックアップ設定と復旧操作を行うサービスアカウントやメンバーに最小限の IAM ロールを付与し、監査ログを有効活用する。
- **通知**: 必要に応じて Cloud Logging / Monitoring でバックアップ失敗時の通知ルールを整備する。

---

### 参考情報
- [Scheduled Backups & PITR - Firestore Docs](https://firebase.google.com/docs/firestore/backups)
- [Disaster Recovery Planning](https://firebase.google.com/docs/firestore/disaster-recovery)
- [Cloud Firestore Export/Import](https://firebase.google.com/docs/firestore/manage-data/export-import)

