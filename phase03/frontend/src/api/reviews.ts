import { getIdToken } from '../auth/cognito'

export interface Review {
  reviewId: string
  rating: number
  comment: string
  userName: string
  userId: string | null
  createdAt: string
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function postReview(data: {
  rating: number
  comment: string
  userName: string
}): Promise<void> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'レビューの投稿に失敗しました')
  }
}

export async function listReviews(): Promise<Review[]> {
  const res = await fetch('/api/reviews', { headers: await authHeaders() })
  if (!res.ok) throw new Error('レビュー一覧の取得に失敗しました')
  return res.json()
}

export async function getReview(reviewId: string): Promise<Review> {
  const res = await fetch(`/api/reviews/${reviewId}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('レビューの取得に失敗しました')
  return res.json()
}
