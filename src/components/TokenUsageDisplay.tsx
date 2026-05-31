import { useEffect, useState } from 'react'
import {
  calcCostUSD, calcCostJPY, fetchUsdJpyRate, formatUSD, formatJPY,
  PROVIDER_PRICING, type TokenUsage,
} from '../utils/tokenCost'
import { PROVIDER_INFO } from '../types'

interface Props {
  usage: TokenUsage | null
  label?: string
}

export function TokenUsageDisplay({ usage, label = '生成コスト' }: Props) {
  const [jpyRate, setJpyRate] = useState<number | null>(null)
  const [rateError, setRateError] = useState(false)

  useEffect(() => {
    fetchUsdJpyRate()
      .then(setJpyRate)
      .catch(() => setRateError(true))
  }, [])

  if (!usage) return null

  const usd = calcCostUSD(usage)
  const jpy = jpyRate ? calcCostJPY(usd, jpyRate) : null
  const pricing = PROVIDER_PRICING[usage.provider]
  const info = PROVIDER_INFO[usage.provider]

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="text-gray-400">{info.emoji} {info.name.split(' ')[0]}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="text-gray-500">
          入力トークン
          <span className="ml-1 font-mono text-gray-700">{usage.inputTokens.toLocaleString()}</span>
        </div>
        <div className="text-gray-500">
          出力トークン
          <span className="ml-1 font-mono text-gray-700">{usage.outputTokens.toLocaleString()}</span>
        </div>
        <div className="text-gray-500">
          合計トークン
          <span className="ml-1 font-mono text-gray-700">
            {(usage.inputTokens + usage.outputTokens).toLocaleString()}
          </span>
        </div>
        <div className="text-gray-500">
          料金レート
          <span className="ml-1 text-gray-400">
            ${pricing.inputPer1M}/${pricing.outputPer1M}/1M
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-0.5 border-t border-gray-200">
        <span className="font-semibold text-indigo-600">{formatUSD(usd)}</span>
        {jpy !== null && (
          <span className="text-gray-500">≈ {formatJPY(jpy)}</span>
        )}
        {rateError && (
          <span className="text-gray-400">（JPY換算不可）</span>
        )}
        {jpyRate && !rateError && (
          <span className="text-gray-400 ml-auto">1USD = {jpyRate.toFixed(1)}円</span>
        )}
      </div>
    </div>
  )
}

// 複数のTokenUsageをまとめて合算表示するコンポーネント
export function TokenUsageSummary({ usages, label = '合計コスト' }: { usages: TokenUsage[]; label?: string }) {
  const [jpyRate, setJpyRate] = useState<number | null>(null)

  useEffect(() => {
    fetchUsdJpyRate().then(setJpyRate).catch(() => {})
  }, [])

  if (usages.length === 0) return null

  const totalUSD = usages.reduce((sum, u) => sum + calcCostUSD(u), 0)
  const totalInput = usages.reduce((sum, u) => sum + u.inputTokens, 0)
  const totalOutput = usages.reduce((sum, u) => sum + u.outputTokens, 0)

  return (
    <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 flex items-center justify-between text-xs">
      <span className="text-indigo-700 font-medium">{label}</span>
      <div className="flex items-center gap-2 text-indigo-600">
        <span>{(totalInput + totalOutput).toLocaleString()} tokens</span>
        <span>·</span>
        <span className="font-semibold">{formatUSD(totalUSD)}</span>
        {jpyRate && <span>≈ {formatJPY(calcCostJPY(totalUSD, jpyRate))}</span>}
      </div>
    </div>
  )
}
