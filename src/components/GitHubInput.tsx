import { useState } from 'react'

export interface GitHubContext {
  url: string
  name: string
  description: string
  language: string
  topics: string[]
  readme: string
  hasReadme: boolean
  stars: number
  fetchedAt: string
  extraFiles: { path: string; content: string }[]
}

const GITHUB_TOKEN_KEY = 'writing_assistant_github_token'

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url.trim())
    const parts = u.pathname.replace(/^\//, '').split('/')
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}

// base64 → UTF-8文字列（日本語文字化け対策）
function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

const ALLOWED_EXTENSIONS = ['.md', '.html', '.htm', '.txt']

function isAllowedFile(path: string): boolean {
  return ALLOWED_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext))
}

interface Props {
  context: GitHubContext | null
  onChange: (ctx: GitHubContext | null) => void
}

export function GitHubInput({ context, onChange }: Props) {
  const [url, setUrl] = useState(context?.url ?? '')
  const [token, setToken] = useState(localStorage.getItem(GITHUB_TOKEN_KEY) ?? '')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReadmePreview, setShowReadmePreview] = useState(false)
  const [filePath, setFilePath] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const getHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { Accept: 'application/vnd.github+json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }

  const handleSaveToken = () => {
    if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token)
    else localStorage.removeItem(GITHUB_TOKEN_KEY)
  }

  const handleFetch = async () => {
    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      setError('URLの形式が正しくありません（例：https://github.com/user/repo）')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [repoRes, readmeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers: getHeaders() }),
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, { headers: getHeaders() }),
      ])

      if (!repoRes.ok) {
        if (repoRes.status === 404) throw new Error('リポジトリが見つかりません。非公開の場合はGitHub Tokenが必要です。')
        if (repoRes.status === 403) throw new Error('APIレートリミットに達しました。GitHub Tokenを設定してください。')
        throw new Error(`取得失敗（ステータス: ${repoRes.status}）`)
      }

      const repoData = await repoRes.json()
      let readme = ''
      let hasReadme = false

      if (readmeRes.ok) {
        hasReadme = true
        const readmeData = await readmeRes.json()
        const decoded = decodeBase64Utf8(readmeData.content)
        readme = decoded.slice(0, 3000)
        if (decoded.length > 3000) readme += '\n\n（以下省略）'
      }

      onChange({
        url: url.trim(),
        name: repoData.full_name,
        description: repoData.description ?? '',
        language: repoData.language ?? '',
        topics: repoData.topics ?? [],
        readme,
        hasReadme,
        stars: repoData.stargazers_count ?? 0,
        fetchedAt: new Date().toISOString(),
        extraFiles: context?.extraFiles ?? [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchFile = async () => {
    if (!context || !filePath.trim()) return

    if (!isAllowedFile(filePath)) {
      setFileError(`対応拡張子: ${ALLOWED_EXTENSIONS.join(' / ')}`)
      return
    }

    const parsed = parseGitHubUrl(context.url)
    if (!parsed) return

    setFileLoading(true)
    setFileError(null)

    try {
      const res = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${filePath.trim()}`,
        { headers: getHeaders() }
      )

      if (!res.ok) {
        if (res.status === 404) throw new Error(`ファイルが見つかりません: ${filePath}`)
        throw new Error(`取得失敗（ステータス: ${res.status}）`)
      }

      const data = await res.json()
      const decoded = decodeBase64Utf8(data.content)
      const content = decoded.slice(0, 2000) + (decoded.length > 2000 ? '\n（以下省略）' : '')

      const alreadyExists = context.extraFiles.some((f) => f.path === filePath.trim())
      const updatedFiles = alreadyExists
        ? context.extraFiles.map((f) => f.path === filePath.trim() ? { path: filePath.trim(), content } : f)
        : [...context.extraFiles, { path: filePath.trim(), content }]

      onChange({ ...context, extraFiles: updatedFiles })
      setFilePath('')
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'ファイル取得中にエラーが発生しました')
    } finally {
      setFileLoading(false)
    }
  }

  const handleRemoveFile = (path: string) => {
    if (!context) return
    onChange({ ...context, extraFiles: context.extraFiles.filter((f) => f.path !== path) })
  }

  const handleClear = () => {
    onChange(null)
    setUrl('')
    setError(null)
    setShowReadmePreview(false)
    setFilePath('')
    setFileError(null)
  }

  const promptCharCount = context
    ? [context.name, context.description, context.language, context.topics.join(', '), context.readme, ...context.extraFiles.map((f) => f.content)]
        .filter(Boolean).join('\n').length
    : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-base">🐙</span>
        <span className="text-sm font-medium text-gray-600">GitHubリポジトリ（任意）</span>
        {context && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full ml-auto">
            ✓ 取得済み
          </span>
        )}
      </div>

      <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
        <p className="text-xs text-gray-400">
          リポジトリのREADMEや概要を読み取って、より正確な記事を生成します。
        </p>

        {/* URL入力 */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null) }}
            placeholder="https://github.com/user/repo"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm
              text-gray-800 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
              transition min-h-[44px]"
          />
          <button
            onClick={handleFetch}
            disabled={!url.trim() || loading}
            className="px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium
              hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? '取得中...' : '取得'}
          </button>
          {context && (
            <button
              onClick={handleClear}
              className="px-3 rounded-xl bg-red-50 text-red-400 text-xs hover:bg-red-100 transition min-h-[44px]"
            >
              クリア
            </button>
          )}
        </div>

        {/* GitHub Token */}
        <details className="group">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            GitHub Token（非公開リポジトリ・レートリミット対策）
          </summary>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-12
                  text-sm placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showToken ? '隠す' : '表示'}
              </button>
            </div>
            <button
              onClick={handleSaveToken}
              className="px-3 rounded-xl bg-gray-100 text-gray-600 text-xs hover:bg-gray-200 transition"
            >
              保存
            </button>
          </div>
        </details>

        {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">⚠️ {error}</p>}

        {/* 取得結果 */}
        {context && (
          <div className="rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
            <div className="px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">{context.name}</p>
                <span className="text-xs text-gray-400">
                  {new Date(context.fetchedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 取得
                </span>
              </div>

              {context.description && <p className="text-xs text-gray-500">{context.description}</p>}

              <div className="flex flex-wrap gap-1.5">
                {context.language && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{context.language}</span>
                )}
                {context.stars > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">⭐ {context.stars}</span>
                )}
                {context.topics.slice(0, 5).map((t) => (
                  <span key={t} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1">
                <FetchStatusItem ok label="リポジトリ情報" />
                <FetchStatusItem ok={!!context.description} label="概要文" />
                <FetchStatusItem ok={context.hasReadme} label="README" detail={context.hasReadme ? `${context.readme.length}字` : '未検出'} />
                <FetchStatusItem ok={context.topics.length > 0} label="トピックタグ" detail={context.topics.length > 0 ? `${context.topics.length}件` : '未設定'} />
              </div>

              <p className="text-xs text-indigo-500 pt-0.5">
                📋 プロンプトへの注入量：約 {promptCharCount.toLocaleString()} 字
              </p>
            </div>

            {/* READMEプレビュー */}
            {context.hasReadme && (
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setShowReadmePreview((v) => !v)}
                  className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-left flex items-center gap-1"
                >
                  <span className={`transition-transform inline-block ${showReadmePreview ? 'rotate-90' : ''}`}>▶</span>
                  READMEプレビュー（プロンプトに渡される内容）
                </button>
                {showReadmePreview && (
                  <pre className="px-3 pb-3 text-xs text-gray-500 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-mono bg-white border-t border-gray-100">
                    {context.readme || '（内容なし）'}
                  </pre>
                )}
              </div>
            )}

            {/* 追加ファイル一覧 */}
            {context.extraFiles.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2 space-y-1">
                <p className="text-xs text-gray-500 font-medium">追加ファイル</p>
                {context.extraFiles.map((f) => (
                  <div key={f.path} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 font-mono truncate">{f.path}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{f.content.length}字</span>
                      <button
                        onClick={() => handleRemoveFile(f.path)}
                        className="text-gray-300 hover:text-red-400 transition text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 追加ファイル読み込み */}
        {context && (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 font-medium">追加ファイルを読み込む</p>
            <p className="text-xs text-gray-400">対応形式: .md / .html / .htm / .txt</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={filePath}
                onChange={(e) => { setFilePath(e.target.value); setFileError(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchFile()}
                placeholder="例: docs/setup.md"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm
                  text-gray-800 placeholder-gray-400 font-mono
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
              <button
                onClick={handleFetchFile}
                disabled={!filePath.trim() || fileLoading}
                className="px-4 rounded-xl bg-gray-700 text-white text-sm font-medium
                  hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {fileLoading ? '取得中...' : '追加'}
              </button>
            </div>
            {fileError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">⚠️ {fileError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function FetchStatusItem({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs ${ok ? 'text-green-500' : 'text-gray-300'}`}>{ok ? '✓' : '✗'}</span>
      <span className="text-xs text-gray-500">{label}</span>
      {detail && <span className="text-xs text-gray-400">（{detail}）</span>}
    </div>
  )
}
