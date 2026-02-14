interface ImageViewerProps {
  blobUrl: string
}

export function ImageViewer({ blobUrl }: ImageViewerProps) {
  return (
    <div className="p-4 flex flex-col items-center">
      <img
        src={blobUrl}
        alt="Screenshot"
        className="max-w-full rounded-lg border border-surface-300 shadow-lg"
      />
    </div>
  )
}
