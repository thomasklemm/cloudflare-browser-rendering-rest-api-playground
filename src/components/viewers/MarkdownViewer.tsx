import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Code } from 'lucide-react'

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
      </div>
      {showRaw ? (
        <pre className="flex-1 p-4 text-xs text-surface-700 overflow-auto whitespace-pre-wrap break-all">
          {data}
        </pre>
      ) : (
        <div className="flex-1 p-4 overflow-auto prose prose-invert prose-sm max-w-none [&_a]:text-accent-500 [&_code]:text-accent-600 [&_code]:bg-surface-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-200 [&_pre]:p-3 [&_pre]:rounded-lg [&_table]:border-collapse [&_th]:border [&_th]:border-surface-400 [&_th]:p-2 [&_td]:border [&_td]:border-surface-400 [&_td]:p-2">
          <Markdown remarkPlugins={[remarkGfm]}>{data}</Markdown>
        </div>
      )}
    </div>
  )
}
