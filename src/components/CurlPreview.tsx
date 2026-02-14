import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CurlPreviewProps {
  curl: string
}

export function CurlPreview({ curl }: CurlPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-surface-500">curl</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3 bg-surface-100 border border-surface-300 rounded-lg text-xs text-surface-700 overflow-x-auto whitespace-pre-wrap break-all">
        {curl}
      </pre>
    </div>
  )
}
