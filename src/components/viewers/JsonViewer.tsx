import { JsonView, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'

interface JsonViewerProps {
  data: string
}

export function JsonViewer({ data }: JsonViewerProps) {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return (
      <pre className="p-4 text-sm text-surface-700 whitespace-pre-wrap break-all">
        {data}
      </pre>
    )
  }

  return (
    <div className="p-4 text-sm [&_.json-view]:!bg-transparent">
      <JsonView
        data={parsed as object}
        style={{
          ...darkStyles,
          container: 'bg-transparent',
        }}
      />
    </div>
  )
}
