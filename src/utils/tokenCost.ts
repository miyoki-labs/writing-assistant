import type { Provider } from '../types'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  provider: Provider
}

interface ProviderPricing {
  inputPer1M: number   // USD
  outputPer1M: number  // USD
}

// 2025年5月時点の料金（目安）
export const PROVIDER_PRICING: Record<Provider, ProviderPricing> = {
  anthropic: { inputPer1M: 3.0,  outputPer1M: 15.0 },
  openai:    { inputPer1M: 2.5,  outputPer1M: 10.0 },
  gemini:    { inputPer1M: 0.075, outputPer1M: 0.30 },
  deepseek:  { inputPer1M: 0.27, outputPer1M: 1.10 },
}

export function calcCostUSD(usage: TokenUsage): number {
  const pricing = PROVIDER_PRICING[usage.provider]
  const inputCost  = (usage.inputTokens  / 1_000_000) * pricing.inputPer1M
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPer1M
  return inputCost + outputCost
}

export function calcCostJPY(usd: number, rate: number): number {
  return usd * rate
}

// 為替レートをフェッチ（失敗時はフォールバック値を使う）
const FALLBACK_RATE = 155

let cachedRate: number | null = null
let cacheTime = 0
const CACHE_TTL = 1000 * 60 * 10 // 10分キャッシュ

export async function fetchUsdJpyRate(): Promise<number> {
  const now = Date.now()
  if (cachedRate && now - cacheTime < CACHE_TTL) return cachedRate

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error()
    const data = await res.json()
    const rate = data?.rates?.JPY
    if (typeof rate === 'number') {
      cachedRate = rate
      cacheTime = now
      return rate
    }
  } catch {
    // ネットワークエラーやAPIエラーはフォールバック
  }
  return FALLBACK_RATE
}

export function formatUSD(usd: number): string {
  if (usd < 0.0001) return '< $0.0001'
  return `$${usd.toFixed(4)}`
}

export function formatJPY(jpy: number): string {
  if (jpy < 0.01) return '< ¥0.01'
  return `¥${jpy.toFixed(2)}`
}
