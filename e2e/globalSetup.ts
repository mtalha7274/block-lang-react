import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { waitForUrl } from './helpers/waitForUrl'

let previewProcess: ChildProcess | null = null

export default async function globalSetup(): Promise<() => Promise<void>> {
  const port = process.env.E2E_PORT ?? '4173'
  const baseUrl = `http://127.0.0.1:${port}`
  process.env.E2E_BASE_URL = baseUrl

  const viteBin = resolve(process.cwd(), 'node_modules/vite/bin/vite.js')
  previewProcess = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', port, '--host', '127.0.0.1', '--strictPort'],
    {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    },
  )

  previewProcess.unref()

  previewProcess.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    if (text.toLowerCase().includes('error')) {
      console.error('[preview]', text.trim())
    }
  })

  await waitForUrl(`${baseUrl}/`)

  return async () => {
    if (!previewProcess?.pid) return
    const pid = previewProcess.pid
    previewProcess = null
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {
      try {
        process.kill(pid, 'SIGTERM')
      } catch {
        // already exited
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        // already exited
      }
    }
  }
}
