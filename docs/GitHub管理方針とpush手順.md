# GitHub管理方針とpush手順

作成日: 2026-05-09
更新日: 2026-05-10（特定フォルダのみpush手順を追加）

リポジトリ: https://github.com/ohtsuka-shota-se/samurai-repo

---

## リポジトリのバージョン管理方針

### 採用方針: フォルダ管理

```
samurai-repo/（リポジトリルート）
├── .gitignore
├── phase01/       ← Week 1: EC2 + S3 ファイル管理
│   ├── backend/
│   └── frontend/
├── phase02/       ← Week 2+: Cognito追加（将来）
│   ├── backend/
│   └── frontend/
└── phase03/       ← Week 3+: Bedrock連携（将来）
    ...
```

**ブランチではなくフォルダで管理する理由:**  
学習者は `git clone` と `git pull` だけ覚えればよい。ブランチ操作を教えなくて済む。

---

## 【開発者向け】push手順

### 初回push（リポジトリへの初回登録）

PowerShell で実行:

```powershell
cd C:\Users\ohtsu\Documents\AWS\claudecode

# Gitの初期化
git init

# push前チェック（node_modules や .env が含まれていないか確認）
git status

# ステージングとコミット
git add .
git commit -m "feat: phase01 S3ファイル管理アプリの初期実装"

# GitHubリポジトリと紐付けてpush
git remote add origin https://github.com/ohtsuka-shota-se/samurai-repo.git
git branch -M main
git push -u origin main
```

### push前の確認チェックリスト

- [ ] `.gitignore` に `node_modules/`・`dist/`・`.env`・`*.tsbuildinfo` が含まれている
- [ ] `phase01/backend/.env` が存在しないこと（`.env.example` はOK）
- [ ] `git status` の出力に `node_modules` が含まれていないこと

---

### フェーズ追加時のpush手順

新しいフェーズのコードが完成し、ローカルで動作確認が取れたら以下を実行:

```powershell
cd C:\Users\ohtsu\Documents\AWS\claudecode

# 変更内容を確認
git status
git diff

# ステージングとコミット
git add .
git commit -m "feat: phase02 Cognito認証追加"

# push
git push origin main
```

**コミットメッセージの例:**

| フェーズ | メッセージ例 |
|---------|------------|
| phase01 | `feat: phase01 S3ファイル管理アプリの初期実装` |
| phase02 | `feat: phase02 Cognito認証追加` |
| phase03 | `feat: phase03 Bedrock AI連携追加` |
| バグ修正 | `fix: phase01 ファイル削除時のエラーを修正` |

---

### 既存フェーズの修正をpushする手順

```powershell
cd C:\Users\ohtsu\Documents\AWS\claudecode

git add .
git commit -m "fix: phase01 [修正内容を簡潔に]"
git push origin main
```

---

### 特定のフォルダ・ファイルだけをpushする手順

`git add .` で全変更をまとめてステージングする代わりに、パスを指定することで特定フォルダだけをコミットできる。

**例: `docs/` だけを先にpushしたい場合**

```powershell
cd C:\Users\ohtsu\Documents\AWS\claudecode

# 変更の全体像を確認（ステージング前に把握しておく）
git status

# docs/ フォルダだけをステージング
git add docs/

# ステージングされた内容を確認（docs/ 以外が含まれていないことを確認）
git status

# コミット
git commit -m "docs: Phase 5 ハンズオン手順書を追加"

# push
git push origin main
```

**例: 特定のファイル1つだけをpushしたい場合**

```powershell
git add docs/05_Bedrock_ハンズオン手順.md
git commit -m "docs: Bedrock手順書を追加"
git push origin main
```

**例: 複数フォルダをまとめてpushしたい場合**

```powershell
# スペース区切りで複数指定できる
git add docs/ phase05/
git commit -m "feat: phase05 Bedrock AI分析を追加"
git push origin main
```

> **ポイント:** `git add` でステージングした内容だけがコミット対象になる。
> `git status` でステージング済み（緑）と未ステージング（赤）を確認してからコミットすること。

**よく使うシナリオ:**

| やりたいこと | コマンド |
|------------|---------|
| docsだけ先にpush | `git add docs/` |
| 特定フェーズだけpush | `git add phase05/` |
| 手順書1ファイルだけpush | `git add docs/05_Bedrock_ハンズオン手順.md` |
| 全変更をまとめてpush | `git add .`（従来通り） |

---

## 【学習者向け】pull手順

### 初回（ハンズオン初日）

```bash
# リポジトリをクローン
git clone https://github.com/ohtsuka-shota-se/samurai-repo.git

# クローンされたフォルダに移動
cd samurai-repo
```

### 毎回のハンズオン開始時（最新コードを取得）

```bash
cd samurai-repo

# 最新コードを取得
git pull
```

### 各フェーズのフォルダに移動

```bash
# Phase 01（Week 1）
cd phase01

# Phase 02（Week 2）
cd phase02
```

---

## 注意事項

- Claudeはpushを行わない。ローカルで動作確認後、人間がpushする。
- `.env` ファイル（S3バケット名・AWSキー等）は絶対にpushしない。
- 学習者には `git clone` と `git pull` のみ教える。ブランチ操作は教えない。
