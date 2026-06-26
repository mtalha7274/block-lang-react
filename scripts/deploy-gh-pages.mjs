#!/usr/bin/env node
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const dist = join(root, 'dist')
const worktree = join(root, '.gh-pages-worktree')

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit' })
}

run('npm run build:pages')

rmSync(worktree, { recursive: true, force: true })
mkdirSync(worktree, { recursive: true })

run('git init', worktree)
run('git checkout -b gh-pages', worktree)
run('git remote add origin ' + execSync('git remote get-url origin', { cwd: root }).toString().trim(), worktree)

for (const entry of readdirSync(dist)) {
  cpSync(join(dist, entry), join(worktree, entry), { recursive: true })
}

run('git add -A', worktree)
run('git -c user.name="Cursor Agent" -c user.email="cursoragent@cursor.com" commit -m "Deploy BlockLang to GitHub Pages"', worktree)
run('git push -f origin gh-pages', worktree)

rmSync(worktree, { recursive: true, force: true })

console.log('Deployed to https://mtalha7274.github.io/block-lang-react/')
