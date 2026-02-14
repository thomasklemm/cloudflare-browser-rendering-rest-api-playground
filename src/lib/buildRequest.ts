import type { EndpointConfig, Settings } from '../types/api'

function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {}
    }
    current = current[keys[i]] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

export function buildBody(
  endpoint: EndpointConfig,
  formValues: Record<string, string>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}

  // Handle url/html input (only include the one with a value)
  if (endpoint.hasUrlHtmlInput) {
    if (formValues.url?.trim()) {
      body.url = formValues.url.trim()
    } else if (formValues.html?.trim()) {
      body.html = formValues.html.trim()
    }
  }

  for (const field of endpoint.fields) {
    const raw = formValues[field.name]
    if (raw === undefined || raw === '') continue

    let value: unknown = raw
    if (field.type === 'number') {
      value = Number(raw)
    } else if (field.type === 'boolean') {
      value = raw === 'true'
    } else if (field.type === 'json') {
      try {
        value = JSON.parse(raw)
      } catch {
        value = raw
      }
    }

    if (field.name.includes('.')) {
      setNested(body, field.name, value)
    } else {
      body[field.name] = value
    }
  }

  return body
}

export function buildFetchOptions(
  endpoint: EndpointConfig,
  settings: Settings,
  formValues: Record<string, string>,
) {
  const path = `/api/cf/client/v4/accounts/${settings.accountId}/browser-rendering${endpoint.path}`
  const body = buildBody(endpoint, formValues)

  return {
    url: path,
    options: {
      method: endpoint.method,
      headers: {
        Authorization: `Bearer ${settings.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  }
}

export function buildCurlCommand(
  endpoint: EndpointConfig,
  settings: Settings,
  formValues: Record<string, string>,
  maskToken = true,
): string {
  const realUrl = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId || '<ACCOUNT_ID>'}/browser-rendering${endpoint.path}`
  const body = buildBody(endpoint, formValues)
  const token = maskToken ? '<API_TOKEN>' : (settings.apiToken || '<API_TOKEN>')

  const parts = [
    `curl -X ${endpoint.method}`,
    `  "${realUrl}"`,
    `  -H "Authorization: Bearer ${token}"`,
    `  -H "Content-Type: application/json"`,
  ]

  if (Object.keys(body).length > 0) {
    parts.push(`  -d '${JSON.stringify(body, null, 2)}'`)
  }

  return parts.join(' \\\n')
}
