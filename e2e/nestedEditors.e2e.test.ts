import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { By, until } from 'selenium-webdriver'
import { createDriver, E2E_BASE_URL, waitForAppReady } from './helpers/driver'
import { dragElementToElement } from './helpers/dragDrop'

async function waitForEditor(
  driver: WebDriver,
  blockId: string,
  timeoutMs = 10_000,
): Promise<void> {
  await driver.wait(
    until.elementLocated(By.css(`[id="blockEditor-${blockId}"]`)),
    timeoutMs,
    `Editor for ${blockId} did not open`,
  )
}

async function clickChip(driver: WebDriver, blockId: string): Promise<void> {
  const chip = await driver.wait(
    until.elementLocated(By.css(`[data-block-id="${blockId}"] .minimized-chip__main`)),
    10_000,
  )
  await driver.executeScript(
    'arguments[0].scrollIntoView({ block: "center", inline: "center" })',
    chip,
  )
  await driver.actions({ bridge: true })
    .move({ origin: chip })
    .pause(150)
    .press()
    .pause(150)
    .release()
    .perform()
}

async function scrollEditorPanel(driver: WebDriver, blockId: string): Promise<void> {
  await driver.executeScript((id: string) => {
    const body = document.querySelector(`#blockEditor-${id} .floating-panel__body`)
    if (body) body.scrollTop = body.scrollHeight
  }, blockId)
}

async function waitForSignatureAttached(
  driver: WebDriver,
  fnId: string,
): Promise<void> {
  await driver.wait(async () => {
    const program = await driver.executeScript(() => window.__BLOCKLANG_TEST__!.getProgram())
    const fn = program.blocks.find((b) => b.kind === 'function' && b.id === fnId)
    return fn?.kind === 'function' && Boolean(fn.data.signature)
  }, 10_000, 'Function signature was not attached')
}

async function closeEditor(driver: WebDriver, blockId: string): Promise<void> {
  const closeBtn = await driver.findElement(
    By.css(`#blockEditor-${blockId} .floating-panel__header-btn--minimize`),
  )
  await closeBtn.click()
}

