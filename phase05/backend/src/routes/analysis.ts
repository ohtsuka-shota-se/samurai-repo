import { Router, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
)
const TABLE = process.env.DYNAMODB_TABLE_NAME || ''

const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
})
const MODEL_ID = 'amazon.nova-micro-v1:0'

// 評価分布を計算する
function calcRatingDistribution(items: Record<string, unknown>[]): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const item of items) {
    const r = Number(item.rating)
    if (r >= 1 && r <= 5) dist[r]++
  }
  return dist
}

// GET /api/analysis - 保護（認証必要）
router.get('/', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  // DynamoDB からレビューを全件取得（最大100件）
  let items: Record<string, unknown>[] = []
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 100 }))
    items = (result.Items ?? []) as Record<string, unknown>[]
  } catch (e) {
    console.error('[DynamoDB Scan Error]', (e as Error).message)
    res.status(500).json({ error: 'レビューデータの取得に失敗しました' })
    return
  }

  if (items.length === 0) {
    res.json({
      reviewCount: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      summary: null,
      goodPoints: [],
      improvementPoints: [],
      analyzedAt: new Date().toISOString(),
    })
    return
  }

  // 統計値の計算（Bedrockを使わずバックエンドで処理）
  const reviewCount = items.length
  const averageRating =
    Math.round((items.reduce((sum, r) => sum + Number(r.rating), 0) / reviewCount) * 10) / 10
  const ratingDistribution = calcRatingDistribution(items)

  // Bedrock へのプロンプト
  const reviewText = items
    .map((r, i) => `[${i + 1}] 評価:${r.rating}★ 名前:${r.userName} コメント:${r.comment}`)
    .join('\n')

  const prompt = `以下はユーザーから投稿されたレビュー一覧です。分析して必ず以下のJSON形式のみで回答してください。説明文や前置きは不要です。

\`\`\`json
{
  "summary": "全体的な傾向を2〜3文で要約",
  "good_points": ["好評点1", "好評点2", "好評点3"],
  "improvement_points": ["改善要望1", "改善要望2", "改善要望3"]
}
\`\`\`

レビュー一覧:
${reviewText}`

  // Bedrock (Amazon Nova Micro) を呼び出す
  let summary = ''
  let goodPoints: string[] = []
  let improvementPoints: string[] = []

  try {
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 1024, temperature: 0.3 },
    })
    const bedrockRes = await bedrock.send(command)
    const rawText =
      bedrockRes.output?.message?.content?.[0]?.text ?? ''

    // JSONブロックを抽出してパース
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ??
                      rawText.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : rawText
    const parsed = JSON.parse(jsonStr)
    summary = parsed.summary ?? ''
    goodPoints = parsed.good_points ?? []
    improvementPoints = parsed.improvement_points ?? []
  } catch (e) {
    console.error('[Bedrock Error]', (e as Error).message)
    res.status(500).json({ error: 'AI分析に失敗しました' })
    return
  }

  res.json({
    reviewCount,
    averageRating,
    ratingDistribution,
    summary,
    goodPoints,
    improvementPoints,
    analyzedAt: new Date().toISOString(),
  })
})

export default router
