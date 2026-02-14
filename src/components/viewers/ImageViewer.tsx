import { Download } from 'lucide-react'

interface ImageViewerProps {
  blobUrl: string
}

export function ImageViewer({ blobUrl }: ImageViewerProps) {
  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <img
        src={blobUrl}
        alt="Screenshot"
        className="max-w-full rounded-lg border border-surface-300 shadow-lg"
      />
      <a
        href={blobUrl}
        download="screenshot.png"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-surface-600 hover:text-surface-800 border border-surface-300 rounded-lg hover:bg-surface-200 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Download
      </a>
    </div>
  )
}
