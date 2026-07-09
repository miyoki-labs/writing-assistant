import { useState, useEffect, useRef } from 'react'
import { MediaSelector } from './components/MediaSelector'
import { ContentTypeSelector, type ContentType } from './components/ContentTypeSelector'
import { OutputDisplay } from './components/OutputDisplay'
import { ApiKeyInput, loadSavedApiKeys } from './components/ApiKeyInput'
import { CharCountControl, MEDIA_CHAR_GUIDE } from './components/CharCountControl'
import { ReferenceText, loadSavedReference } from './components/ReferenceText'
import { GitHubInput, type GitHubContext } from './components/GitHubInput'
import { HistoryPanel } from './components/HistoryPanel'
import { HistoryModal } from './components/HistoryModal'
import { ImagePromptGenerator } from './components/ImagePromptGenerator'
import { TokenUsageDisplay, TokenUsageSummary } from './components/TokenUsageDisplay'
import { useStreamingChat } from './hooks/useStreamingChat'
import { DEMO_MODE, SAMPLE_TOPIC } from './demo'
import { useImagePrompts } from './hooks/useImagePrompts'
import type { ImageTool } from './prompts/imagePrompts'
import { MEDIA_CONFIG, type MediaType } from './prompts/mediaPrompts'
import type { Provider, ApiKeys, HistoryItem } from './types'

const HISTORY_KEY = 'writing_assistant_history'

function loadHistory(): HistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveHistory(history: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
}

