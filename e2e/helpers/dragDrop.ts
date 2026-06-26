import type { WebDriver } from 'selenium-webdriver'
import { By, until } from 'selenium-webdriver'

export async function dragElementToElement(
  driver: WebDriver,
  fromSelector: string,
  toSelector: string,
  pauseMs = 300,
): Promise<void> {
  const from = await driver.wait(until.elementLocated(By.css(fromSelector)), 10_000)
  const to = await driver.wait(until.elementLocated(By.css(toSelector)), 10_000)

  await driver.actions({ bridge: true })
    .move({ origin: from })
    .pause(pauseMs)
    .press()
    .pause(pauseMs)
    .move({ origin: to })
    .pause(pauseMs)
    .release()
    .perform()
}

export async function waitForPlaybackGhost(driver: WebDriver, timeoutMs = 15_000): Promise<void> {
  await driver.wait(
    until.elementLocated(By.css('[data-testid="playback-ghost"]')),
    timeoutMs,
    'Playback drag ghost did not appear',
  )
}
