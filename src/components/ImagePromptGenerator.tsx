import { useState } from 'react'
import { IMAGE_TOOL_CONFIG, type ImageTool } from '../prompts/imagePrompts'
import type { ImagePromptResults } from '../hooks/useImagePrompts'

interface Props {
  onGenerate: (tools: ImageTool[], extraElements: string) => void
  results: ImagePromptResults
  loading: Partial<Record<ImageTool, boolean>>
  errors: Partial<Record<ImageTool, string>>
  isLoading: boolean
}

export function ImagePromptGenerator({ onGenerate, results, loading, errors, isLoading }: Props) {
  const [selectedTools, setSelectedTools] = useState<ImageTool[]>([])
  const [extraElements, setExtraElements] = useState('')
  const [copiedTool, setCopiedTool] = useState<ImageTool | null>(null)

  const toggleTool = (tool: ImageTool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const handleCopy = async (tool: ImageTool, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedTool(tool)
    setTimeout(() => setCopiedTool(null), 2000)
  }

  const hasResults = Object.keys(results).length > 0

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 bg-violet-100">
        <span className="text-base">🖼️</span>
        <span className="text-sm font-semibold text-violet-800">画像プロンプト生成</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* ツール選択 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
            ツールを選択（複数可）
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(IMAGE_TOOL_CONFIG) as [ImageTool, typeof IMAGE_TOOL_CONFIG[ImageTool]][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  onClick={() => toggleTool(key)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                    transition min-h-[36px] border
                    ${selectedTools.includes(key)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              )
            )}
          </div>
          {selectedTools.length > 0 && (
            <div className="space-y-0.5">
              {selectedTools.map((t) => (
                <p key={t} className="text-xs text-gray-400">
                  {IMAGE_TOOL_CONFIG[t].emoji} {IMAGE_TOOL_CONFIG[t].description}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* 追加要素入力 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
            入れたい要素（任意）
          </label>
          <input
            type="text"
            value={extraElements}
            onChange={(e) => setExtraElements(e.target.value)}
            placeholder="例：青系の色調・ノートPCが映っている・ミニマルなデザイン"
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm
              text-gray-800 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
              disabled:opacity-50 transition"
          />
        </div>

        {/* 生成ボタン */}
        <button
          onClick={() => onGenerate(selectedTools, extraElements)}
          disabled={selectedTools.length === 0 || isLoading}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm
            hover:bg-violet-700 active:scale-95 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[44px]"
        >
          {isLoading ? '生成中...' : '画像プロンプトを生成'}
        </button>

        {/* 結果表示 */}
        {(hasResults || isLoading) && (
          <div className="space-y-3">
            {selectedTools.map((tool) => {
              const config = IMAGE_TOOL_CONFIG[tool]
              const result = results[tool]
              const isToolLoading = loading[tool]
              const error = errors[tool]

              return (
                <div key={tool} className="rounded-xl bg-white border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-600">
                      {config.emoji} {config.label}
                    </span>
                    {result && (
                      <button
                        onClick={() => handleCopy(tool, result)}
                        className="text-xs text-violet-500 hover:text-violet-700 transition px-2 py-0.5
                          rounded-md hover:bg-violet-50"
                      >
                        {copiedTool === tool ? '✓ コピー済み' : 'コピー'}
                      </button>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    {isToolLoading && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="animate-pulse">●</span> 生成中...
                      </div>
                    )}
                    {error && <p className="text-xs text-red-500">⚠️ {error}</p>}
                    {result && (
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                        {result}
                      </pre>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
