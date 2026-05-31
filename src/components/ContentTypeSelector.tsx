export type ContentType = 'overview' | 'technical' | 'emotional'

export interface ContentTypeConfig {
  label: string
  emoji: string
  description: string
  hint: string
}

export const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  overview: {
    label: '全体像',
    emoji: '🗺️',
    description: '何を作ったか・なぜ作ったか・全体の流れ',
    hint: '開発の背景・目的・構成・結果をざっくり伝える記事',
  },
  technical: {
    label: '技術',
    emoji: '⚙️',
    description: '実装の詳細・コード・技術的な判断',
    hint: '具体的な実装方法・設計の意図・詰まった点と解決策を伝える記事',
  },
  emotional: {
    label: '感情',
    emoji: '💬',
    description: '体験・気づき・変化・感情の動き',
    hint: '作ってみてどう感じたか・何が変わったか・読者への問いかけ',
  },
}

interface Props {
  selected: ContentType
  onChange: (type: ContentType) => void
  disabled: boolean
}

export function ContentTypeSelector({ selected, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        文章タイプ
      </label>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CONTENT_TYPE_CONFIG) as [ContentType, ContentTypeConfig][]).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              disabled={disabled}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200 min-h-[44px]
                ${selected === key
                  ? 'bg-violet-600 text-white shadow-md scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </button>
          )
        )}
      </div>
      <p className="text-xs text-gray-400">{CONTENT_TYPE_CONFIG[selected].hint}</p>
    </div>
  )
}
