# Cognito セットアップ手順（Phase 2 ハンズオン）

作成日: 2026-05-09

対象: AWS未経験者向けハンズオン（2回目）

---

## ゴール

ログインしたユーザーだけがS3ファイル管理アプリを使えるようにする。

## 全体の流れ

```
[1] Cognitoユーザープール作成
    ↓
[2] アプリクライアント作成
[3] フロントエンドの .env 設定
    ↓
[4] バックエンドの .env 設定
    ↓
[5] EC2でアプリを更新・起動
    ↓
[6] ブラウザで動作確認（登録→確認→ログイン）
```

---

## [1] Cognitoユーザープール作成

1. AWSマネジメントコンソール → 「Cognito」を開く
2. 「ユーザープールを作成」をクリック
3. 以下を設定:

**認証プロバイダーの設定**
- サインインオプション: **メールアドレス** にチェック

**パスワードポリシー**
- デフォルトのまま（8文字以上・大文字・小文字・数字・記号を含む）

**Multi-factor authentication**
- 「MFAなし」を選択

**ユーザーアカウントの復元**
- デフォルトのまま

**メッセージ配信**
- メールプロバイダー: **Cognitoで送信**（デフォルト）

**アプリの統合タブ**
- ユーザープール名: `handson-user-pool`
- アプリクライアント名: `handson-app-client`
- クライアントシークレット: **シークレットなし** を選択 ← 重要

4. 「ユーザープールを作成」をクリック

---

## [2] 作成後の情報をメモする

ユーザープールの詳細画面で以下をメモ:

| 項目 | 場所 | 例 |
|------|------|-----|
| ユーザープールID | 「概要」タブ | `ap-northeast-1_AbCdEfGhI` |
| クライアントID | 「アプリの統合」タブ → アプリクライアントのリスト | `1abc2def3ghi4jkl5mno6pqr` |

---

## [3] フロントエンドの .env 設定

**実行場所: `~/samurai-repo/phase02/frontend`**

```bash
cd ~/samurai-repo/phase02/frontend
cp .env.example .env
nano .env
```

以下のように書き換える:

```
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxxx   ← メモしたユーザープールID
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx    ← メモしたクライアントID
```

保存して終了: `Ctrl + O` → `Enter` → `Ctrl + X`

---

## [4] バックエンドの .env 設定

**実行場所: `~/samurai-repo/phase02/backend`**

```bash
cp .env.example .env
nano .env
```

以下のように書き換える（S3バケット名は Phase 1 と同じ）:

```
S3_BUCKET_NAME=handson-yamada-files
COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxxx    ← メモしたユーザープールID
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx     ← メモしたクライアントID（バックエンドでは使用しないが記録として）
```

保存して終了: `Ctrl + O` → `Enter` → `Ctrl + X`

---

## [5] EC2でアプリを更新・起動

**実行場所: `~/samurai-repo`**

```bash
cd ~/samurai-repo
git pull

# フロントエンドをビルド
cd phase02/frontend
npm install
npm run build

# バックエンドをセットアップ・起動
cd ../backend
npm install
npm run build
npm start
```

以下のように表示されれば起動成功:

```
サーバー起動: http://localhost:3000
S3バケット: handson-yamada-files
```

---

## [6] ブラウザで動作確認

ブラウザで以下にアクセス:

```
http://[EC2のパブリックIP]:3000
```

### 動作確認チェックリスト

**新規登録フロー:**
- [ ] ログイン画面が表示される
- [ ] 「新規登録」タブをクリックできる
- [ ] メールアドレス・パスワードを入力して「登録する」を押すと確認コード入力画面になる
- [ ] 登録したメールに6桁のコードが届く
- [ ] コードを入力すると自動的にログインされてアプリ画面に遷移する

**ログインフロー:**
- [ ] ログアウトボタンを押すとログイン画面に戻る
- [ ] 登録したメール・パスワードでログインできる
- [ ] ヘッダーにメールアドレスが表示される

**認証後の操作:**
- [ ] Phase 1 と同様にファイルのアップロード・一覧・ダウンロード・削除ができる
- [ ] ログアウト後にファイル一覧を取得しようとすると「401 認証が必要です」が返る（ブラウザの開発者ツールで確認）

---

## トラブルシューティング

### ログイン後に「ファイル一覧の取得に失敗しました」と表示される

バックエンドの `.env` に `COGNITO_USER_POOL_ID` が設定されていないか間違っている。

```bash
cat ~/samurai-repo/phase02/backend/.env
```

で内容を確認し、正しいユーザープールIDを設定する。

---

### 「クライアントシークレットが必要です」系のエラーが出る

Cognito アプリクライアントを作成する際に「クライアントシークレットを生成する」にチェックが入っている。

→ アプリクライアントを削除して「**シークレットなし**」で作り直す。

---

### メール確認コードが届かない

- 迷惑メールフォルダを確認する
- Cognito の送信元は `no-reply@verificationemail.com`
- 5分以上経っても届かない場合は再度サインアップを試す

---

## 仕組みの説明（学習者向け）

```
[ブラウザ]
  ↓ email + password
[Cognito]（認証サーバー）
  ↓ 成功したら JWT トークンを発行
[ブラウザ（トークンを保存）]
  ↓ リクエストのたびに Authorization: Bearer [トークン] を付与
[EC2 Express バックエンド]
  ↓ トークンを検証（Cognito の公開鍵で署名確認）
  ↓ 正当なトークンなら処理を続ける
[S3]
```

**JWT（JSON Web Token）** とは何か:
- ユーザーが本当にログイン済みであることを証明するデジタル証明書のようなもの
- Cognito が署名し、バックエンドが Cognito の公開鍵で検証する
- 有効期限（デフォルト1時間）が切れると再ログインが必要になる

---

## ハンズオン終了時の注意

EC2を停止する手順は Phase 1 と同じ。Cognito は停止不要（無料枠：月5万MAUまで無料）。
