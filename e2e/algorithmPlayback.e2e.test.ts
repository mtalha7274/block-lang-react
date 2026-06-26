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
import { buildSumToN } from '../src/lib/algorithms/builders'
import { runProgramDirect } from '../src/testApi'

describe('algorithm playback e2e (Chrome WebDriver)', () => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = await createDriver()
    await driver.get(`${E2E_BASE_URL}/?e2e=1`)
    await waitForAppReady(driver)
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  it('plays sum-to-n with visible drag ghost and builds blocks', async () => {
    await driver.executeScript(() => {
      window.__BLOCKLANG_TEST__!.selectAlgorithm('sum-to-n')
    })

    await playSelectedAlgorithm(driver)

    const playbackState = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getPlaybackState(),
    )
    expect(playbackState.totalSteps).toBeGreaterThan(0)
    expect(playbackState.demoComplete).toBe(true)

    const validationErrors = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getValidationErrors(),
    )
    expect(validationErrors).toEqual([])

    const emulate = await driver.executeScript(() => window.__BLOCKLANG_TEST__!.runEmulate())
    const expected = runProgramDirect(buildSumToN(10))
    expect(emulate.status).toBe('success')
    expect(emulate.status).toBe(expected.status)
    expect(emulate.variables.sum).toBe(
      expected.variables.find((v) => v.name === 'sum')?.value,
    )
  }, 90_000)

  it('drags a variable from palette to main like a user', async () => {
    await dragElementToElement(
      driver,
      '[data-palette-kind="variable"]',
      '[data-slot-kind="statement-body"][data-slot-parent-id="main"][data-slot-region="main"]',
      400,
    )

    await driver.wait(async () => {
      const chips = await driver.findElements(
        By.css('[data-block-id="main"] .minimized-chip'),
      )
      return chips.length >= 1
    }, 10_000, 'Variable chip did not appear in main')

    const chips = await driver.findElements(
      By.css('[data-block-id="main"] .minimized-chip'),
    )
    expect(chips.length).toBeGreaterThanOrEqual(1)
  })

  it('lists at least 10 algorithms in the dropdown menu', async () => {
    await driver.findElement(By.css('[data-testid="toolbar-algorithm-menu"]')).click()
    await driver.wait(
      until.elementLocated(By.css('[data-testid="algorithm-menu"]')),
      5_000,
    )

    const options = await driver.findElements(
      By.css('[data-testid^="algorithm-option-"]'),
    )
    expect(options.length).toBeGreaterThanOrEqual(10)
  })
})
