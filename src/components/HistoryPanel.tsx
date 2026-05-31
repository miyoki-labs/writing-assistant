import { PROVIDER_INFO, type HistoryItem } from '../types'
import { MEDIA_CONFIG } from '../prompts/mediaPrompts'

interface Props {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void   // モーダル表示用
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function HistoryPanel({ history, onSelect, onDelete, onClearAll }: Props) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm space-y-1">
        <span className="text-2xl">📭</span>
        <p>まだ履歴がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          onClick={onClearAll}
          className="text-xs text-red-400 hover:text-red-600 transition"
        >
          すべて削除
        </button>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5
              hover:border-indigo-200 hover:shadow-sm transition cursor-pointer group"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm">{MEDIA_CONFIG[item.media].emoji}</span>
                <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                  {item.topic}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                  開く
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                  className="text-gray-300 hover:text-red-400 transition text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {item.output.slice(0, 80)}...
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <span>{PROVIDER_INFO[item.provider].emoji}</span>
                <span>{PROVIDER_INFO[item.provider].name.split(' ')[0]}</span>
                <span>· {item.charCount.toLocaleString()}字</span>
              </div>
              <span>
                {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
