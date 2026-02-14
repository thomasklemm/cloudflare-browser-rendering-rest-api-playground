import { useState } from 'react'
import { Code, Eye } from 'lucide-react'

interface HtmlViewerProps {
  data: string
}

export function HtmlViewer({ data }: HtmlViewerProps) {
  const [showSource, setShowSource] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-2 border-b border-surface-300">
        <button
          onClick={() => setShowSource(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            !showSource ? 'bg-surface-300 text-surface-900' : 'text-surface-600 hover:text-surface-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => setShowSource(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            showSource ? 'bg-surface-300 text-surface-900' : 'text-surface-600 hover:text-surface-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Source
        </button>
      </div>
      {showSource ? (
        <pre className="flex-1 p-4 text-xs text-surface-700 overflow-auto whitespace-pre-wrap break-all">
          {data}
        </pre>
      ) : (
        <iframe
          srcDoc={data}
          sandbox="allow-same-origin"
          className="flex-1 w-full bg-white rounded-b-lg"
          title="HTML Preview"
        />
      )}
    </div>
  )
}
