# ローカル開発環境でのrun dev手順

作成日: 2026-05-09

対象: 開発者（アプリを実装・確認する人）。学習者向けではない。

---

## ローカルとEC2の違い

| 項目 | ローカル（開発者） | EC2（学習者） |
|-----|----------------|------------|
| AWS認証情報 | `aws configure` または `.env` に記述 | IAMロールが自動提供（設定不要） |
| アクセスURL | http://localhost:5173 | http://[EC2のIP]:3000 |
| 起動方法 | `npm run dev`（ホットリロードあり） | `npm start`（ビルド済みを起動） |
| フロントエンド | Viteの開発サーバー（5173番ポート） | Expressが配信（3000番ポート） |

---

## 前提条件

- Node.js 22.x がインストール済み
- AWSアカウントにアクセスできるIAMユーザーが存在する
- 動作確認用のS3バケットが作成済み

---

## [1] AWSの認証情報を設定する

ローカルではEC2のIAMロールが使えないため、別途認証情報を用意する。

### 方法A: AWS CLIで設定（推奨）

```bash
# AWS CLIが入っていない場合はインストール
# https://aws.amazon.com/jp/cli/

aws configure
```

以下を入力:
```
AWS Access Key ID: [IAMユーザーのアクセスキー]
AWS Secret Access Key: [IAMユーザーのシークレットキー]
Default region name: ap-northeast-1
Default output format: json
```

設定すると `~/.aws/credentials` に保存され、AWS SDKが自動的に読み込む。

### 方法B: .envファイルに直接書く

```bash
# phase01/backend/.env.example をコピーして .env を作成
cp phase01/backend/.env.example phase01/backend/.env
```

`.env` を編集:
```
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

> ⚠️ `.env` は絶対にGitHubにpushしない。`.gitignore` に含まれているので通常は問題ない。

---

## [2] S3バケット名を設定する（方法Aの場合）

方法Aを使う場合、S3バケット名は `.env` ファイルで設定する。

```bash
cp phase01/backend/.env.example phase01/backend/.env
```

`.env` を編集してバケット名だけ記入:
```
S3_BUCKET_NAME=your-bucket-name
```

---

## [3] 依存パッケージのインストール

> ⚠️ **重要: npm install は必ず Windows PowerShell から実行すること**
>
> WSL（Linux）側で `npm install` を実行すると、`ts-node-dev` や `vite` などのコマンドが
> Linux用バイナリとしてインストールされる。その結果、Windows側から `npm run dev` を
> 実行したときに「コマンドが認識されません」というエラーが発生する。
>
> → **Windows PowerShell を開いて** 以下を実行すること。

```powershell
# Windowsの場合（PowerShell）
cd C:\Users\ohtsu\Documents\AWS\claudecode\phase01

# phase01レベルのパッケージ（concurrently）をインストール
npm install

# backendのパッケージをインストール
npm install --prefix backend

# frontendのパッケージをインストール
npm install --prefix frontend
```

```bash
# Mac の場合（ターミナル）
cd ~/Documents/AWS/claudecode/phase01
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## [4] 開発サーバーを起動する

> npm install と同様に、**Windows PowerShell から実行すること**。

```powershell
# Windowsの場合（PowerShell）
# phase01/ フォルダで実行
cd C:\Users\ohtsu\Documents\AWS\claudecode\phase01
npm run dev
```

```bash
# Mac の場合
cd ~/Documents/AWS/claudecode/phase01
npm run dev
```

以下のように表示されたら起動成功:

```
[backend]  サーバー起動: http://localhost:3000
[backend]  S3バケット: your-bucket-name
[frontend] Local:   http://localhost:5173/
[frontend] Network: use --host to expose
```

ブラウザで **http://localhost:5173** を開くとアプリが表示される。

---

## 仕組みの説明

```
ブラウザ(5173)
    ↓ /api/* のリクエスト
Vite開発サーバー(5173) ─── プロキシ ──→ Expressバックエンド(3000)
                                              ↓ AWS SDK
                                           S3バケット
```

Viteの `vite.config.ts` に以下の設定があるため、`/api` で始まるリクエストは自動的にバックエンドへ転送される:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

---

## 停止方法

ターミナルで `Ctrl + C` を押す。

---

## トラブルシューティング

### `ts-node-dev : 用語 'ts-node-dev' は...コマンドレットの名前として認識されません` というエラーが出る

WSL（Linux）側で `npm install` を実行したため、Windows用の `.cmd` ファイルが作成されていない。

**対処:**
1. WSLのターミナルを閉じる
2. **Windows PowerShell** を開く
3. `cd C:\Users\ohtsu\Documents\AWS\claudecode\phase01` に移動
4. `npm install`、`npm install --prefix backend`、`npm install --prefix frontend` を再実行する

---

### `S3バケット: 未設定` と表示される

`phase01/backend/.env` が存在しないか、`S3_BUCKET_NAME` が空。
`.env` ファイルを作成してバケット名を設定する。

### 「ファイル一覧の取得に失敗しました」と表示される

AWS認証情報が設定されていないか、S3バケット名が間違っている。
`aws configure` で認証情報を確認するか、`.env` を確認する。

### ポート3000が既に使用中

他のプロセスが3000番を使っている。`phase01/backend/.env` に `PORT=3001` を追記し、
`phase01/frontend/vite.config.ts` のプロキシも `http://localhost:3001` に変更する。
