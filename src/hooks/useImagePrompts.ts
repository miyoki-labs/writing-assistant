import { useState, useCallback } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildImagePromptInstruction, type ImageTool } from '../prompts/imagePrompts'
import type { Provider } from '../types'
import type { MediaType } from '../prompts/mediaPrompts'
import type { TokenUsage } from '../utils/tokenCost'

export type ImagePromptResults = Partial<Record<ImageTool, string>>

interface GenerateImagePromptsParams {
  tools: ImageTool[]
  articleContent: string
  media: MediaType
  extraElements: string
  provider: Provider
  apiKey: string
}

interface ApiResult {
  text: string
  usage: TokenUsage
}

async function callApi(provider: Provider, apiKey: string, userMessage: string): Promise<ApiResult> {
  const system = 'あなたは画像生成プロンプトの専門家です。指定された形式・ルールに厳密に従って、最適な画像生成プロンプトを1つだけ出力してください。余計な説明・前置き・番号付けは不要です。'

  switch (provider) {
    case 'anthropic': {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
      const res = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 1024, system,
        messages: [{ role: 'user', content: userMessage }],
      })
      return {
        text: res.content[0].type === 'text' ? res.content[0].text : '',
        usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, provider },
      }
    }
    case 'openai': {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
      const res = await client.chat.completions.create({
        model: 'gpt-4o', max_tokens: 1024,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }],
      })
      return {
        text: res.choices[0]?.message?.content ?? '',
        usage: { inputTokens: res.usage?.prompt_tokens ?? 0, outputTokens: res.usage?.completion_tokens ?? 0, provider },
      }
    }
    case 'deepseek': {
      const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com', dangerouslyAllowBrowser: true })
      const res = await client.chat.completions.create({
        model: 'deepseek-chat', max_tokens: 1024,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }],
      })
      return {
        text: res.choices[0]?.message?.content ?? '',
        usage: { inputTokens: res.usage?.prompt_tokens ?? 0, outputTokens: res.usage?.completion_tokens ?? 0, provider },
      }
    }
    case 'gemini': {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: system })
      const res = await model.generateContent(userMessage)
      return {
        text: res.response.text(),
        usage: {
          inputTokens: res.response.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: res.response.usageMetadata?.candidatesTokenCount ?? 0,
          provider,
        },
      }
    }
  }
}

export function useImagePrompts() {
  const [results, setResults] = useState<ImagePromptResults>({})
  const [loading, setLoading] = useState<Partial<Record<ImageTool, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<ImageTool, string>>>({})
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([])

  const generate = useCallback(async (params: GenerateImagePromptsParams) => {
    const { tools, articleContent, media, extraElements, provider, apiKey } = params

    setResults({})
    setErrors({})
    setTokenUsages([])
    setLoading(Object.fromEntries(tools.map((t) => [t, true])))

    await Promise.all(
      tools.map(async (tool) => {
        try {
          const instruction = buildImagePromptInstruction(tool, articleContent, media, extraElements)
          const { text, usage } = await callApi(provider, apiKey, instruction)
          setResults((prev) => ({ ...prev, [tool]: text }))
          setTokenUsages((prev) => [...prev, usage])
        } catch (err) {
          setErrors((prev) => ({ ...prev, [tool]: err instanceof Error ? err.message : 'エラーが発生しました' }))
        } finally {
          setLoading((prev) => ({ ...prev, [tool]: false }))
        }
      })
    )
  }, [])

  const reset = useCallback(() => {
    setResults({})
    setErrors({})
    setLoading({})
    setTokenUsages([])
  }, [])

  const isLoading = Object.values(loading).some(Boolean)

  return { results, loading, errors, isLoading, tokenUsages, generate, reset }
}
