import { useState, useCallback } from 'react'
import { streamGenerate } from '../providers/streamingProvider'
import { buildSystemPrompt, type MediaType, type GitHubContextSlim } from '../prompts/mediaPrompts'
import type { ContentType } from '../components/ContentTypeSelector'
import type { Provider } from '../types'
import type { TokenUsage } from '../utils/tokenCost'
import { SAMPLE_OUTPUTS } from '../demo'

interface GenerateParams {
  topic: string
  media: MediaType
  contentType: ContentType
  provider: Provider
  apiKey: string
  targetChars: number
  referenceText: string
  github?: GitHubContextSlim | null
}

interface UseStreamingChatReturn {
  output: string
  isStreaming: boolean
  error: string | null
  tokenUsage: TokenUsage | null
  generate: (params: GenerateParams) => Promise<void>
  /** APIを呼ばず、事前に用意した出力を同じ体感で再生する（公開デモ用） */
  streamSample: (media: MediaType) => Promise<void>
  reset: () => void
}

export function useStreamingChat(): UseStreamingChatReturn {
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)

  const generate = useCallback(async (params: GenerateParams) => {
    const { topic, media, contentType, provider, apiKey, targetChars, referenceText, github } = params
    if (!topic.trim() || !apiKey.trim()) return

    setOutput('')
    setError(null)
    setTokenUsage(null)
    setIsStreaming(true)

    try {
      const systemPrompt = buildSystemPrompt(media, contentType, referenceText || undefined, github ?? undefined)
      const userMessage =
        `以下のトピックで${media}向けの記事ドラフトを書いてください。\n` +
        `目安文字数：${targetChars}字前後\n\n` +
        `トピック：${topic}`

      const usage = await streamGenerate({
        provider,
        apiKey,
        systemPrompt,
        userMessage,
        maxTokens: Math.max(4096, Math.ceil(targetChars * 2.5)),
        onChunk: (text) => setOutput((prev) => prev + text),
      })
      setTokenUsage(usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成中にエラーが発生しました')
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const streamSample = useCallback(async (media: MediaType) => {
    setOutput('')
    setError(null)
    setTokenUsage(null)
    setIsStreaming(true)

    const text = SAMPLE_OUTPUTS[media]
    // 実際の生成と同じ体感になるよう、数文字ずつ流す。
    // ※ブラウザ自動化で「遅い」と見えたら、それはタブが hidden で setTimeout が
    //   1秒に1回へクランプされているだけ（描画は速い。long task も出ない）。
    const STEP = 2
    for (let i = STEP; i < text.length; i += STEP) {
      await new Promise((r) => setTimeout(r, 12))
      setOutput(text.slice(0, i))
    }
    setOutput(text)
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setOutput('')
    setError(null)
    setTokenUsage(null)
  }, [])

  return { output, isStreaming, error, tokenUsage, generate, streamSample, reset }
}
