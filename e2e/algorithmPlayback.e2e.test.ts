import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { By, until } from 'selenium-webdriver'
import {
  createDriver,
  E2E_BASE_URL,
  waitForAppReady,
} from './helpers/driver'

async function waitForDemoComplete(driver: WebDriver, timeoutMs = 45_000): Promise<void> {
  await driver.wait(async () => {
    return driver.executeScript<boolean>(
      () => document.body.dataset.demoComplete === 'true',
    )
  }, timeoutMs, 'Algorithm demo did not complete')
}

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

  it('shows blocks being added step by step when playing an algorithm', async () => {
    await driver.executeScript(() => {
      window.__BLOCKLANG_TEST__!.selectAlgorithm('sum-to-n')
    })

    await driver.findElement(By.css('[data-testid="toolbar-algorithm-play"]')).click()

    await driver.wait(async () => {
      const state = await driver.executeScript(() =>
        window.__BLOCKLANG_TEST__!.getPlaybackState(),
      )
      return state.isPlaying && state.stepIndex > 0
    }, 10_000, 'Playback did not start advancing steps')

    await waitForDemoComplete(driver)

    const mainChips = await driver.findElements(
      By.css('[data-block-id="main"] .minimized-chip'),
    )
    expect(mainChips.length).toBeGreaterThanOrEqual(2)

    const validationErrors = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getValidationErrors(),
    )
    expect(validationErrors).toEqual([])
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
