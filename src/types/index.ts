import type { MediaType } from '../prompts/mediaPrompts'

export type Provider = 'anthropic' | 'openai' | 'gemini' | 'deepseek'

export interface ProviderInfo {
  name: string
  emoji: string
  pricing: string
  description: string
  defaultModel: string
  keyPlaceholder: string
}

export const PROVIDER_INFO: Record<Provider, ProviderInfo> = {
  anthropic: {
    name: 'Claude (Anthropic)',
    emoji: '🟠',
    pricing: 'Sonnet: $3 / $15（入力 / 出力、1Mトークンあたり）',
    description: '日本語品質が高く、長文ライティングに最適。このアプリのデフォルト。',
    defaultModel: 'claude-sonnet-4-6',
    keyPlaceholder: 'sk-ant-...',
  },
  openai: {
    name: 'GPT (OpenAI)',
    emoji: '🟢',
    pricing: 'GPT-4o: $2.5 / $10、GPT-4o mini: $0.15 / $0.6',
    description: '汎用性が高く、世界的に最も普及しているLLM。',
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-...',
  },
  gemini: {
    name: 'Gemini (Google)',
    emoji: '🔵',
    pricing: 'Flash: 無料枠あり / Pro: $3.5 / $10.5',
    description: '無料枠で試せるコスパ最強モデル。Flash は特に高速。',
    defaultModel: 'gemini-1.5-flash',
    keyPlaceholder: 'AIza...',
  },
  deepseek: {
    name: 'DeepSeek',
    emoji: '🐋',
    pricing: '$0.27 / $1.10（1Mトークンあたり）',
    description: '圧倒的なコスパ。OpenAI互換APIなので使いやすい。',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
  },
}

export interface HistoryItem {
  id: string
  media: MediaType
  topic: string
  output: string
  provider: Provider
  charCount: number
  createdAt: string
}

export type ApiKeys = Record<Provider, string>
