interface PdfViewerProps {
  blobUrl: string
}

export function PdfViewer({ blobUrl }: PdfViewerProps) {
  return (
    <iframe
      src={blobUrl}
      className="w-full h-full min-h-[500px]"
      title="PDF Preview"
    />
  )
}
