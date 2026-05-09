import { Router, Request, Response } from 'express'
import multer from 'multer'
import { Readable } from 'stream'
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const BUCKET = process.env.S3_BUCKET_NAME || ''

// ファイル一覧取得
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }))
    const files = (result.Contents ?? []).map(obj => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
    }))
    res.json(files)
  } catch (e) {
    const err = e as Error & { name?: string }
    console.error('[S3 ListObjects Error]', err.name, err.message)
    res.status(500).json({ error: 'ファイル一覧の取得に失敗しました' })
  }
})

// ファイルアップロード
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'ファイルが選択されていません' })
    return
  }
  try {
    // multerはファイル名をlatin1で読むためUTF-8に変換する
    const filename = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }))
    res.json({ message: 'アップロード成功', key: filename })
  } catch {
    res.status(500).json({ error: 'アップロードに失敗しました' })
  }
})

// ファイルダウンロード
router.get('/download/:key', async (req: Request, res: Response) => {
  const key = decodeURIComponent(req.params.key)
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    if (!result.Body) {
      res.status(404).json({ error: 'ファイルが見つかりません' })
      return
    }
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(key)}`)
    if (result.ContentType) res.setHeader('Content-Type', result.ContentType)
    ;(result.Body as Readable).pipe(res)
  } catch {
    res.status(500).json({ error: 'ダウンロードに失敗しました' })
  }
})

// ファイル削除
router.delete('/:key', async (req: Request, res: Response) => {
  const key = decodeURIComponent(req.params.key)
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    res.json({ message: '削除成功' })
  } catch {
    res.status(500).json({ error: '削除に失敗しました' })
  }
})

export default router
