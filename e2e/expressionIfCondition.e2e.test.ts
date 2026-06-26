import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { By, until } from 'selenium-webdriver'
import {
  createDriver,
  E2E_BASE_URL,
  playSelectedAlgorithm,
  waitForAppReady,
} from './helpers/driver'
import { dragElementToElement } from './helpers/dragDrop'
import { buildEvenOdd } from '../src/lib/algorithms/builders'
import { runProgramDirect } from '../src/testApi'

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

describe('expression if-condition e2e', () => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = await createDriver()
    await driver.get(`${E2E_BASE_URL}/?e2e=1`)
    await waitForAppReady(driver)
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  it('accepts expression dragged into if-condition and configures boolean comparison', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="if"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
    )

    const ifBlockId = await driver.executeScript<string>(() => {
      const chip = document.querySelector('[data-block-id="main"] .minimized-chip')
      return chip?.getAttribute('data-block-id') ?? ''
    })
    expect(ifBlockId).toBeTruthy()

    await clickChip(driver, ifBlockId)
    await waitForEditor(driver, ifBlockId)

    await dragElementToElement(
      driver,
      '[data-palette-kind="expression"]',
      `[data-slot-kind="if-condition"][data-slot-parent-id="${ifBlockId}"]`,
      500,
    )

    const condition = await driver.executeScript(() => {
      const program = window.__BLOCKLANG_TEST__!.getProgram()
      const main = program.blocks.find((b) => b.kind === 'main')
      const ifBlock = main?.kind === 'main'
        ? main.data.body.find((b) => b.kind === 'if')
        : undefined
      return ifBlock?.kind === 'if' ? ifBlock.data.condition : undefined
    })

    expect(condition?.kind).toBe('expression')
    if (condition?.kind === 'expression') {
      expect(condition.data.operator).toBe('==')
      expect(condition.data.resultType).toBe('boolean')
      expect(condition.data.resultName).toBe('cond')
    }

    const validationErrors = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getValidationErrors(),
    )
    expect(validationErrors).toEqual([])
  })
})

describe('algorithm playback emulation verify', () => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = await createDriver()
    await driver.get(`${E2E_BASE_URL}/?e2e=1`)
    await waitForAppReady(driver)
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  it('plays even-odd and emulation reports isEven true for n=14', async () => {
    await driver.executeScript(() => {
      window.__BLOCKLANG_TEST__!.selectAlgorithm('even-odd')
    })

    await playSelectedAlgorithm(driver)

    const emulate = await driver.executeScript(() => window.__BLOCKLANG_TEST__!.runEmulate())
    const expected = runProgramDirect(buildEvenOdd(14))
    expect(emulate.status).toBe('success')
    expect(emulate.status).toBe(expected.status)
    expect(emulate.variables.isEven).toBe(
      expected.variables.find((v) => v.name === 'isEven')?.value,
    )
    expect(emulate.variables.n).toBe(
      expected.variables.find((v) => v.name === 'n')?.value,
    )
  })

  it('even-odd reference program emulates with correct result', () => {
    const result = runProgramDirect(buildEvenOdd(14))
    expect(result.status).toBe('success')
    expect(result.variables.find((v) => v.name === 'isEven')?.value).toBe('true')
    expect(result.variables.find((v) => v.name === 'n')?.value).toBe('14')
  })
})
