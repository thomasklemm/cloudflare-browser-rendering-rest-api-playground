export type EndpointId =
  | 'content'
  | 'screenshot'
  | 'pdf'
  | 'json'
  | 'markdown'
  | 'snapshot'
  | 'scrape'
  | 'links'

export type ResponseType = 'html' | 'image' | 'pdf' | 'json' | 'markdown' | 'snapshot'

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'json'

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  defaultValue?: string | number | boolean
  required?: boolean
  options?: { label: string; value: string }[]
  section?: string
  hint?: string
}

export type InputMode = 'url' | 'html'

export interface EndpointConfig {
  id: EndpointId
  label: string
  method: 'GET' | 'POST'
  path: string
  description: string
  responseType: ResponseType
  contentType?: string
  hasUrlHtmlInput?: boolean
  fields: FieldConfig[]
}

export interface ApiResponse {
  status: number
  statusText: string
  contentType: string
  duration: number
  data: string | Blob | null
  error?: string
}

export interface Settings {
  accountId: string
  apiToken: string
}
