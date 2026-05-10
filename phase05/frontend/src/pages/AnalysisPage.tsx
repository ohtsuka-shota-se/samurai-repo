import { useState } from 'react'
import { fetchAnalysis, AnalysisResult } from '../api/analysis'
import './AnalysisPage.css'

function RatingBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label">{label}</span>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rating-bar-count">{count}件</span>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await fetchAnalysis()
      setResult(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const maxCount = result
    ? Math.max(...Object.values(result.ratingDistribution))
    : 0

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h2>レビュー分析（AI）</h2>
        <button
          className="btn-analyze"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? '分析中...' : '分析する'}
        </button>
      </div>

      {loading && (
        <div className="analysis-loading">
          <p>Amazon Nova Micro でレビューを分析しています...</p>
          <p className="loading-sub">数秒かかります</p>
        </div>
      )}

      {error && <p className="analysis-error">{error}</p>}

      {result && !loading && (
        <>
          {result.reviewCount === 0 ? (
            <p className="analysis-empty">まだレビューがありません。レビューが投稿されてから分析してください。</p>
          ) : (
            <div className="analysis-body">
              {/* 概要 */}
              <section className="analysis-section">
                <h3>概要</h3>
                <div className="stats-row">
                  <div className="stat-card">
                    <span className="stat-value">{result.reviewCount}</span>
                    <span className="stat-label">件のレビュー</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{result.averageRating}</span>
                    <span className="stat-label">平均評価 / 5</span>
                  </div>
                </div>
              </section>

              {/* 評価分布 */}
              <section className="analysis-section">
                <h3>評価分布</h3>
                <div className="rating-bars">
                  {[5, 4, 3, 2, 1].map(n => (
                    <RatingBar
                      key={n}
                      label={`${'★'.repeat(n)}${'☆'.repeat(5 - n)}`}
                      count={result.ratingDistribution[n] ?? 0}
                      max={maxCount}
                    />
                  ))}
                </div>
              </section>

              {/* AI分析結果 */}
              <section className="analysis-section">
                <h3>全体傾向</h3>
                <p className="analysis-summary">{result.summary}</p>
              </section>

              <div className="analysis-two-col">
                <section className="analysis-section">
                  <h3>好評点 TOP3</h3>
                  <ul className="point-list good">
                    {result.goodPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </section>

                <section className="analysis-section">
                  <h3>改善要望 TOP3</h3>
                  <ul className="point-list improve">
                    {result.improvementPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </section>
              </div>

              <p className="analysis-timestamp">分析日時: {formatDate(result.analyzedAt)}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
