# Phase 7: CloudFront（HTTPS 化 + 独自ドメイン対応）

## 概要

CloudFront を ALB の前段に置き、アプリを HTTPS でアクセスできるようにする。
S3 は使用しない。アプリのコード・ALB・EC2 への変更は不要。

## フォルダ構成

```
phase07/
└── cfn/
    ├── phase7-template.yaml   # CloudFormation テンプレート（全リソース定義）
    └── phase7-params.json     # パラメータ記入テンプレート（値を記入して使う）
```

## 追加機能

- CloudFront による HTTPS 対応（HTTP → HTTPS 自動リダイレクト）
- （任意）独自ドメインでのアクセス（ACM 証明書 + Route 53）

## 使用 AWS サービス

- **Amazon CloudFront**: HTTPS 終端・CDN・DDoS 保護
- **AWS Certificate Manager（ACM）**: HTTPS 証明書（us-east-1 で発行、任意）
- **Amazon Route 53**: カスタムドメインの DNS 管理（任意）

## セットアップ手順

`docs/07_CloudFront_ハンズオン手順.md` を参照。

## CloudFormation で環境を自動構築する場合

```bash
# cfn/ フォルダで実行
cd phase07/cfn

# 1. phase7-params.json の AlbDnsName に Phase 6 の ALB DNS 名を記入する

# 2. スタックを作成
aws cloudformation create-stack \
  --stack-name handson-phase7 \
  --template-body file://phase7-template.yaml \
  --parameters file://phase7-params.json \
  --region ap-northeast-1

# 3. 削除（ハンズオン終了後）
aws cloudformation delete-stack \
  --stack-name handson-phase7 \
  --region ap-northeast-1
```