describe('nested editor and expression drag e2e', () => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = await createDriver()
    await driver.get(`${E2E_BASE_URL}/?e2e=1`)
    await waitForAppReady(driver)
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  it('opens for-loop param editors from chips', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="for"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
    )

    const forBlockId = await driver.executeScript<string>(() => {
      const chip = document.querySelector('[data-block-id="main"] .minimized-chip')
      return chip?.getAttribute('data-block-id') ?? ''
    })
    expect(forBlockId).toBeTruthy()
    await clickChip(driver, forBlockId)
    await waitForEditor(driver, forBlockId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="variable"]',
      `[data-slot-kind="for-init"][data-slot-parent-id="${forBlockId}"]`,
    )

    const initVarId = await driver.executeScript<string>((forId) => {
      const slot = document.querySelector(
        `[data-slot-kind="for-init"][data-slot-parent-id="${forId}"]`,
      )
      return slot?.querySelector('[data-block-id]')?.getAttribute('data-block-id') ?? ''
    }, forBlockId)
    expect(initVarId).toBeTruthy()

    await clickChip(driver, initVarId)
    await waitForEditor(driver, initVarId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="primitive"]',
      `[data-slot-kind="variable-value"][data-slot-parent-id="${initVarId}"]`,
    )

    const validationErrors = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getValidationErrors(),
    )
    expect(validationErrors).toEqual([])
  })

  it('drags expression from palette into for-loop increment slot', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="for"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
    )

    const forBlockId = await driver.executeScript<string>(() => {
      const chip = document.querySelector('[data-block-id="main"] .minimized-chip')
      return chip?.getAttribute('data-block-id') ?? ''
    })
    await clickChip(driver, forBlockId)
    await waitForEditor(driver, forBlockId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="expression"]',
      `[data-slot-kind="for-increment"][data-slot-parent-id="${forBlockId}"]`,
      500,
    )

    await driver.wait(async () => {
      const slot = await driver.findElement(
        By.css(`[data-slot-kind="for-increment"][data-slot-parent-id="${forBlockId}"]`),
      )
      const chips = await slot.findElements(By.css('.minimized-chip'))
      return chips.length >= 1
    }, 10_000, 'Expression chip did not land in for increment slot')
  })

  it('opens while-loop condition editor from chip', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="while"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
    )

    const whileBlockId = await driver.executeScript<string>(() => {
      const chip = document.querySelector('[data-block-id="main"] .minimized-chip')
      return chip?.getAttribute('data-block-id') ?? ''
    })
    await clickChip(driver, whileBlockId)
    await waitForEditor(driver, whileBlockId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="primitive"]',
      `[data-slot-kind="while-condition"][data-slot-parent-id="${whileBlockId}"]`,
    )

    const condId = await driver.executeScript<string>((whileId) => {
      const slot = document.querySelector(
        `[data-slot-kind="while-condition"][data-slot-parent-id="${whileId}"]`,
      )
      return slot?.querySelector('[data-block-id]')?.getAttribute('data-block-id') ?? ''
    }, whileBlockId)
    expect(condId).toBeTruthy()

    await clickChip(driver, condId)
    await waitForEditor(driver, condId)
  })

  it('opens function call editor and argument chip editor', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="functionCall"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
    )

    const fnId = await driver.executeScript<string>(() => {
      const program = window.__BLOCKLANG_TEST__!.getProgram()
      return program.blocks.find((b) => b.kind === 'function')?.id ?? ''
    })
    expect(fnId).toBeTruthy()
    await waitForEditor(driver, fnId)
    await scrollEditorPanel(driver, fnId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="type"]',
      `[data-slot-kind="function-signature"][data-slot-parent-id="${fnId}"]`,
      500,
    )

    await waitForSignatureAttached(driver, fnId)

    await driver.wait(async () => {
      const program = await driver.executeScript(() => window.__BLOCKLANG_TEST__!.getProgram())
      const call = program.blocks
        .flatMap((b) => (b.kind === 'main' ? b.data.body : []))
        .find((b) => b.kind === 'functionCall')
      return call?.kind === 'functionCall' && call.data.arguments.length > 0
    }, 10_000, 'Function call arguments were not created from signature')

    await closeEditor(driver, fnId)

    const callId = await driver.executeScript<string>(() => {
      const chips = document.querySelectorAll('[data-block-id="main"] .minimized-chip')
      const last = chips[chips.length - 1]
      return last?.getAttribute('data-block-id') ?? ''
    })
    expect(callId).toBeTruthy()

    await clickChip(driver, callId)
    await waitForEditor(driver, callId)

    const argSlots = await driver.findElements(
      By.css(`[data-slot-kind="call-arg"][data-slot-parent-id="${callId}"]`),
    )
    expect(argSlots.length).toBeGreaterThan(0)

    await dragElementToElement(
      driver,
      '[data-palette-kind="primitive"]',
      `[data-slot-kind="call-arg"][data-slot-parent-id="${callId}"]`,
      500,
    )

    const argValueId = await driver.executeScript<string>((parentCallId) => {
      const slot = document.querySelector(
        `[data-slot-kind="call-arg"][data-slot-parent-id="${parentCallId}"]`,
      )
      return slot?.querySelector('[data-block-id]')?.getAttribute('data-block-id') ?? ''
    }, callId)
    expect(argValueId).toBeTruthy()

    await clickChip(driver, argValueId)
    await waitForEditor(driver, argValueId)
  })

  it('opens function signature type editor from chip', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="functionCall"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
    )

    const fnId = await driver.executeScript<string>(() => {
      const program = window.__BLOCKLANG_TEST__!.getProgram()
      return program.blocks.find((b) => b.kind === 'function')?.id ?? ''
    })
    expect(fnId).toBeTruthy()
    await waitForEditor(driver, fnId)
    await scrollEditorPanel(driver, fnId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="type"]',
      `[data-slot-kind="function-signature"][data-slot-parent-id="${fnId}"]`,
      500,
    )

    await waitForSignatureAttached(driver, fnId)

    const typeId = await driver.executeScript<string>((parentFnId) => {
      const slot = document.querySelector(
        `[data-slot-kind="function-signature"][data-slot-parent-id="${parentFnId}"]`,
      )
      return slot?.querySelector('[data-block-id]')?.getAttribute('data-block-id') ?? ''
    }, fnId)
    expect(typeId).toBeTruthy()

    await clickChip(driver, typeId)
    await waitForEditor(driver, typeId)
  })
})
