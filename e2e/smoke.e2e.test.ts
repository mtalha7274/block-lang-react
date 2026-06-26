import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { By } from 'selenium-webdriver'
import { createDriver, E2E_BASE_URL, waitForAppReady } from './helpers/driver'

describe('app smoke e2e (Chrome WebDriver)', () => {
  let driver: WebDriver

  beforeEach(async () => {
    driver = await createDriver()
    await driver.get(`${E2E_BASE_URL}/?e2e=1`)
    await waitForAppReady(driver)
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  it('loads BlockLang with main function and emulate controls', async () => {
    const title = await driver.getTitle()
    expect(title).toContain('BlockLang')

    const emulate = await driver.findElement(By.css('[data-testid="toolbar-emulate"]'))
    expect(await emulate.isDisplayed()).toBe(true)

    const mainBlock = await driver.findElement(By.css('[data-block-id="main"]'))
    expect(await mainBlock.isDisplayed()).toBe(true)
  })
})
