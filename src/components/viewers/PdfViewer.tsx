import { Download } from 'lucide-react'

interface PdfViewerProps {
  blobUrl: string
}

export function PdfViewer({ blobUrl }: PdfViewerProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end p-2 border-b border-surface-300">
        <a
          href={blobUrl}
          download="document.pdf"
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-surface-600 hover:text-surface-800 border border-surface-300 rounded-lg hover:bg-surface-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>
      <iframe
        src={blobUrl}
        className="flex-1 w-full min-h-[500px]"
        title="PDF Preview"
      />
    </div>
  )
}
