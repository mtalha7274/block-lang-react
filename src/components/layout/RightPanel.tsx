import { useState } from 'react'
import type { PanelTab } from '../../types'
import {
  TypeScriptPreview,
  VariableStatePanel,
  CallStackPanel,
} from '../panels'
import type { VariableSnapshot, StackFrame } from '../../types'
import type { CompileError } from '../../lib/compile'
import './RightPanel.css'

interface RightPanelProps {
  activeTab?: PanelTab
  onTabChange?: (tab: PanelTab) => void
  typeScriptCode: string
  compileErrors?: CompileError[]
  variables: VariableSnapshot[]
  callStack: StackFrame[]
  isEmulating?: boolean
  errorMessage?: string
}

const tabs: { id: PanelTab; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'variables', label: 'Variables' },
  { id: 'callstack', label: 'Stack' },
]

export function RightPanel({
  activeTab: controlledTab,
  onTabChange,
  typeScriptCode,
  compileErrors = [],
  variables,
  callStack,
  isEmulating = false,
  errorMessage,
}: RightPanelProps) {
  const [internalTab, setInternalTab] = useState<PanelTab>('typescript')
  const activeTab = controlledTab ?? internalTab

  const setTab = (tab: PanelTab) => {
    setInternalTab(tab)
    onTabChange?.(tab)
  }

  return (
    <div className="right-panel">
      <div className="right-panel__tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`right-panel__tab${activeTab === tab.id ? ' right-panel__tab--active' : ''}`}
            data-testid={`tab-${tab.id}`}
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="right-panel__content" role="tabpanel">
        {errorMessage && activeTab !== 'typescript' && (
          <div className="right-panel__error" role="alert">
            {errorMessage}
          </div>
        )}
        {activeTab === 'typescript' && (
          <TypeScriptPreview code={typeScriptCode} errors={compileErrors} />
        )}
        {activeTab === 'variables' && (
          <VariableStatePanel variables={variables} isEmulating={isEmulating} />
        )}
        {activeTab === 'callstack' && (
          <CallStackPanel
            frames={callStack}
            isEmulating={isEmulating}
            hasRun={isEmulating}
          />
        )}
      </div>
    </div>
  )
}
