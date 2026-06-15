import { useState } from 'react'
import { Button } from '../ui'
import type { CompileError } from '../../lib/compile'
import './TypeScriptPreview.css'
import './panel-empty.css'

interface TypeScriptPreviewProps {
  code: string
  errors?: CompileError[]
}

export function TypeScriptPreview({ code, errors = [] }: TypeScriptPreviewProps) {
  const [copied, setCopied] = useState(false)

  if (!code.trim() && errors.length === 0) {
    return (
      <div className="panel-empty">
        <span className="panel-empty__icon">{'</>'}</span>
        <p className="panel-empty__text">Your code will appear here…</p>
      </div>
    )
  }

  const lines = code.split('\n')

  const handleCopy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="ts-preview">
      {errors.length > 0 && (
        <ul className="ts-preview__errors">
          {errors.map((err) => (
            <li key={err.blockId}>{err.message}</li>
          ))}
        </ul>
      )}
      <div className="ts-preview__toolbar">
        <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy code">
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      {code.trim() ? (
        <pre className="ts-preview__code">
          {lines.map((line, i) => (
            <div key={i} className="ts-preview__line">
              <span className="ts-preview__gutter">{i + 1}</span>
              <code>{line || ' '}</code>
            </div>
          ))}
        </pre>
      ) : (
        <div className="panel-empty panel-empty--compact">
          <p className="panel-empty__text">Fix block errors to generate code.</p>
        </div>
      )}
    </div>
  )
}
