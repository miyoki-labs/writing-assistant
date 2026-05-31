import { useEffect, useState } from 'react'
import { PROVIDER_INFO, type HistoryItem } from '../types'
import { MEDIA_CONFIG } from '../prompts/mediaPrompts'

interface Props {
  item: HistoryItem
  onClose: () => void
  onDelete: (id: string) => void
}

export function HistoryModal({ item, onClose, onDelete }: Props) {
  const [copied, setCopied] = useState(false)

  // ESCキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    onDelete(item.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* ヘッダー */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{MEDIA_CONFIG[item.media].emoji}</span>
              <span className="text-sm font-semibold text-gray-800">{item.topic}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              <span>{PROVIDER_INFO[item.provider].emoji} {PROVIDER_INFO[item.provider].name.split(' ')[0]}</span>
              <span>·</span>
              <span>{item.charCount.toLocaleString()}字</span>
              <span>·</span>
              <span>
                {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric', month: 'numeric', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-lg leading-none ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* 本文 */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
            {item.output}
          </pre>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0 gap-3">
          <button
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-red-50"
          >
            削除
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl
                border border-gray-200 hover:border-gray-300 transition min-h-[36px]"
            >
              閉じる
            </button>
            <button
              onClick={handleCopy}
              className={`text-sm font-medium px-5 py-2 rounded-xl transition min-h-[36px]
                ${copied
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
            >
              {copied ? '✓ コピー済み' : 'コピー'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
