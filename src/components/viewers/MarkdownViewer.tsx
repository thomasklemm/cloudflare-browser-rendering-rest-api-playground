import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Code, Download } from 'lucide-react'

interface MarkdownViewerProps {
  data: string
}

export function MarkdownViewer({ data }: MarkdownViewerProps) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-2 border-b border-surface-300">
        <button
          onClick={() => setShowRaw(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            !showRaw ? 'bg-surface-300 text-surface-900' : 'text-surface-600 hover:text-surface-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Rendered
        </button>
        <button
          onClick={() => setShowRaw(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            showRaw ? 'bg-surface-300 text-surface-900' : 'text-surface-600 hover:text-surface-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Raw
        </button>
        <button
          onClick={() => {
            const blob = new Blob([data], { type: 'text/markdown;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `markdown-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.md`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-surface-600 hover:text-surface-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download .md
        </button>
      </div>
      {showRaw ? (
        <pre className="flex-1 p-4 text-xs text-surface-700 overflow-auto whitespace-pre-wrap break-all">
          {data}
        </pre>
      ) : (
        <div className="flex-1 p-4 overflow-auto prose prose-invert prose-sm max-w-none prose-headings:text-surface-900 prose-headings:font-semibold prose-p:text-surface-800 prose-p:leading-relaxed prose-strong:text-surface-900 prose-a:text-accent-500 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-surface-400 prose-blockquote:text-surface-600 prose-code:text-accent-600 prose-code:bg-surface-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-200 prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs prose-hr:border-surface-300 prose-li:text-surface-800 prose-th:border prose-th:border-surface-400 prose-th:p-2 prose-th:text-surface-900 prose-td:border prose-td:border-surface-400 prose-td:p-2 prose-td:text-surface-700 prose-img:rounded-lg">
          <Markdown remarkPlugins={[remarkGfm]}>{data}</Markdown>
        </div>
      )}
    </div>
  )
}