export default function App() {
  const [selectedMedia, setSelectedMedia] = useState<MediaType>('zenn')
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('overview')
  const [selectedProvider, setSelectedProvider] = useState<Provider>('anthropic')
  const [topic, setTopic] = useState('')
  const [apiKeys, setApiKeys] = useState<ApiKeys>(loadSavedApiKeys)
  const [targetChars, setTargetChars] = useState(MEDIA_CHAR_GUIDE['zenn'].recommended)
  const [referenceText, setReferenceText] = useState(loadSavedReference)
  const [githubContext, setGithubContext] = useState<GitHubContext | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)

  const { output, isStreaming, error, tokenUsage, generate, streamSample, reset } = useStreamingChat()
  const imagePrompts = useImagePrompts()

  // ストリーミング完了後に履歴保存
  const prevStreaming = useRef(false)
  const savedRef = useRef({ topic, media: selectedMedia, provider: selectedProvider })
  savedRef.current = { topic, media: selectedMedia, provider: selectedProvider }
  const isSampleRef = useRef(false)

  useEffect(() => {
    // サンプル出力は「生成した記事」ではないので履歴に残さない
    if (prevStreaming.current && !isStreaming && isSampleRef.current) {
      isSampleRef.current = false
      prevStreaming.current = isStreaming
      return
    }
    if (prevStreaming.current && !isStreaming && output) {
      const { topic: t, media: m, provider: p } = savedRef.current
      const item: HistoryItem = {
        id: Date.now().toString(),
        media: m,
        topic: t,
        output,
        provider: p,
        charCount: output.length,
        createdAt: new Date().toISOString(),
      }
      setHistory((prev) => {
        const updated = [item, ...prev]
        saveHistory(updated)
        return updated
      })
    }
    prevStreaming.current = isStreaming
  }, [isStreaming, output])

  const currentKey = apiKeys[selectedProvider]
  const canGenerate = !!(topic.trim() && currentKey.trim() && !isStreaming)

  const handleGenerate = async () => {
    if (!canGenerate) return
    await generate({
      topic, media: selectedMedia, contentType: selectedContentType,
      provider: selectedProvider, apiKey: currentKey, targetChars, referenceText,
      github: githubContext ? {
        name: githubContext.name,
        description: githubContext.description,
        language: githubContext.language,
        topics: githubContext.topics,
        readme: githubContext.readme,
        extraFiles: githubContext.extraFiles,
      } : null,
    })
  }

  const handleMediaChange = (media: MediaType) => {
    setSelectedMedia(media)
    setTargetChars(MEDIA_CHAR_GUIDE[media].recommended)
    reset()
  }

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistoryItem(item)
    setHistoryOpen(false)
  }

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id)
      saveHistory(updated)
      return updated
    })
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  const handleGenerateImagePrompts = (tools: ImageTool[], extraElements: string) => {
    if (!output || !currentKey) return
    imagePrompts.generate({
      tools, extraElements,
      articleContent: output,
      media: selectedMedia,
      provider: selectedProvider,
      apiKey: currentKey,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">

        {/* メインエリア */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Writing Assistant</h1>
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="lg:hidden flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              📋 履歴
              {history.length > 0 && (
                <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* APIキー・プロバイダー選択 */}
          <ApiKeyInput
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            apiKeys={apiKeys}
            onApiKeysChange={setApiKeys}
          />

          {/* 媒体セレクター */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              媒体を選択
            </label>
            <MediaSelector
              selected={selectedMedia}
              onChange={handleMediaChange}
              disabled={isStreaming}
            />
            <p className="text-xs text-gray-400">{MEDIA_CONFIG[selectedMedia].description}</p>
          </div>

          {/* 文章タイプセレクター */}
          <ContentTypeSelector
            selected={selectedContentType}
            onChange={setSelectedContentType}
            disabled={isStreaming}
          />

          {/* 文字数指定 */}
          <CharCountControl media={selectedMedia} value={targetChars} onChange={setTargetChars} />

          {/* トピック入力 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              トピック
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例：Claude APIをフロントエンドから直接叩いてみた"
              disabled={isStreaming}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm
                text-gray-800 placeholder-gray-400 resize-none
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>

          {/* GitHubリポジトリ */}
          <GitHubInput context={githubContext} onChange={setGithubContext} />

          {/* リファレンス文 */}
          <ReferenceText value={referenceText} onChange={setReferenceText} />

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm
              hover:bg-indigo-700 active:scale-95 transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[44px]"
          >
            {isStreaming ? '生成中...' : !currentKey.trim() ? 'APIキーを入力してください' : '生成する'}
          </button>

          {/* 公開デモ: キーが無くても媒体別の書き分けを体験できる経路 */}
          {DEMO_MODE && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs text-amber-800 leading-relaxed">
                APIキーをお持ちでない場合は、<strong className="font-semibold">サンプル出力</strong>をご覧いただけます。
                生成は行わず、あらかじめ用意した出力を再生します（同じトピックでも媒体ごとに構成・語調・長さが変わります）。
              </p>
              <button
                onClick={() => {
                  isSampleRef.current = true
                  streamSample(selectedMedia)
                }}
                disabled={isStreaming}
                className="w-full py-2.5 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold text-sm
                  hover:bg-amber-100 active:scale-95 transition-all duration-150
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[44px]"
              >
                {isStreaming ? '再生中...' : `サンプル出力を見る（${selectedMedia}）`}
              </button>
              <p className="text-[11px] text-amber-700/80 leading-relaxed">
                トピック: {SAMPLE_TOPIC}
              </p>
            </div>
          )}

          {/* 出力エリア */}
          <div className="space-y-2">
            {output && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{output.length.toLocaleString()}字</span>
                {!isStreaming && (
                  <button
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition"
                  >
                    コピー
                  </button>
                )}
              </div>
            )}
            <OutputDisplay output={output} isStreaming={isStreaming} error={error} />
            {tokenUsage && !isStreaming && (
              <TokenUsageDisplay usage={tokenUsage} label="記事生成コスト" />
            )}
          </div>

          {/* 画像プロンプト生成（記事生成後に表示） */}
          {output && !isStreaming && (
            <>
              <ImagePromptGenerator
                onGenerate={handleGenerateImagePrompts}
                results={imagePrompts.results}
                loading={imagePrompts.loading}
                errors={imagePrompts.errors}
                isLoading={imagePrompts.isLoading}
              />
              {imagePrompts.tokenUsages.length > 0 && !imagePrompts.isLoading && (
                <TokenUsageSummary
                  usages={imagePrompts.tokenUsages}
                  label="画像プロンプト生成コスト"
                />
              )}
              {tokenUsage && imagePrompts.tokenUsages.length > 0 && !imagePrompts.isLoading && (
                <TokenUsageSummary
                  usages={[tokenUsage, ...imagePrompts.tokenUsages]}
                  label="セッション合計コスト"
                />
              )}
            </>
          )}

        </div>

        {/* サイドパネル（デスクトップ） */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">📋 生成履歴</h2>
              {history.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  {history.length}件
                </span>
              )}
            </div>
            <HistoryPanel
              history={history}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearHistory}
            />
          </div>
        </div>

        {/* モバイル履歴ドロワー */}
        {historyOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setHistoryOpen(false)} />
            <div className="w-72 bg-white h-full p-4 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">📋 生成履歴</h2>
                <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <HistoryPanel
                history={history}
                onSelect={handleSelectHistory}
                onDelete={handleDeleteHistory}
                onClearAll={handleClearHistory}
              />
            </div>
          </div>
        )}

      </div>

      {/* 履歴モーダル */}
      {selectedHistoryItem && (
        <HistoryModal
          item={selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
          onDelete={(id) => {
            handleDeleteHistory(id)
            setSelectedHistoryItem(null)
          }}
        />
      )}
    </div>
  )
}
