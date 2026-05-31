import { MEDIA_CONFIG, type MediaType } from '../prompts/mediaPrompts'

interface Props {
  selected: MediaType
  onChange: (media: MediaType) => void
  disabled: boolean
}

export function MediaSelector({ selected, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(MEDIA_CONFIG) as [MediaType, typeof MEDIA_CONFIG[MediaType]][]).map(
        ([key, config]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
              transition-all duration-200 min-h-[44px]
              ${
                selected === key
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
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
  )
}
