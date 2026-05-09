import { Router, Request, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
)
const TABLE = process.env.DYNAMODB_TABLE_NAME || ''

// POST /api/reviews - 公開（認証不要）
router.post('/', async (req: Request, res: Response) => {
  const { rating, comment, userName } = req.body
  if (!rating || !comment) {
    res.status(400).json({ error: 'rating と comment は必須です' })
    return
  }
  const ratingNum = Number(rating)
  if (ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'rating は 1〜5 で指定してください' })
    return
  }

  const item = {
    reviewId: randomUUID(),
    rating: ratingNum,
    comment: String(comment).trim(),
    userName: userName ? String(userName).trim() : 'ゲスト',
    userId: null,
    createdAt: new Date().toISOString(),
  }

  try {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }))
    res.status(201).json({ message: 'レビューを投稿しました', reviewId: item.reviewId })
  } catch (e) {
    console.error('[DynamoDB PutItem Error]', (e as Error).message)
    res.status(500).json({ error: 'レビューの投稿に失敗しました' })
  }
})

// GET /api/reviews - 保護（認証必要）
router.get('/', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE }))
    const items = (result.Items ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    res.json(items)
  } catch (e) {
    console.error('[DynamoDB Scan Error]', (e as Error).message)
    res.status(500).json({ error: 'レビュー一覧の取得に失敗しました' })
  }
})

// GET /api/reviews/:reviewId - 保護（認証必要）
router.get('/:reviewId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { reviewId } = req.params
  try {
    const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { reviewId } }))
    if (!result.Item) {
      res.status(404).json({ error: 'レビューが見つかりません' })
      return
    }
    res.json(result.Item)
  } catch (e) {
    console.error('[DynamoDB GetItem Error]', (e as Error).message)
    res.status(500).json({ error: 'レビューの取得に失敗しました' })
  }
})

export default router
