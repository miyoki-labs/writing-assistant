import { useState } from 'react'

const STORAGE_KEY = 'writing_assistant_reference'

export function loadSavedReference(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

interface Props {
  value: string
  onChange: (v: string) => void
}

export function ReferenceText({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(true)

  const handleChange = (v: string) => {
    onChange(v)
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, value)
    setSaved(true)
  }

  const handleClear = () => {
    onChange('')
    localStorage.removeItem(STORAGE_KEY)
    setSaved(true)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <span className="font-medium">リファレンス文（任意）</span>
          {value && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
              {value.length}字
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 pt-3">
            自分の過去記事や文章を貼ると、そのトンマナ・温度感で生成します。
          </p>
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="ここに参考にしたい文章を貼り付けてください..."
            rows={5}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm
              text-gray-800 placeholder-gray-400 resize-none
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          />
          <div className="flex gap-2 justify-end">
            {value && (
              <button
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 transition"
              >
                クリア
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saved}
              className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5
                rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? '保存済み' : '保存する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
