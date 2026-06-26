import type { WebDriver } from 'selenium-webdriver'
import { By, until } from 'selenium-webdriver'

const PALETTE_DRAG_TYPE = 'application/blocklang-block'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function dragElementToElement(
  driver: WebDriver,
  fromSelector: string,
  toSelector: string,
  pauseMs = 300,
): Promise<void> {
  const from = await driver.wait(until.elementLocated(By.css(fromSelector)), 10_000)
  const to = await driver.wait(until.elementLocated(By.css(toSelector)), 10_000)

  await driver.executeScript(
    'arguments[0].scrollIntoView({block: "center", inline: "center"}); arguments[1].scrollIntoView({block: "center", inline: "center"})',
    from,
    to,
  )

  const paletteKind = await from.getAttribute('data-palette-kind')

  if (paletteKind) {
    await driver.executeScript(
      function (fromSelector, dragType, kind) {
        const from = document.querySelector(fromSelector) as HTMLElement | null
        if (!from) throw new Error(`Missing drag source: ${fromSelector}`)
        const dataTransfer = new DataTransfer()
        dataTransfer.setData(dragType, kind)
        const rect = from.getBoundingClientRect()
        from.dispatchEvent(
          new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )
      },
      fromSelector,
      PALETTE_DRAG_TYPE,
      paletteKind,
    )

    await sleep(pauseMs)

    await driver.executeScript(
      function (toSelector, dragType, kind) {
        const to = document.querySelector(toSelector) as HTMLElement | null
        if (!to) throw new Error(`Missing drop target: ${toSelector}`)
        const dataTransfer = new DataTransfer()
        dataTransfer.setData(dragType, kind)
        const rect = to.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        to.dispatchEvent(
          new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            clientX: x,
            clientY: y,
          }),
        )
        to.dispatchEvent(
          new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            clientX: x,
            clientY: y,
          }),
        )
      },
      toSelector,
      PALETTE_DRAG_TYPE,
      paletteKind,
    )

    await sleep(pauseMs)

    await driver.executeScript(
      function (fromSelector, toSelector, dragType, kind) {
        const from = document.querySelector(fromSelector) as HTMLElement | null
        const to = document.querySelector(toSelector) as HTMLElement | null
        if (!from || !to) throw new Error('Missing drag endpoints')
        const dataTransfer = new DataTransfer()
        dataTransfer.setData(dragType, kind)
        const rect = to.getBoundingClientRect()
        to.dispatchEvent(
          new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )
        from.dispatchEvent(
          new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer,
          }),
        )
      },
      fromSelector,
      toSelector,
      PALETTE_DRAG_TYPE,
      paletteKind,
    )

    return
  }

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
