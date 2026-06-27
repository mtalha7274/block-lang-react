import type { BlockNode, ProgramDocument, SlotTarget, StatementBodyRegion } from '../../types'
import { blockRegistry } from '../../constants/blockRegistry'
import {
  PLAYBACK_INITIAL_PAUSE_MS,
  PLAYBACK_PAUSE_AFTER_DROP_MS,
  PLAYBACK_PAUSE_AFTER_OPEN_MS,
  type PlaybackAction,
} from './playbackTypes'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function paletteLabel(kind: BlockNode['kind']): string {
  return blockRegistry[kind]?.label ?? kind
}

function pause(ms: number): PlaybackAction {
  return { type: 'pause', ms }
}

function dragDrop(
  paletteKind: BlockNode['kind'],
  template: BlockNode,
  target: SlotTarget,
): PlaybackAction {
  return {
    type: 'drag-drop',
    paletteKind,
    label: paletteLabel(paletteKind),
    target,
    template: clone(template),
  }
}

function openEditor(blockId: string): PlaybackAction {
  return { type: 'open-editor', blockId }
}

function ensureFunction(
  fn: Extract<BlockNode, { kind: 'function' }>,
): PlaybackAction {
  return { type: 'ensure-function', functionBlock: clone(fn) }
}

function compileSlotValue(
  block: BlockNode,
  target: SlotTarget,
  doc: ProgramDocument,
): PlaybackAction[] {
  return compileAttach(block, target, doc, { openContainer: false })
}

function compileStatementBody(
  statements: BlockNode[],
  parentId: string,
  region: StatementBodyRegion,
  doc: ProgramDocument,
): PlaybackAction[] {
  const actions: PlaybackAction[] = []
  for (const stmt of statements) {
    actions.push(
      ...compileAttach(stmt, {
        kind: 'statement-body',
        parentBlockId: parentId,
        region,
      }, doc, { openContainer: true }),
    )
  }
  return actions
}

function compileAttach(
  block: BlockNode,
  target: SlotTarget,
  doc: ProgramDocument,
  options: { openContainer: boolean },
): PlaybackAction[] {
  const actions: PlaybackAction[] = []

  if (block.kind === 'functionCall' && block.data.targetFunctionId) {
    const fn = doc.blocks.find(
      (b): b is Extract<BlockNode, { kind: 'function' }> =>
        b.kind === 'function' && b.id === block.data.targetFunctionId,
    )
    if (fn) actions.push(ensureFunction(fn))
  }

  if (block.kind === 'variable' && block.data.value) {
    const shell: BlockNode = {
      ...clone(block),
      data: { ...block.data, value: undefined },
    }
    actions.push(dragDrop('variable', shell, target))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))
    actions.push(openEditor(block.id))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_OPEN_MS))
    actions.push(
      ...compileSlotValue(block.data.value, {
        kind: 'variable-value',
        parentBlockId: block.id,
      }, doc),
    )
    return actions
  }

  if (block.kind === 'print' && block.data.value) {
    const shell: BlockNode = { ...clone(block), data: {} }
    actions.push(dragDrop('print', shell, target))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))
    actions.push(openEditor(block.id))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_OPEN_MS))
    actions.push(
      ...compileSlotValue(block.data.value, {
        kind: 'print-value',
        parentBlockId: block.id,
      }, doc),
    )
    return actions
  }

  if (block.kind === 'return' && block.data.value) {
    const shell: BlockNode = { ...clone(block), data: {} }
    actions.push(dragDrop('return', shell, target))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))
    actions.push(openEditor(block.id))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_OPEN_MS))
    actions.push(
      ...compileSlotValue(block.data.value, {
        kind: 'return-value',
        parentBlockId: block.id,
      }, doc),
    )
    return actions
  }

  if (block.kind === 'if') {
    const shell: BlockNode = {
      ...clone(block),
      data: { condition: undefined, trueBranch: [], falseBranch: [] },
    }
    actions.push(dragDrop('if', shell, target))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))
    actions.push(openEditor(block.id))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_OPEN_MS))
    if (block.data.condition) {
      actions.push(
        ...compileSlotValue(block.data.condition, {
          kind: 'if-condition',
          parentBlockId: block.id,
        }, doc),
      )
    }
    if (block.data.trueBranch.length > 0) {
      actions.push(
        ...compileStatementBody(block.data.trueBranch, block.id, 'if-true', doc),
      )
    }
    if (block.data.falseBranch && block.data.falseBranch.length > 0) {
      actions.push(
        ...compileStatementBody(block.data.falseBranch, block.id, 'if-false', doc),
      )
    }
    return actions
  }

  if (block.kind === 'while') {
    const shell: BlockNode = {
      ...clone(block),
      data: { condition: undefined, body: [] },
    }
    actions.push(dragDrop('while', shell, target))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))
    actions.push(openEditor(block.id))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_OPEN_MS))
    if (block.data.condition) {
      actions.push(
        ...compileSlotValue(block.data.condition, {
          kind: 'while-condition',
          parentBlockId: block.id,
        }, doc),
      )
    }
    if (block.data.body.length > 0) {
      actions.push(
        ...compileStatementBody(block.data.body, block.id, 'while', doc),
      )
    }
    return actions
  }

  if (block.kind === 'expression') {
    actions.push(dragDrop('expression', clone(block), target))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))
    return actions
  }

  actions.push(dragDrop(block.kind, clone(block), target))
  actions.push(pause(PLAYBACK_PAUSE_AFTER_DROP_MS))

  if (options.openContainer && (block.kind === 'functionCall')) {
    actions.push(openEditor(block.id))
    actions.push(pause(PLAYBACK_PAUSE_AFTER_OPEN_MS))
  }

  return actions
}

export function compilePlaybackScript(doc: ProgramDocument): PlaybackAction[] {
  const main = doc.blocks.find((b) => b.kind === 'main')
  if (!main || main.kind !== 'main') return []

  const actions: PlaybackAction[] = [
    { type: 'center-main' },
    pause(PLAYBACK_INITIAL_PAUSE_MS),
    ...compileStatementBody(main.data.body, main.id, 'main', doc),
  ]

  return actions
}

export function countPlaybackActions(actions: PlaybackAction[]): number {
  return actions.length
}
