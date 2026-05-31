import { useState } from 'react'
import { PROVIDER_INFO, type Provider, type ApiKeys } from '../types'

const STORAGE_KEY = 'writing_assistant_api_keys'

export function loadSavedApiKeys(): ApiKeys {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { anthropic: '', openai: '', gemini: '', deepseek: '' }
  } catch {
    return { anthropic: '', openai: '', gemini: '', deepseek: '' }
  }
}

interface Props {
  selectedProvider: Provider
  onProviderChange: (p: Provider) => void
  apiKeys: ApiKeys
  onApiKeysChange: (keys: ApiKeys) => void
}

export function ApiKeyInput({ selectedProvider, onProviderChange, apiKeys, onApiKeysChange }: Props) {
  const [visible, setVisible] = useState(false)
  const [saved, setSaved] = useState(true)

  const currentKey = apiKeys[selectedProvider]

  const handleKeyChange = (value: string) => {
    onApiKeysChange({ ...apiKeys, [selectedProvider]: value })
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys))
    setSaved(true)
  }

  const handleClear = () => {
    const updated = { ...apiKeys, [selectedProvider]: '' }
    onApiKeysChange(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSaved(true)
  }

  const info = PROVIDER_INFO[selectedProvider]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AIプロバイダー</p>

      {/* プロバイダー選択タブ */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROVIDER_INFO) as Provider[]).map((p) => (
          <button
            key={p}
            onClick={() => { onProviderChange(p); setSaved(true) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition min-h-[36px]
              ${selectedProvider === p
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <span>{PROVIDER_INFO[p].emoji}</span>
            <span>{PROVIDER_INFO[p].name}</span>
            {apiKeys[p] && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-0.5" />}
          </button>
        ))}
      </div>

      {/* 選択中プロバイダーの情報 */}
      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 space-y-0.5">
        <p>{info.description}</p>
        <p className="text-gray-400">💰 {info.pricing}</p>
      </div>

      {/* APIキー入力 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={currentKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder={info.keyPlaceholder}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12
              text-sm text-gray-800 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
              transition min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            {visible ? '隠す' : '表示'}
          </button>
        </div>

        {currentKey && (
          <button
            onClick={handleClear}
            className="px-3 rounded-xl bg-red-50 text-red-400 text-xs hover:bg-red-100 transition min-h-[44px]"
          >
            クリア
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saved || !currentKey}
          className="px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium
            hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {saved ? '保存済' : '保存'}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        キーはブラウザのlocalStorageにのみ保存されます。サーバーには送信されません。
      </p>
    </div>
  )
}
