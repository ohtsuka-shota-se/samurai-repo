# Phase 10: ECS/Fargate ハンズオン手順

作成日: 2026-05-30

対象: AWS未経験者向けハンズオン（10回目）

---

## 前提条件

| 前提条件 | 確認方法 |
|---------|---------|
| Phase 06 の ALB が起動していること | EC2 コンソール → ロードバランサー → `handson-alb` が `active` |
| Phase 09 の CodeCommit・CodePipeline が動作していること | CodePipeline コンソール → `handson-pipeline` が成功している |
| `handson-ec2-role` が存在していること | IAM コンソール → ロール → `handson-ec2-role` を確認 |

---

## 完成後イメージ

```
ローカルで git push
    ↓
CodeCommit → CodePipeline
    ↓
CodeBuild（Docker イメージをビルド → ECR に push → ECS サービス更新）
    ↓
ECS/Fargate（コンテナが自動起動）
    ↓
ALB（handson-alb）→ ECS サービス（コンテナ）
    ↓
アプリに変更が反映される
```

---

## 環境イメージ

```mermaid
graph TB
    Dev["💻 ローカル（開発者）"]

    subgraph AWS["AWS クラウド (ap-northeast-1)"]
        CC["📦 CodeCommit\nhandson-repo"]
        CP["🔁 CodePipeline\nhandson-ecs-pipeline"]
        CB["🔨 CodeBuild\nhandson-ecs-build"]
        ECR["🐳 ECR\nhandson-app"]
        ALB["⚖️ ALB\nhandson-alb"]

        subgraph ECS["ECS クラスター: handson-cluster"]
            SVC["ECS サービス\nhandson-service"]
            T1["🟦 Fargate タスク\n（コンテナ）"]
        end

        DDB["🗄️ DynamoDB"]
        S3["🪣 S3"]
        Cognito["🔐 Cognito"]
    end

    Dev -->|git push| CC
    CC --> CP
    CP --> CB
    CB -->|docker push| ECR
    CB -->|ecs update-service| SVC
    ECR -->|イメージ取得| T1
    ALB --> SVC
    T1 --> DDB
    T1 --> S3
    T1 --> Cognito
```

---

## 全体の流れ

```
[1] Dockerfile を作成する
    ↓
[2] ECR リポジトリを作成する
    ↓
[3] ECS 用 IAM ロールを準備する
    ↓
[4] ECS クラスターを作成する
    ↓
[5] タスク定義を作成する
    ↓
[6] ALB にターゲットグループを追加する
    ↓
[7] ECS サービスを作成する
    ↓
[8] 動作確認
    ↓
[9] CI/CD を ECS 向けに更新する
    ↓
[10] ハンズオン終了後のリソース削除
```

---

## AWS 用語集

### コンテナ / Docker

アプリとその実行環境（Node.js・ライブラリなど）をひとまとめにした箱のようなもの。
「どの EC2 でも同じ環境で動く」ことが保証される。

```
【今まで】
EC2 に Node.js をインストール → アプリを配置 → 起動
（EC2 の状態に依存）

【コンテナ化後】
Docker イメージ（環境ごとパッケージ）→ どこでも同じように起動
```

### Dockerfile

コンテナイメージを作るための設計書。
「どの Node.js バージョンを使い、どのファイルをコピーし、何を実行するか」を記述する。

### イメージ / レジストリ

**イメージ**: Dockerfile からビルドした完成品（設計図から作った実行可能なパッケージ）。
**レジストリ**: イメージを保管・管理する場所。AWS では ECR がこれにあたる。

### ECR（Elastic Container Registry）

Docker イメージを AWS 上で保管するサービス。
GitHub に対する Docker Hub のような位置づけ。

### ECS（Elastic Container Service）

コンテナの起動・管理・スケーリングを行うサービス。
「このイメージを何個起動して、ALB と紐付けて…」という設定を管理する。

### Fargate

ECS でコンテナを動かすための実行環境。
EC2 を自分で管理せずにコンテナを動かせる（サーバーレスなコンテナ実行環境）。

```
【EC2 起動タイプ】EC2 インスタンスを自分で管理 → その上でコンテナを動かす
【Fargate 起動タイプ】EC2 不要 → AWS がインフラを管理 → コンテナだけ定義すればOK
```

### タスク定義

ECS でコンテナを起動するための設定書。
「どのイメージを使い、CPU・メモリはどれくらいで、環境変数は何か」を定義する。

### ECS サービス

タスク定義をもとに「常に N 個のコンテナを維持する」設定。
コンテナが落ちたら自動で再起動し、ALB とも連携する。

