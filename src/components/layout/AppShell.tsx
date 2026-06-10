import './AppShell.css'

interface AppShellProps {
  toolbar: React.ReactNode
  workspace: React.ReactNode
  outputPanel?: React.ReactNode
}

export function AppShell({ toolbar, workspace, outputPanel }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__toolbar">{toolbar}</header>
      <div className="app-shell__body">
        <div className="app-shell__workspace">{workspace}</div>
        {outputPanel}
      </div>
    </div>
  )
}
