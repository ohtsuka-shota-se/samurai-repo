# Phase 6: ALB + Auto Scaling（高可用性構成）

## 概要

Phase 5 までの単一EC2構成を高可用性構成に移行する。
AMI を作成してEC2環境を複製し、ALB でトラフィックを分散、Auto Scaling で負荷に応じて台数を自動制御する。

## フォルダ構成

```
phase06/
└── cfn/
    ├── phase6-template.yaml        # CloudFormation テンプレート（パラメータ入力あり）
    ├── phase6-template-fixed.yaml  # CloudFormation テンプレート（値ハードコード版・マネコン入力不要）
    └── phase6-params.json          # CLIデプロイ用パラメータファイル
```

Phase 6 はアプリのコード変更なし。Phase 5 のEC2環境をAMI化し、インフラ構成のみ変更する。

## 追加機能

- 複数AZへのEC2分散配置（冗長化）
- ALBによるトラフィック振り分けとヘルスチェック
- Auto Scaling による負荷に応じた台数の自動増減

## 使用AWSサービス

- **ALB（Application Load Balancer）**: アクセスを複数EC2に振り分ける
- **Auto Scaling グループ**: EC2台数を自動で増減する
- **AMI（Amazon Machine Image）**: EC2環境のスナップショット

## セットアップ手順

`docs/06_ALB_AutoScaling_ハンズオン手順.md` を参照。

## CloudFormation で環境を自動構築・削除する方法

このテンプレートで作成されるリソース：

| リソース名 | 種別 | 内容 |
|-----------|------|------|
| `handson-public-subnet-1c` | サブネット | AZ-c 用パブリックサブネット |
| `handson-alb-sg` | セキュリティグループ | ALB 用（ポート80を許可） |
| `handson-tg` | ターゲットグループ | EC2への振り分け先 |
| `handson-alb` | ALB | ポート80で受けてポート3000に転送 |
| `handson-lt` | 起動テンプレート | ASGがEC2を起動するときの設計図 |
| `handson-asg` | Auto Scalingグループ | EC2台数を自動管理 |

> **テンプレートの MinSize について:**
> テンプレートの `MinSize` はデフォルト `1` になっている。学習環境ではCPU使用率が常に低く AlarmLow が発火して Desired が自動で 1 に下げられてしまうため、デプロイ後にコンソールから最小容量を `2` に変更することを推奨する。

---

### 事前準備（デプロイ前に確認するもの）

以下の値を先に手元にメモしておく。パラメータ入力時に必要になる。

| パラメータ名 | 確認場所 | 例 |
|------------|---------|-----|
| **VpcId** | VPCコンソール → VPC → `handson-vpc` の「VPC ID」 | `vpc-0abc123...` |
| **ExistingSubnet1aId** | VPCコンソール → サブネット → `handson-public-subnet-1a` の「サブネット ID」 | `subnet-0abc123...` |
| **RouteTableId** | VPCコンソール → ルートテーブル → `handson-public-subnet-1a` に関連付けられている RTB の「ルートテーブル ID」 | `rtb-0abc123...` |
| **EC2SecurityGroupId** | EC2コンソール → セキュリティグループ → `handson-sg` の「セキュリティグループ ID」 | `sg-0abc123...` |
| **InstanceProfileName** | 変更していなければ `handson-ec2-role` のまま | `handson-ec2-role` |
| **AmiId** | EC2コンソール → AMI → `handson-app-ami` の「AMI ID」 ※AMI作成後に確認 | `ami-0abc123...` |
| **KeyPairName** | EC2コンソール → キーペア → 使用しているキーペア名 | `my-keypair` |

> **AmiId はハンズオン手順の \[3\] でAMI作成後に確認する。** 作成前にデプロイしようとするとエラーになる。

---

### マネジメントコンソールからデプロイする手順

#### ① スタックの作成

1. AWSマネジメントコンソール → 検索バーで「CloudFormation」を開く
2. リージョンが **東京（ap-northeast-1）** になっていることを確認
3. 「スタックを作成」→ **「新しいリソースを使用（標準）」** をクリック

**テンプレートの指定:**

4. 「テンプレートソース」→ **「テンプレートファイルのアップロード」** を選択
5. 「ファイルを選択」→ `phase06/cfn/phase6-template.yaml` を選択
6. 「次へ」をクリック

**スタックの詳細を指定:**

7. スタック名: **`handson-phase6`** と入力
8. 上の「事前準備」でメモした値を各パラメータに入力する
9. 「次へ」をクリック

**スタックオプションの設定:**

10. 何も変更せず「次へ」をクリック

**確認と送信:**

11. 入力内容を確認して **「送信」** をクリック
12. ステータスが `CREATE_IN_PROGRESS` → **`CREATE_COMPLETE`** に変わるまで待つ（3〜5分）

#### ② デプロイ完了後の確認

1. スタック一覧で `handson-phase6` を選択
2. **「出力」タブ** を開く
3. `AppUrl` の値（例: `http://handson-alb-xxx.ap-northeast-1.elb.amazonaws.com`）をコピー
4. ブラウザでそのURLを開いてアプリが表示されることを確認

#### ③ 最小容量を 2 に変更する（推奨）

1. EC2コンソール → 「Auto Scalingグループ」→ `handson-asg` を選択
2. 「編集」→ **「最小の希望する容量」を `1` → `2`** に変更 → 保存

---

### スタックの削除（ハンズオン終了後）

1. CloudFormationコンソール → 「スタック」一覧
2. `handson-phase6` を選択
3. **「削除」** ボタンをクリック
4. 確認ダイアログで **「削除」** をクリック
5. ステータスが `DELETE_IN_PROGRESS` → **`DELETE_COMPLETE`** になれば完了

> 削除には3〜5分かかる。ALB・Auto Scalingグループ・EC2インスタンス・サブネットがすべて自動で削除される。
> ただし Phase 1 から存在するリソース（VPC・既存サブネット・セキュリティグループ・AMI）は削除されない。

---

### AWS CLI から操作する場合

```bash
# cfn/ フォルダで実行
cd phase06/cfn

# 1. phase6-params.json に自分の環境のIDを記入する

# 2. スタックを作成
aws cloudformation create-stack \
  --stack-name handson-phase6 \
  --template-body file://phase6-template.yaml \
  --parameters file://phase6-params.json \
  --region ap-northeast-1

# 3. 作成完了を待つ
aws cloudformation wait stack-create-complete \
  --stack-name handson-phase6 \
  --region ap-northeast-1

# 4. 出力値（ALBのURL）を確認
aws cloudformation describe-stacks \
  --stack-name handson-phase6 \
  --region ap-northeast-1 \
  --query "Stacks[0].Outputs"

# 5. 削除（ハンズオン終了後）
aws cloudformation delete-stack \
  --stack-name handson-phase6 \
  --region ap-northeast-1
```
