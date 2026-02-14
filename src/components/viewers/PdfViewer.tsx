interface PdfViewerProps {
  blobUrl: string
}

export function PdfViewer({ blobUrl }: PdfViewerProps) {
  return (
    <iframe
      src={blobUrl}
      className="flex-1 w-full min-h-[500px]"
      title="PDF Preview"
    />
  )
}
