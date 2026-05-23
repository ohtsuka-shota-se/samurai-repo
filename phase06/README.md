# Phase 6: ALB + Auto Scaling（高可用性構成）

## 概要

Phase 5 までの単一EC2構成を高可用性構成に移行する。
AMI を作成してEC2環境を複製し、ALB でトラフィックを分散、Auto Scaling で負荷に応じて台数を自動制御する。

## フォルダ構成

```
phase06/
└── cfn/
    ├── phase6-template.yaml   # CloudFormation テンプレート（全リソース定義）
    └── phase6-params.json     # パラメータ記入テンプレート（値を記入して使う）
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

## CloudFormation で環境を自動構築する場合

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

# 3. 削除（ハンズオン終了後）
aws cloudformation delete-stack \
  --stack-name handson-phase6 \
  --region ap-northeast-1
```
