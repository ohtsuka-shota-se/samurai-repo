# AWS 学習ハンズオン アプリ

AWS の主要サービスを段階的に学ぶためのハンズオン用アプリです。

## ハンズオン手順書

→ **[GitHub Pages（手順書サイト）](https://ohtsuka-shota-se.github.io/samurai-repo/)** で閲覧できます。

## フェーズ構成

| フォルダ | 内容 |
|---------|------|
| `phase01/` | EC2 + S3 + IAM（ファイル管理アプリ） |
| `phase02/` | + Cognito（ログイン・認証） |
| `phase03/` | + DynamoDB（レビュー投稿・蓄積） |
| `phase04/` | + Lambda + SNS（レビュー投稿メール通知） |
| `phase05/` | + Bedrock（AI分析・傾向可視化） |
| `phase06/` | + ALB + Auto Scaling（高可用性構成）※アプリコード変更なし・インフラのみ |
| `phase07/` | + CloudFront + WAF（CDN化） + Route53（独自ドメイン化）※アプリコード変更なし・インフラのみ |
| `phase08/` | + CloudWatch（監視）※アプリコード変更なし・インフラのみ |
