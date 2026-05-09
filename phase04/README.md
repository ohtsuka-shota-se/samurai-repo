# Phase 4: Lambda + SNS レビュー通知

## 概要

DynamoDB Streams → Lambda → SNS → Email の流れで、レビュー投稿時にメール通知を行う。

## フォルダ構成

```
phase04/
└── lambda/
    └── index.py    # Lambda関数（Python 3.12）
```

## Lambda 関数

- **関数名**: `handson-review-notifier`
- **ランタイム**: Python 3.12
- **ハンドラ**: `index.handler`
- **環境変数**: `SNS_TOPIC_ARN`（SNSトピックのARN）

## セットアップ手順

`ProcedureManual/04_Lambda_SNS_ハンズオン手順.md` を参照。
