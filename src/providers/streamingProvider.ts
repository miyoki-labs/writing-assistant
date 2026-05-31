import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Provider } from '../types'
import type { TokenUsage } from '../utils/tokenCost'

export interface StreamParams {
  provider: Provider
  apiKey: string
  systemPrompt: string
  userMessage: string
  maxTokens: number
  onChunk: (text: string) => void
}

export async function streamGenerate(params: StreamParams): Promise<TokenUsage> {
  const { provider, apiKey, systemPrompt, userMessage, maxTokens, onChunk } = params

  switch (provider) {
    case 'anthropic':
      return streamAnthropic({ apiKey, systemPrompt, userMessage, maxTokens, onChunk })
    case 'openai':
      return streamOpenAI({ apiKey, systemPrompt, userMessage, maxTokens, onChunk, baseURL: undefined })
    case 'deepseek':
      return streamOpenAI({ apiKey, systemPrompt, userMessage, maxTokens, onChunk, baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' })
    case 'gemini':
      return streamGemini({ apiKey, systemPrompt, userMessage, maxTokens, onChunk })
  }
}

async function streamAnthropic(params: {
  apiKey: string; systemPrompt: string; userMessage: string
  maxTokens: number; onChunk: (t: string) => void
}): Promise<TokenUsage> {
  const client = new Anthropic({ apiKey: params.apiKey, dangerouslyAllowBrowser: true })
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userMessage }],
  })

  let inputTokens = 0
  let outputTokens = 0

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      params.onChunk(chunk.delta.text)
    }
    if (chunk.type === 'message_delta' && chunk.usage) {
      outputTokens = chunk.usage.output_tokens
    }
    if (chunk.type === 'message_start' && chunk.message.usage) {
      inputTokens = chunk.message.usage.input_tokens
    }
  }

  return { inputTokens, outputTokens, provider: 'anthropic' }
}

async function streamOpenAI(params: {
  apiKey: string; systemPrompt: string; userMessage: string
  maxTokens: number; onChunk: (t: string) => void
  baseURL: string | undefined; model?: string
}): Promise<TokenUsage> {
  const provider = params.baseURL ? 'deepseek' : 'openai'
  const client = new OpenAI({ apiKey: params.apiKey, baseURL: params.baseURL, dangerouslyAllowBrowser: true })
  const stream = await client.chat.completions.create({
    model: params.model ?? 'gpt-4o',
    max_tokens: params.maxTokens,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ],
  })

  let inputTokens = 0
  let outputTokens = 0

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) params.onChunk(text)
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens
      outputTokens = chunk.usage.completion_tokens
    }
  }

  return { inputTokens, outputTokens, provider }
}

async function streamGemini(params: {
  apiKey: string; systemPrompt: string; userMessage: string
  maxTokens: number; onChunk: (t: string) => void
}): Promise<TokenUsage> {
  const genAI = new GoogleGenerativeAI(params.apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: params.systemPrompt,
  })
  const result = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: params.userMessage }] }],
    generationConfig: { maxOutputTokens: params.maxTokens },
  })

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) params.onChunk(text)
  }

  const response = await result.response
  const meta = response.usageMetadata
  return {
    inputTokens: meta?.promptTokenCount ?? 0,
    outputTokens: meta?.candidatesTokenCount ?? 0,
    provider: 'gemini',
  }
}