### クラスター

ECS のコンテナをまとめて管理する単位。フォルダのようなもの。

---

## [1] Dockerfile を作成する

### 1-1. Dockerfile をリポジトリルートに作成する

`/mnt/c/Users/ohtsu/Documents/AWS/claudecode/Dockerfile` を作成：

```dockerfile
# ── ステージ1: フロントエンドのビルド ──
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY phase05/frontend/package*.json ./
RUN npm ci
COPY phase05/frontend/ ./
RUN npm run build

# ── ステージ2: バックエンドのビルド ──
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY phase05/backend/package*.json ./
RUN npm ci
COPY phase05/backend/ ./
RUN npm run build

# ── ステージ3: 本番イメージ ──
FROM node:22-alpine
WORKDIR /app/backend

# バックエンドの本番依存関係のみインストール
COPY phase05/backend/package*.json ./
RUN npm ci --omit=dev

# ビルド済みファイルをコピー
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

> **マルチステージビルドとは:**
> ビルド環境（node_modules 含む）と本番環境を分けることで、
> イメージサイズを小さく保つ手法。本番イメージには不要なファイルが含まれない。

---

### 1-2. .dockerignore を作成する

不要なファイルをイメージに含めないよう、`.dockerignore` を作成する。

`/mnt/c/Users/ohtsu/Documents/AWS/claudecode/.dockerignore`：

```
node_modules
*/node_modules
*/dist
.git
*.md
.env
```

---

## [2] ECR リポジトリを作成する

### 2-1. リポジトリを作成する

1. ECR コンソールを開く（リージョン：東京 ap-northeast-1）
2. **「リポジトリを作成」** をクリック
3. 以下を入力：

| 項目 | 値 |
|------|---|
| 可視性設定 | プライベート |
| リポジトリ名 | `handson-app` |

4. **「リポジトリを作成」** をクリック
5. 作成されたリポジトリの **URI** を控える
   （例：`123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/handson-app`）

---

## [3] ECS 用 IAM ロールを準備する

ECS/Fargate では 2 種類の IAM ロールが必要になる。

| ロール | 用途 |
|--------|------|
| タスク実行ロール | ECR からイメージを取得・CloudWatch Logs にログを書き込む権限 |
| タスクロール | コンテナ内のアプリが DynamoDB・S3・Cognito 等を使う権限 |

### 3-1. タスク実行ロールを作成する

1. IAM コンソール → **「ロールを作成」**
2. **信頼されたエンティティタイプ**：「AWS のサービス」
3. **ユースケース**：「Elastic Container Service」→「Elastic Container Service Task」を選択 → **「次へ」**
4. `AmazonECSTaskExecutionRolePolicy` が自動でアタッチされていることを確認 → **「次へ」**
5. **ロール名**：`handson-ecs-task-execution-role` → **「ロールを作成」**

---

### 3-2. タスクロールを確認する

タスクロールは既存の `handson-ec2-role` を流用できる。
EC2 にアタッチしていた DynamoDB・S3・Cognito・Bedrock 等の権限がそのまま使える。

> 新規で作成する場合は `handson-ec2-role` にアタッチされているポリシーと同じものをアタッチしたロールを作成する。

---

### 3-3. CodeBuild のロールに ECR・ECS 権限を追加する

Phase 09 で作成した CodeBuild のロールに、ECR への push と ECS サービスの更新権限を追加する。

1. IAM コンソール → **ロール** → `codebuild-handson-build-service-role` を開く
2. **「許可を追加」** → **「ポリシーをアタッチ」**
3. 以下の 2 つを追加：

| ポリシー名 | 用途 |
|-----------|------|
| `AmazonEC2ContainerRegistryFullAccess` | ECR へのログイン・push |
| `AmazonECS_FullAccess` | ECS サービスの更新 |

---

## [4] ECS クラスターを作成する

1. ECS コンソールを開く
2. **「クラスターの作成」** をクリック
3. 以下を設定：

| 項目 | 値 |
|------|---|
| クラスター名 | `handson-cluster` |
| インフラストラクチャ | AWS Fargate（サーバーレス） |

4. **「作成」** をクリック

---

## [5] タスク定義を作成する

### 5-1. タスク定義を作成する

1. ECS コンソール → **「タスク定義」** → **「新しいタスク定義の作成」**
2. 以下を設定：

**タスク定義の設定：**

| 項目 | 値 |
|------|---|
| タスク定義ファミリー | `handson-task` |
| 起動タイプ | AWS Fargate |
| オペレーティングシステム | Linux/X86_64 |
| CPU | 0.5 vCPU |
| メモリ | 1 GB |
| タスク実行ロール | `handson-ecs-task-execution-role` |
| タスクロール | `handson-ec2-role` |

**コンテナの設定：**

| 項目 | 値 |
|------|---|
| コンテナ名 | `handson-app` |
| イメージ URI | `[ECR の URI]/handson-app:latest`（[2-1] で控えた URI） |
| コンテナポート | `3000` |
| プロトコル | TCP |

---

### 5-2. 環境変数を設定する

`.env` に書いていた値をコンテナの環境変数として設定する。

コンテナの設定画面 → **「環境変数」** に以下を追加：

| キー | 値 |
|------|---|
| `AWS_REGION` | `ap-northeast-1` |
| `S3_BUCKET_NAME` | `handson-[名前]-files` |
| `COGNITO_USER_POOL_ID` | `ap-northeast-1_xxxxxxxxx` |
| `COGNITO_CLIENT_ID` | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `DYNAMODB_TABLE_NAME` | `handson-reviews` |
| `BEDROCK_REGION` | `us-east-1` |
| `PORT` | `3000` |

> 値は EC2 上の `.env` ファイルの内容を参照する。
> ```bash
> cat /root/samurai-repo/phase05/backend/.env
> ```

---

### 5-3. ログの設定をする

コンテナのログを CloudWatch Logs に送信する設定をする。

**「ログ収集を使用」** にチェックが入っていることを確認（デフォルトで有効）。

| 項目 | 値 |
|------|---|
| ログドライバー | awslogs |
| ロググループ | `/ecs/handson-task`（自動生成） |

**「作成」** をクリック。

---

## [6] ALB にターゲットグループを追加する

Fargate はネットワークモードが `awsvpc` のため、既存の EC2 用ターゲットグループは使えない。
ECS 専用のターゲットグループ（ターゲットタイプ：IP）を新規作成する。

### 6-1. ターゲットグループを作成する

1. EC2 コンソール → **「ターゲットグループ」** → **「ターゲットグループの作成」**
2. 以下を設定：

| 項目 | 値 |
|------|---|
| ターゲットタイプ | **IP アドレス**（EC2 インスタンスではない） |
| ターゲットグループ名 | `handson-ecs-tg` |
| プロトコル | HTTP |
| ポート | `3000` |
| VPC | `handson-vpc` |
| ヘルスチェックパス | `/` |

3. **「次へ」** → ターゲットの登録はスキップ（ECS が自動で登録する）→ **「ターゲットグループの作成」**

---

### 6-2. ALB のリスナーを更新する

既存の ALB（`handson-alb`）のポート 80 リスナーのデフォルトターゲットを ECS 用に切り替える。

1. EC2 コンソール → **「ロードバランサー」** → `handson-alb` → **「リスナー」** タブ
2. ポート 80 のリスナーを選択 → **「編集」**
3. デフォルトアクション → **「転送先」** を `handson-ecs-tg` に変更
4. **「変更を保存」**

---

## [7] ECS サービスを作成する

### 7-1. サービスを作成する

1. ECS コンソール → `handson-cluster` → **「サービスの作成」**
2. 以下を設定：

**環境：**

| 項目 | 値 |
|------|---|
| 起動タイプ | Fargate |
| プラットフォームバージョン | LATEST |

**デプロイ設定：**

| 項目 | 値 |
|------|---|
| アプリケーションタイプ | サービス |
| ファミリー | `handson-task` |
| サービス名 | `handson-service` |
| 必要なタスク数 | `1` |

**ネットワーキング：**

| 項目 | 値 |
|------|---|
| VPC | `handson-vpc` |
| サブネット | `handson-public-subnet-1a`・`handson-public-subnet-1c`（両方選択） |
| セキュリティグループ | 新規作成（後述） |
| パブリック IP | オン |

**セキュリティグループの作成（新規作成を選択）：**

| 項目 | 値 |
|------|---|
| セキュリティグループ名 | `handson-ecs-sg` |
| インバウンドルール | TCP / ポート 3000 / ソース：`handson-alb-sg`（ALB のセキュリティグループ） |

**ロードバランシング：**

| 項目 | 値 |
|------|---|
| ロードバランサーの種類 | Application Load Balancer |
| ロードバランサー | `handson-alb` |
| リスナー | 80:HTTP（既存） |
| ターゲットグループ | `handson-ecs-tg` |

3. **「作成」** をクリック

---

## [8] 動作確認

### 8-1. ECS サービスの起動を確認する

1. ECS コンソール → `handson-cluster` → `handson-service`
2. **「タスク」** タブ → タスクのステータスが `RUNNING` になるまで待つ

> ⏱️ 初回起動には 2〜3 分かかる。
> ECR からイメージを取得しているため、最初は少し時間がかかる。

> **タスクが `STOPPED` になる場合:**
> タスクを選択 → **「ログ」** タブでエラー内容を確認する。
> 環境変数の設定ミスや、イメージの pull 失敗が多い。

---

### 8-2. ALB 経由でアプリにアクセスする

ブラウザで ALB の DNS 名または CloudFront の URL を開き、アプリが表示されることを確認する。

- [ ] トップページが表示される
- [ ] ログインできる（Cognito 認証）
- [ ] レビュー一覧が取得できる
- [ ] S3 ファイル管理が動作する

---

## [9] CI/CD を ECS 向けに更新する

Phase 09 で作成した CI/CD パイプラインを ECS 向けに更新する。

### 9-1. buildspec.yml を更新する

`/mnt/c/Users/ohtsu/Documents/AWS/claudecode/buildspec.yml` を以下に書き換える：

```yaml
version: 0.2

