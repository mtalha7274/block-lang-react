import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { By } from 'selenium-webdriver'
import {
  buildBubbleSortWithThreeFunctions,
  expectedSortedValues,
} from '../src/testUtils/bubbleSortProgram'
import { resetProgramBuilderIds } from '../src/testUtils/programBuilder'
import {
  clickEmulate,
  createDriver,
  E2E_BASE_URL,
  waitForAppReady,
  waitForVariableValue,
} from './helpers/driver'

describe('bubble sort e2e (Chrome WebDriver)', () => {
  let driver: WebDriver

  beforeEach(async () => {
    resetProgramBuilderIds()
    driver = await createDriver()
    await driver.get(`${E2E_BASE_URL}/?e2e=1`)
    await waitForAppReady(driver)
  })

  afterEach(async () => {
    if (driver) await driver.quit()
  })

  it('loads a three-function bubble sort program built from blocks', async () => {
    const values = [5, 1, 4, 2]
    const doc = buildBubbleSortWithThreeFunctions(values)

    const functionBlocks = doc.blocks.filter((b) => b.kind === 'function')
    expect(functionBlocks).toHaveLength(3)
    expect(functionBlocks.map((b) => b.kind === 'function' && b.data.name).sort()).toEqual([
      'isGreater',
      'maxOf',
      'minOf',
    ])

    await driver.executeScript((programDoc) => {
      window.__BLOCKLANG_TEST__!.loadProgram(programDoc)
    }, doc)

    await driver.sleep(300)

    const validationErrors = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getValidationErrors(),
    )
    expect(validationErrors).toEqual([])

    const compileErrors = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.getCompileErrors(),
    )
    expect(compileErrors).toEqual([])

    const emulateResult = await driver.executeScript(() =>
      window.__BLOCKLANG_TEST__!.runEmulate(),
    )
    expect(emulateResult.status).toBe('success')

    const sorted = expectedSortedValues(values)
    for (let i = 0; i < sorted.length; i += 1) {
      expect(Number(emulateResult.variables[`n${i}`])).toBe(sorted[i])
    }
  })

  it('runs bubble sort through the Emulate toolbar and variables panel', async () => {
    const values = [5, 1, 4, 2]
    const doc = buildBubbleSortWithThreeFunctions(values)

    await driver.executeScript((programDoc) => {
      window.__BLOCKLANG_TEST__!.loadProgram(programDoc)
    }, doc)

    await driver.sleep(300)
    await clickEmulate(driver)

    const sorted = expectedSortedValues(values)
    for (let i = 0; i < sorted.length; i += 1) {
      await waitForVariableValue(driver, `n${i}`, String(sorted[i]))
    }

    const functionCount = await driver.executeScript(() => {
      const program = window.__BLOCKLANG_TEST__!.getProgram()
      return program.blocks.filter((b) => b.kind === 'function').length
    })
    expect(functionCount).toBe(3)

    const emulateButton = await driver.findElement(By.css('[data-testid="toolbar-emulate"]'))
    const buttonText = await emulateButton.getText()
    expect(buttonText).toContain('Stop')
  })
})
