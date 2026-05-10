import { getIdToken } from '../auth/cognito'

export type AnalysisResult = {
  reviewCount: number
  averageRating: number
  ratingDistribution: Record<number, number>
  summary: string | null
  goodPoints: string[]
  improvementPoints: string[]
  analyzedAt: string
}

export async function fetchAnalysis(): Promise<AnalysisResult> {
  const token = await getIdToken()
  const res = await fetch('/api/analysis', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'AI分析に失敗しました')
  }
  return res.json()
}
