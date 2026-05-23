# Phase 7: CloudFront + S3 静的配信（CDN化）

## 概要

フロントエンド（React）を S3 + CloudFront で配信し、API は ALB 経由で EC2 に転送するハイブリッド構成。

## フォルダ構成

```
phase07/
└── cfn/
    ├── phase7-template.yaml   # CloudFormation テンプレート（全リソース定義）
    └── phase7-params.json     # パラメータ記入テンプレート（値を記入して使う）
```

Phase 7 はアプリのコード変更なし。インフラ構成のみ変更する。

## 追加機能

- React ビルド成果物を S3 に配置し CloudFront で高速配信
- `/api/*` のリクエストのみ ALB 経由で EC2 に転送
- （任意）独自ドメインでの HTTPS アクセス

## 使用AWSサービス

- **Amazon S3**: React ビルド成果物の置き場所
- **Amazon CloudFront**: 世界中のエッジロケーションからコンテンツを配信
- **AWS Certificate Manager（ACM）**: HTTPS 証明書（us-east-1 で発行）
- **Amazon Route 53**: カスタムドメインの DNS 管理（任意）

## セットアップ手順

`docs/07_CloudFront_ハンズオン手順.md` を参照（作成予定）。

## CloudFormation で環境を自動構築する場合

```bash
# cfn/ フォルダで実行
cd phase07/cfn

# 1. phase7-params.json に Phase 6 の AlbDnsName 等を記入する

# 2. スタックを作成
aws cloudformation create-stack \
  --stack-name handson-phase7 \
  --template-body file://phase7-template.yaml \
  --parameters file://phase7-params.json \
  --region ap-northeast-1

# 3. 削除（ハンズオン終了後）
# ※ S3バケットはDeletionPolicy: Retainのため削除されない
aws cloudformation delete-stack \
  --stack-name handson-phase7 \
  --region ap-northeast-1
```
