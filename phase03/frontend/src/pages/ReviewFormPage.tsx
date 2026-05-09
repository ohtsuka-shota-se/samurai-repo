import { useState } from 'react'
import { postReview } from '../api/reviews'
import './ReviewFormPage.css'

const STARS = [1, 2, 3, 4, 5]

export default function ReviewFormPage() {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('評価（星）を選択してください')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await postReview({ rating, comment, userName })
      setSuccess(true)
      setRating(0)
      setComment('')
      setUserName('')
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="review-form-container">
        <div className="review-success">
          <p className="success-icon">✅</p>
          <p>レビューを投稿しました。ありがとうございます！</p>
          <button className="btn-again" onClick={() => setSuccess(false)}>
            続けて投稿する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="review-form-container">
      <div className="review-form-card">
        <h2>レビューを投稿する</h2>
        <p className="review-form-note">ログイン不要でどなたでも投稿できます</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>お名前（任意）</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="ゲスト"
              disabled={loading}
              maxLength={50}
            />
          </div>

          <div className="field">
            <label>評価</label>
            <div className="star-selector">
              {STARS.map(n => (
                <button
                  key={n}
                  type="button"
                  className={`star ${n <= (hovered || rating) ? 'active' : ''}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  disabled={loading}
                >
                  ★
                </button>
              ))}
              <span className="rating-label">
                {rating > 0 ? `${rating} / 5` : '選択してください'}
              </span>
            </div>
          </div>

          <div className="field">
            <label>コメント</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
              disabled={loading}
              placeholder="ご意見・ご感想をお聞かせください"
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{comment.length} / 500</span>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>
    </div>
  )
}
