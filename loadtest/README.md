# AI API 負荷テスト

このディレクトリには、AX Copilotアプリケーションが使用するAIサービスの負荷テストを実行するためのNode.jsベースのスクリプトが含まれています。

## 目的

AIバックエンド（Vertex AIとGoogle AI）の性能と安定性を、同時リクエスト（負荷）がかかった状態で測定します。
主な測定指標は以下の通りです。

-   **レイテンシ**: 応答にかかる時間
-   **成功率**: API呼び出しが成功した割合
-   **スループット**: 単位時間あたりに処理できるリクエスト数

## セットアップ

1.  **依存パッケージのインストール**:
    ```bash
    pnpm install
    ```

2.  **.envファイルの作成**:
    プロジェクトのルートディレクトリ（`package.json`と同じ場所）に`.env`ファイルを作成し、Firebaseプロジェクトの認証情報を記述します。

    ```dotenv
    # Node.js環境でFirebaseを初期化するために必須
    VITE_FIREBASE_API_KEY="your-api-key"
    VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
    VITE_FIREBASE_PROJECT_ID="your-project-id"
    VITE_FIREBASE_APP_ID="your-app-id"
    ```

## 実行方法

プロジェクトルートから以下のコマンドを実行します。

```bash
pnpm run test:load [オプション]
```

### オプション

-   `--scenario <名前>`: 実行するテストシナリオを指定します。
    -   `stream` (デフォルト): チャットのストリーム応答をテストします。
    -   `carte`: 業務カルテのJSON生成をテストします。
-   `--concurrency <数値>`: リクエストの並列実行数を指定します。(デフォルト: `5`)
-   `--total <数値>`: 実行するリクエストの総数を指定します。(デフォルト: `20`)

### 実行例

**デフォルト設定で実行:**
```bash
pnpm run test:load
```

**カルテ生成を並列数10、合計100回実行:**
```bash
pnpm run test:load --scenario carte --concurrency 10 --total 100
```

## 出力結果

-   **コンソール**: 成功率や平均応答時間などのサマリーがコンソールに表示されます。
-   **CSVレポート**: 各リクエストの詳細な結果が`loadtest/results/`ディレクトリ内にCSVファイルとして保存されます。
