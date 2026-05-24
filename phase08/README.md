# Phase 8: CloudWatch Logs + SNS（監視・アラート）

## 概要

EC2 上で PM2 が管理する Node.js アプリのログを CloudWatch Logs に集約し、  
エラーを検知したら SNS 経由でメール通知が届く監視環境を構築する。  
アプリのコードへの変更はなく、インフラ・設定のみ追加する。

## フォルダ構成

```
phase08/
└── config/
    └── cloudwatch-agent.json   # CloudWatch Agent 設定テンプレート
```

## 追加機能

- PM2 ログ（標準出力・エラー出力）を CloudWatch Logs にリアルタイム転送
- ログ内の `ERROR` パターンを Metric Filter で検知してメトリクス化
- エラー発生時に CloudWatch Alarm → SNS → メール通知

## 使用 AWS サービス

- **Amazon CloudWatch Logs**: EC2 ログの集約・保管・検索
- **CloudWatch Metric Filter**: ログパターンからメトリクスを生成
- **CloudWatch Alarm**: メトリクス閾値監視とアラート発火
- **Amazon SNS**: メール通知（Simple Notification Service）

## 前提条件

- Phase 06 または 07 で作成した EC2 が起動していること
- PM2 でアプリが `online` 状態で動いていること
- ALB・CloudFront は **不要**（停止・削除したままで構わない）

## セットアップ手順

`docs/08_CloudWatch_SNS_ハンズオン手順.md` を参照。

## CloudWatch Agent 設定ファイルについて

`config/cloudwatch-agent.json` は EC2 に配置する設定ファイルのテンプレート。  
以下のパスは環境に合わせて変更すること。

| 項目 | デフォルト値 | 確認方法 |
|------|------------|---------|
| `file_path` | `/root/.pm2/logs/*-out.log` | `pm2 info backend` の `Log file` 欄 |
| `log_group_name` | `/handson/pm2/out` | 変更不要（任意の名前で OK） |

### EC2 への配置コマンド

```bash
# EC2 に SSH してから実行
sudo cp cloudwatch-agent.json \
  /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Agent に設定を反映して起動
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
```

## 動作確認（テスト）

```bash
# EC2 上でエラーログを手動書き込みしてアラートが届くか確認する
echo "$(date -Iseconds) ERROR: test error" >> /root/.pm2/logs/backend-error.log
```

CloudWatch Logs に届いてから Alarm が ALARM 状態になるまで最大 5 分かかる。
