import type { MediaType } from '../prompts/mediaPrompts'

interface MediaCharGuide {
  min: number
  max: number
  recommended: number
  label: string
  note: string
}

export const MEDIA_CHAR_GUIDE: Record<MediaType, MediaCharGuide> = {
  x:     { min: 140,  max: 700,   recommended: 420,  label: '140字/ツイート × 3本',  note: '1ツイートは140字上限' },
  zenn:  { min: 1500, max: 8000,  recommended: 3000, label: '2500〜4000字（人気記事中央値）', note: 'ファン構築・全体像なら3000字以上が効果的' },
  qiita: { min: 2000, max: 12000, recommended: 5000, label: '4000〜6000字（人気記事中央値）', note: '技術解説は5000字前後が保存率・LGTM数ともに高い' },
  note:  { min: 800,  max: 5000,  recommended: 1800, label: '1500〜2500字（人気記事中央値）', note: '感情・ビジョン系は1800字前後が読了率・フォロー転換率ともに高い' },
}

interface Props {
  media: MediaType
  value: number
  onChange: (v: number) => void
}

export function CharCountControl({ media, value, onChange }: Props) {
  const guide = MEDIA_CHAR_GUIDE[media]

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value)
    if (!isNaN(n) && n > 0) onChange(Math.min(n, guide.max * 2))
  }

  const pct = Math.min(100, Math.max(0, ((value - guide.min) / (guide.max - guide.min)) * 100))
  const inRange = value >= guide.min && value <= guide.max

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          目安文字数
        </label>
        <span className={`text-xs font-medium ${inRange ? 'text-indigo-600' : 'text-amber-500'}`}>
          {inRange ? '✓ 推奨範囲内' : '推奨範囲外'}
        </span>
      </div>

      {/* ガイドバー */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs space-y-1.5">
        <div className="flex justify-between text-gray-500">
          <span>{guide.label}</span>
          <span className="text-gray-400">{guide.note}</span>
        </div>
        <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-indigo-200 rounded-full"
            style={{
              left: `${((guide.min - guide.min) / (guide.max - guide.min)) * 100}%`,
              width: '100%',
            }}
          />
          <div
            className="absolute inset-y-0 bg-indigo-500 rounded-full w-1"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-gray-400">
          <span>{guide.min}字</span>
          <span className="text-indigo-600 font-medium">推奨 {guide.recommended}字</span>
          <span>{guide.max}字</span>
        </div>
      </div>

      {/* スライダー + 数値入力 */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={guide.min}
          max={guide.max}
          step={50}
          value={Math.min(value, guide.max)}
          onChange={handleSlider}
          className="flex-1 accent-indigo-600"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={handleInput}
            min={1}
            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          <span className="text-xs text-gray-400">字</span>
        </div>
      </div>
    </div>
  )
}
