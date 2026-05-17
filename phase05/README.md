# Phase 5: Bedrock AI分析・傾向可視化

## 概要

Amazon Bedrock を使って、DynamoDB に蓄積されたレビューデータを AI が分析し、傾向を可視化する機能を追加する。

## フォルダ構成

```
phase05/
├── backend/     # Node.js + Express バックエンド
│   └── src/
│       └── routes/
│           └── analysis.ts   # Bedrock呼び出しAPIルート
└── frontend/    # React + Vite フロントエンド
    └── src/
        └── pages/
            └── AnalysisPage.tsx   # AI分析結果表示画面
```

## 追加機能

- DynamoDB のレビューデータを取得し Bedrock へ送信
- Bedrock（Claude）によるレビュー傾向の自然言語分析
- AI分析結果の表示画面（AnalysisPage）

## 使用AWSサービス

- **Amazon Bedrock**: Claude モデルによる自然言語分析
- **IAMロール**: EC2 から Bedrock へのアクセス権限

## セットアップ手順

`docs/05_Bedrock_ハンズオン手順.md` を参照。