env:
  variables:
    AWS_DEFAULT_REGION: ap-northeast-1
    ECR_REPO_NAME: handson-app
    ECS_CLUSTER: handson-cluster
    ECS_SERVICE: handson-service

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      - ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPO_NAME
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_URI

  build:
    commands:
      - echo Building Docker image...
      - docker build -t $ECR_URI:latest -t $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .

  post_build:
    commands:
      - echo Pushing Docker image to ECR...
      - docker push $ECR_URI:latest
      - docker push $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - echo Updating ECS service...
      - aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment
      - echo Done.
```

---

### 9-2. CodeBuild で Docker を使えるようにする

CodeBuild はデフォルトでは Docker が使えない設定になっている。

1. CodeBuild コンソール → `handson-build` → **「編集」** → **「環境」**
2. **「特権付与」** にチェックを入れる（Docker デーモンを使うために必要）
3. **「環境の更新」** をクリック

---

### 9-3. CodePipeline からデプロイステージを外す

Phase 09 のパイプラインには CodeDeploy のデプロイステージがあるが、
ECS 向けでは `buildspec.yml` 内で `aws ecs update-service` を実行するため不要になる。

1. CodePipeline コンソール → `handson-pipeline` → **「編集」**
2. **「Deploy」** ステージ → **「ステージを削除」**
3. **「保存」**

---

### 9-4. 動作確認

コードを少し変更して CodeCommit に push する。

```bash
cd /mnt/c/Users/ohtsu/Documents/AWS/claudecode
git add .
git commit -m "feat: ECS/Fargate 対応"
git push codecommit main
```

CodePipeline コンソールで以下の流れを確認する：

| ステージ | 内容 |
|---------|------|
| Source | CodeCommit から取得 |
| Build | Docker ビルド → ECR push → ECS サービス更新 |

ECS コンソール → `handson-service` → **「タスク」** タブで新しいタスクが起動していることを確認する。

---

## [10] ハンズオン終了後のリソース削除

以下の順番で削除する。

| リソース | 削除場所 |
|---------|---------|
| ECS サービス | ECS → `handson-cluster` → `handson-service` → 削除（タスク数を 0 にしてから削除） |
| ECS クラスター | ECS → `handson-cluster` → 削除 |
| タスク定義 | ECS → タスク定義 → `handson-task` → 登録解除 |
| ECR リポジトリ | ECR → `handson-app` → 削除 |
| ターゲットグループ | EC2 → ターゲットグループ → `handson-ecs-tg` → 削除 |
| セキュリティグループ | EC2 → セキュリティグループ → `handson-ecs-sg` → 削除 |
| IAM ロール | IAM → `handson-ecs-task-execution-role` → 削除 |
| CloudWatch ロググループ | CloudWatch → `/ecs/handson-task` → 削除 |

> ALB（`handson-alb`）のリスナーを元の EC2 ターゲットグループに戻す場合は、
> リスナーの編集で `handson-tg` に切り替える。

---

## コスト目安

| リソース | 費用 | 備考 |
|---------|------|------|
| Fargate（0.5vCPU / 1GB） | 約 $0.025/時間 → **約 $18/月** | 起動中は課金される。ハンズオン後は削除すること |
| ECR | $0.10/GB/月 | イメージサイズによるが数十円程度 |
| ALB | 約 $0.008/時間 → **約 $6/月** | Phase 06 から継続利用 |

> ⚠️ Fargate は EC2 と異なり停止という概念がない。使わないときはサービスを削除すること。
