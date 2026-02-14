import { useState, useCallback } from 'react'
import { Plus, X, Code, List } from 'lucide-react'

// --- Types ---

type CombinedType = 'string' | 'number' | 'boolean' | 'string[]' | 'number[]' | 'object[]'

interface SchemaProp {
  id: number
  name: string
  type: CombinedType
  required: boolean
  objectProps: SchemaProp[]
}

let _nextId = 1
function uid() {
  return _nextId++
}

function newProp(overrides?: Partial<SchemaProp>): SchemaProp {
  return {
    id: uid(),
    name: '',
    type: 'string',
    required: false,
    objectProps: [],
    ...overrides,
  }
}

// --- Serialization ---

function propsToJson(props: SchemaProp[]): string {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const p of props) {
    const name = p.name.trim()
    if (!name) continue
    if (p.required) required.push(name)

    if (p.type === 'object[]') {
      const itemProps: Record<string, unknown> = {}
      const itemReq: string[] = []
      for (const ip of p.objectProps) {
        const iname = ip.name.trim()
        if (!iname) continue
        itemProps[iname] = { type: ip.type }
        if (ip.required) itemReq.push(iname)
      }
      properties[name] = {
        type: 'array',
        items: {
          type: 'object',
          properties: itemProps,
          ...(itemReq.length ? { required: itemReq } : {}),
        },
      }
    } else if (p.type === 'string[]' || p.type === 'number[]') {
      const itemType = p.type === 'string[]' ? 'string' : 'number'
      properties[name] = { type: 'array', items: { type: itemType } }
    } else {
      properties[name] = { type: p.type }
    }
  }

  if (Object.keys(properties).length === 0) return ''

  return JSON.stringify({
    type: 'json_schema',
    schema: {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
    },
  })
}

function jsonToProps(json: string): SchemaProp[] | null {
  try {
    const parsed = JSON.parse(json)
    const schema = parsed?.schema
    if (!schema?.properties || typeof schema.properties !== 'object') return null

    const req = new Set<string>(schema.required || [])

    return Object.entries(schema.properties).map(([name, def]: [string, unknown]) => {
      const d = def as Record<string, unknown>
      if (d.type === 'array' && d.items) {
        const items = d.items as Record<string, unknown>
        if (items.type === 'object' && items.properties) {
          const iReq = new Set<string>((items.required as string[]) || [])
          const objectProps = Object.entries(items.properties as Record<string, unknown>).map(
            ([iname, idef]) => {
              const id = idef as Record<string, string>
              return newProp({
                name: iname,
                type: (id.type || 'string') as CombinedType,
                required: iReq.has(iname),
              })
            },
          )
          return newProp({ name, type: 'object[]', required: req.has(name), objectProps })
        }
        const itemType = (items.type || 'string') as string
        const combined = itemType === 'number' ? 'number[]' : 'string[]'
        return newProp({ name, type: combined as CombinedType, required: req.has(name) })
      }
      return newProp({ name, type: (d.type || 'string') as CombinedType, required: req.has(name) })
    })
  } catch {
    return null
  }
}

// --- Component ---

const TYPE_OPTIONS: { value: CombinedType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
  { value: 'string[]', label: 'string[]' },
  { value: 'number[]', label: 'number[]' },
  { value: 'object[]', label: 'object[]' },
]

const ITEM_TYPE_OPTIONS: { value: CombinedType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
]

interface JsonSchemaBuilderProps {
  value: string
  onChange: (value: string) => void
}

