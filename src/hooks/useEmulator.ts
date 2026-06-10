import { useCallback, useState } from 'react'
import type {
  EmulationHighlight,
  EmulationStatus,
  OutputLine,
  ProgramDocument,
  StackFrame,
  VariableSnapshot,
} from '../types'
import { runProgram } from '../lib/emulate'

export function useEmulator() {
  const [status, setStatus] = useState<EmulationStatus>('idle')
  const [variables, setVariables] = useState<VariableSnapshot[]>([])
  const [callStack, setCallStack] = useState<StackFrame[]>([])
  const [highlight, setHighlight] = useState<EmulationHighlight | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [outputLines, setOutputLines] = useState<OutputLine[]>([])

  const clear = useCallback(() => {
    setStatus('idle')
    setVariables([])
    setCallStack([])
    setHighlight(undefined)
    setErrorMessage(undefined)
    setOutputLines([])
  }, [])

  const run = useCallback(
    (program: ProgramDocument) => {
      setStatus('running')
      const result = runProgram(program)
      setVariables(result.variables)
      setCallStack(result.callStack)
      setHighlight(result.highlight)
      setErrorMessage(result.errorMessage)
      setOutputLines(result.outputLines)
      setStatus(result.status === 'success' ? 'finished' : 'error')
    },
    [],
  )

  const stop = useCallback(() => {
    clear()
  }, [clear])

  const reset = useCallback(() => {
    clear()
  }, [clear])

  return {
    status,
    variables,
    callStack,
    highlight,
    errorMessage,
    outputLines,
    run,
    stop,
    reset,
    isActive: status === 'running' || status === 'finished' || status === 'error',
  }
}
