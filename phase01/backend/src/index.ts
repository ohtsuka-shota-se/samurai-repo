import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import filesRouter from './routes/files'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/files', filesRouter)

// フロントエンドのビルド済みファイルを配信（本番用）
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`)
  console.log(`S3バケット: ${process.env.S3_BUCKET_NAME || '未設定'}`)
})