export function JsonSchemaBuilder({ value, onChange }: JsonSchemaBuilderProps) {
  const [properties, setProperties] = useState<SchemaProp[]>(() => {
    if (!value) return []
    return jsonToProps(value) || []
  })
  const [rawMode, setRawMode] = useState(() => {
    if (!value) return false
    return jsonToProps(value) === null
  })

  // Track which value we last emitted so we can distinguish our own
  // changes from external ones (e.g., example template clicks).
  // Uses React's "adjust state during render" pattern.
  const [lastEmit, setLastEmit] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (value !== lastEmit) {
      // External change — sync internal state
      if (!value) {
        setProperties([])
        setRawMode(false)
      } else {
        const parsed = jsonToProps(value)
        if (parsed) {
          setProperties(parsed)
          setRawMode(false)
        } else {
          setRawMode(true)
        }
      }
    }
  }

  // Emit serialized properties to the parent
  const emitProps = useCallback(
    (props: SchemaProp[]) => {
      const json = propsToJson(props)
      setLastEmit(json)
      onChange(json)
    },
    [onChange],
  )

  // All update callbacks compute new state and emit in one step
  // (avoids calling onChange inside a setState updater)

  const updateProp = useCallback(
    (id: number, updates: Partial<SchemaProp>) => {
      setProperties((prev) => {
        const next = prev.map((p) => {
          if (p.id === id) {
            const updated = { ...p, ...updates }
            if (updates.type === 'object[]' && p.objectProps.length === 0) {
              updated.objectProps = [newProp({ required: true })]
            }
            return updated
          }
          return p
        })
        // Schedule emit for after render via microtask
        queueMicrotask(() => emitProps(next))
        return next
      })
    },
    [emitProps],
  )

  const removeProp = useCallback(
    (id: number) => {
      setProperties((prev) => {
        const next = prev.filter((p) => p.id !== id)
        queueMicrotask(() => emitProps(next))
        return next
      })
    },
    [emitProps],
  )

  const addProp = useCallback(() => {
    setProperties((prev) => [...prev, newProp()])
  }, [])

  const updateObjectProp = useCallback(
    (parentId: number, childId: number, updates: Partial<SchemaProp>) => {
      setProperties((prev) => {
        const next = prev.map((p) => {
          if (p.id === parentId) {
            return {
              ...p,
              objectProps: p.objectProps.map((ip) =>
                ip.id === childId ? { ...ip, ...updates } : ip,
              ),
            }
          }
          return p
        })
        queueMicrotask(() => emitProps(next))
        return next
      })
    },
    [emitProps],
  )

  const removeObjectProp = useCallback(
    (parentId: number, childId: number) => {
      setProperties((prev) => {
        const next = prev.map((p) => {
          if (p.id === parentId) {
            return { ...p, objectProps: p.objectProps.filter((ip) => ip.id !== childId) }
          }
          return p
        })
        queueMicrotask(() => emitProps(next))
        return next
      })
    },
    [emitProps],
  )

  const addObjectProp = useCallback((parentId: number) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === parentId) {
          return { ...p, objectProps: [...p.objectProps, newProp()] }
        }
        return p
      }),
    )
  }, [])

  const inputCls =
    'px-2 py-1 bg-surface-200 border border-surface-300 rounded text-xs text-surface-900 placeholder:text-surface-500 focus:outline-none focus:border-accent-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-surface-600">
          Response Schema <span className="text-surface-500">(recommended)</span>
        </label>
        <button
          type="button"
          onClick={() => {
            if (rawMode) {
              const parsed = jsonToProps(value)
              if (parsed) {
                setProperties(parsed)
                setRawMode(false)
              } else if (!value) {
                setProperties([])
                setRawMode(false)
              }
            } else {
              setRawMode(true)
            }
          }}
          disabled={rawMode && !!value && jsonToProps(value) === null}
          className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700 disabled:opacity-40 transition-colors"
        >
          {rawMode ? <List className="w-3 h-3" /> : <Code className="w-3 h-3" />}
          {rawMode ? 'Visual' : 'JSON'}
        </button>
      </div>

      {rawMode ? (
        <textarea
          value={value}
          onChange={(e) => {
            setLastEmit(e.target.value)
            onChange(e.target.value)
          }}
          placeholder='{"type": "json_schema", "schema": {"type": "object", "properties": {...}}}'
          rows={4}
          className="w-full px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none focus:border-accent-500 resize-y font-mono"
        />
      ) : (
        <div className="space-y-1.5">
          {properties.length === 0 ? (
            <div className="px-3 py-3 bg-surface-200 border border-surface-300 rounded-lg text-center">
              <p className="text-xs text-surface-500 mb-2">
                No schema — the AI will choose its own output structure
              </p>
              <button
                type="button"
                onClick={addProp}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-accent-500 hover:text-accent-400 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add property
              </button>
            </div>
          ) : (
            <>
              {properties.map((prop) => (
                <div key={prop.id}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={prop.name}
                      onChange={(e) => updateProp(prop.id, { name: e.target.value })}
                      placeholder="name"
                      className={`${inputCls} flex-1 min-w-0`}
                    />
                    <select
                      value={prop.type}
                      onChange={(e) =>
                        updateProp(prop.id, { type: e.target.value as CombinedType })
                      }
                      className={`${inputCls} w-24 shrink-0`}
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <label
                      className="flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Required"
                    >
                      <input
                        type="checkbox"
                        checked={prop.required}
                        onChange={(e) => updateProp(prop.id, { required: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-surface-400 accent-accent-500"
                      />
                      <span className="text-xs text-surface-500">req</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeProp(prop.id)}
                      className="p-0.5 text-surface-500 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {prop.type === 'object[]' && (
                    <div className="ml-5 mt-1.5 pl-3 border-l-2 border-surface-300 space-y-1.5">
                      <span className="text-xs text-surface-500">Item properties:</span>
                      {prop.objectProps.map((ip) => (
                        <div key={ip.id} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={ip.name}
                            onChange={(e) =>
                              updateObjectProp(prop.id, ip.id, { name: e.target.value })
                            }
                            placeholder="name"
                            className={`${inputCls} flex-1 min-w-0`}
                          />
                          <select
                            value={ip.type}
                            onChange={(e) =>
                              updateObjectProp(prop.id, ip.id, {
                                type: e.target.value as CombinedType,
                              })
                            }
                            className={`${inputCls} w-24 shrink-0`}
                          >
                            {ITEM_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <label
                            className="flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Required"
                          >
                            <input
                              type="checkbox"
                              checked={ip.required}
                              onChange={(e) =>
                                updateObjectProp(prop.id, ip.id, { required: e.target.checked })
                              }
                              className="w-3.5 h-3.5 rounded border-surface-400 accent-accent-500"
                            />
                            <span className="text-xs text-surface-500">req</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeObjectProp(prop.id, ip.id)}
                            className="p-0.5 text-surface-500 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addObjectProp(prop.id)}
                        className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add item property
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addProp}
                className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add property
              </button>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-surface-500 mt-1.5">
        Defines the JSON structure the AI must return. Without a schema, the AI picks its own format
        which may fail to parse.
      </p>
    </div>
  )
}
