import { Builder, By, until, type WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'
import chromedriver from 'chromedriver'

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173'

export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options()
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900')
  options.setChromeBinaryPath(process.env.CHROME_BIN ?? '/usr/local/bin/chrome')

  const service = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH ?? chromedriver.path)

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build()
}

export async function waitForAppReady(driver: WebDriver, timeoutMs = 30_000): Promise<void> {
  await driver.wait(
    async () => {
      const ready = await driver.executeScript<boolean>(() => {
        return (
          document.body.dataset.testid === 'app-ready' &&
          typeof window.__BLOCKLANG_TEST__?.isReady === 'function' &&
          window.__BLOCKLANG_TEST__.isReady()
        )
      })
      return ready
    },
    timeoutMs,
    'BlockLang test API did not become ready',
  )
}

export async function waitForVariableValue(
  driver: WebDriver,
  name: string,
  expected: string,
  timeoutMs = 10_000,
): Promise<void> {
  const locator = By.css(`[data-testid="var-value-${name}"]`)
  await driver.wait(async () => {
    try {
      const el = await driver.findElement(locator)
      const text = await el.getText()
      return text === expected
    } catch {
      return false
    }
  }, timeoutMs, `Variable ${name} did not become ${expected}`)
}

export async function clickEmulate(driver: WebDriver): Promise<void> {
  const button = await driver.wait(
    until.elementLocated(By.css('[data-testid="toolbar-emulate"]')),
    10_000,
  )
  await driver.wait(until.elementIsEnabled(button), 10_000)
  await button.click()
}

export async function playSelectedAlgorithm(driver: WebDriver, timeoutMs = 60_000): Promise<void> {
  await driver.executeAsyncScript(function (timeout) {
    const done = arguments[arguments.length - 1] as (err?: string) => void
    const api = window.__BLOCKLANG_TEST__
    if (!api) {
      done('BlockLang test API is unavailable')
      return
    }

    const timer = window.setTimeout(() => done('Algorithm playback timed out'), timeout)
    void api.playAlgorithm()
      .then(() => {
        window.clearTimeout(timer)
        done()
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer)
        done(error instanceof Error ? error.message : String(error))
      })
  }, timeoutMs)
}
