import { useState, useEffect, useCallback } from 'react'
import { listReviews, getReview, Review } from '../api/reviews'
import './ReviewListPage.css'

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="stars-display">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= rating ? 'star-on' : 'star-off'}>★</span>
      ))}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Review | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listReviews()
      setReviews(data)
    } catch {
      setError('レビュー一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleSelect = async (reviewId: string) => {
    setDetailLoading(true)
    try {
      const detail = await getReview(reviewId)
      setSelected(detail)
    } catch {
      setError('レビューの取得に失敗しました')
    } finally {
      setDetailLoading(false)
    }
  }

  if (selected) {
    return (
      <div className="review-list-container">
        <button className="btn-back" onClick={() => setSelected(null)}>
          ← 一覧に戻る
        </button>
        <div className="review-detail-card">
          <div className="detail-header">
            <StarDisplay rating={selected.rating} />
            <span className="detail-rating">{selected.rating} / 5</span>
          </div>
          <p className="detail-comment">{selected.comment}</p>
          <div className="detail-meta">
            <span className="detail-name">{selected.userName}</span>
            <span className="detail-date">{formatDate(selected.createdAt)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-list-container">
      <div className="review-list-header">
        <h2>レビュー一覧</h2>
        <button className="btn-reload" onClick={fetchReviews} disabled={loading}>
          更新
        </button>
      </div>

      {error && <p className="list-error">{error}</p>}

      {loading ? (
        <p className="list-loading">読み込み中...</p>
      ) : reviews.length === 0 ? (
        <p className="list-empty">まだレビューがありません</p>
      ) : (
        <ul className="review-items">
          {reviews.map(r => (
            <li
              key={r.reviewId}
              className="review-item"
              onClick={() => !detailLoading && handleSelect(r.reviewId)}
            >
              <div className="item-top">
                <StarDisplay rating={r.rating} />
                <span className="item-name">{r.userName}</span>
                <span className="item-date">{formatDate(r.createdAt)}</span>
              </div>
              <p className="item-comment">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
