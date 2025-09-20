import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createPuzzle, directions, move, sameBoard } from '../src/game/engine'
import type { Board, Direction } from '../src/game/engine'

const seed = 'browser-test'
const puzzle = createPuzzle(seed, 'medium')

test.beforeEach(async ({ page }) => {
  await page.goto(`/?puzzle=${seed}&level=medium`)
})

test('solves the unique sequence, persists progress, and replays', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const direction of puzzle.solution.slice(0, 2))
    await page
      .getByRole('button', { name: `Move ${direction}`, exact: true })
      .click()
  await page.reload()
  await expect(page.getByText('Move 2 of 5', { exact: true })).toBeVisible()
  for (const direction of puzzle.solution.slice(2))
    await page
      .getByRole('button', { name: `Move ${direction}`, exact: true })
      .click()
  await expect(page.getByRole('heading', { name: 'Solved.' })).toBeVisible()
  const current = await page
    .getByRole('group', { name: 'Your board', exact: true })
    .locator('.cell')
    .allTextContents()
  const target = await page
    .getByRole('group', { name: 'Target board', exact: true })
    .locator('.cell')
    .allTextContents()
  expect(current).toEqual(target)
  await page.getByRole('button', { name: 'Replay', exact: true }).click()
  await expect(page.getByText('Step 0', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Replay', exact: true }),
  ).toBeVisible({ timeout: 6000 })
  expect(errors).toEqual([])
})

test('supports undo, reset, hints and timeline inspection', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Hint' }).click()
  await expect(page.getByRole('status')).toContainText(
    `move 1 is ${puzzle.solution[0]}`,
  )
  await page.keyboard.press(
    `Arrow${puzzle.solution[0][0].toUpperCase()}${puzzle.solution[0].slice(1)}`,
  )
  await page.getByRole('button', { name: 'View starting board' }).click()
  await expect(
    page.getByRole('button', { name: 'Move up', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Back to live' }).click()
  await page.keyboard.press('z')
  await expect(page.getByText('Start here', { exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: `Move ${puzzle.solution[0]}`, exact: true })
    .click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByText('Start here', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeDisabled()
})

test('rejects an incorrect full sequence and allows recovery', async ({
  page,
}) => {
  function wrongPath(board: Board, path: Direction[]): Direction[] | null {
    if (path.length === 5) return sameBoard(board, puzzle.target) ? null : path
    for (const direction of directions) {
      const next = move(board, direction, seed, path.length)
      if (next) {
        const found = wrongPath(next, [...path, direction])
        if (found) return found
      }
    }
    return null
  }
  for (const direction of wrongPath(puzzle.start, [])!)
    await page
      .getByRole('button', { name: `Move ${direction}`, exact: true })
      .click()
  await expect(
    page.getByRole('heading', { name: 'Not a match.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Move up', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Hint' }).click()
  await expect(page.getByRole('status')).toContainText('Revisit move')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Move up', exact: true }),
  ).toBeEnabled()
})

test('changes difficulty, generates a new puzzle, and shares its URL', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('combobox', { name: 'Difficulty' }).selectOption('hard')
  await expect(page).toHaveURL(/level=hard/)
  await expect(page.getByText('One sequence. Exactly 6 moves.')).toBeVisible()
  await page.getByRole('button', { name: 'New puzzle', exact: true }).click()
  expect(new URL(page.url()).searchParams.get('puzzle')).not.toBe(seed)
  await page.getByRole('button', { name: 'Copy puzzle link' }).click()
  await expect(page.getByRole('status')).toContainText('Puzzle link copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  )
})

test('rules trap focus and stop gameplay keyboard input', async ({ page }) => {
  await page.getByRole('button', { name: 'Controls', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText('Start here', { exact: true })).toBeVisible()
})

test('fits the viewport and supports swipe input', async ({ page }, info) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  const board = page.getByRole('group', { name: 'Your board', exact: true })
  const direction = puzzle.solution[0]
  const x = direction === 'left' ? 10 : direction === 'right' ? 100 : 50
  const y = direction === 'up' ? 10 : direction === 'down' ? 100 : 50
  await board.evaluate(
    (element, end) => {
      const touch = (clientX: number, clientY: number) =>
        new Touch({ identifier: 1, target: element, clientX, clientY })
      element.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [touch(50, 50)],
        }),
      )
      element.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          changedTouches: [touch(end.x, end.y)],
        }),
      )
    },
    { x, y },
  )
  await expect(page.getByText('Move 1 of 5', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.screenshot({
    path: `test-results/${info.project.name}.png`,
    fullPage: true,
  })
})

test('has no serious accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([])
})

test('keyboard shortcuts mirror buttons and respect focused controls', async ({
  page,
}) => {
  const keys = { up: 'w', right: 'd', down: 's', left: 'a' }
  await page.keyboard.press(keys[puzzle.solution[0]].toUpperCase())
  await expect(page.getByText('Move 1 of 5', { exact: true })).toBeVisible()
  await page.keyboard.press('Control+z')
  await expect(page.getByText('Start here', { exact: true })).toBeVisible()
  await page.keyboard.press('h')
  await expect(page.getByRole('status')).toContainText(
    `move 1 is ${puzzle.solution[0]}`,
  )
  await page.keyboard.press(keys[puzzle.solution[0]])
  await page.keyboard.press('p')
  await expect(
    page.getByRole('button', { name: 'Back to live', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Replay', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('r')
  await expect(page.getByText('Start here', { exact: true })).toBeVisible()
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('n')
  expect(new URL(page.url()).searchParams.get('puzzle')).toBe(seed)
  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: 'Difficulty' }).focus()
  await page.keyboard.press('n')
  expect(new URL(page.url()).searchParams.get('puzzle')).toBe(seed)
  await page.getByRole('combobox', { name: 'Difficulty' }).blur()
  await page.keyboard.press('n')
  expect(new URL(page.url()).searchParams.get('puzzle')).not.toBe(seed)
})

test('held shortcuts do not repeat and space still activates buttons', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Hint', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('status')).toContainText('Next move:')
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'n', repeat: true, bubbles: true }),
    ),
  )
  expect(new URL(page.url()).searchParams.get('puzzle')).toBe(seed)
})
