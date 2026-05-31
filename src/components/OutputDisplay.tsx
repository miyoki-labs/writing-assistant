interface Props {
  output: string
  isStreaming: boolean
  error: string | null
}

export function OutputDisplay({ output, isStreaming, error }: Props) {
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
        ⚠️ {error}
      </div>
    )
  }

  if (!output && !isStreaming) {
    return (
      <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
        トピックを入力して「生成する」を押してください
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
      <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
        {output}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
        )}
      </pre>
    </div>
  )
}
