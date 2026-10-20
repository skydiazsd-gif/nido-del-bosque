import { expect, test } from '@playwright/test'

test('renders a real 3D model and coherent baseline quantities', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle('Nido del Bosque — Design Studio')
  await expect(page.getByTestId('total-area')).toHaveText('60.0 / 60 m²')
  await expect(page.getByRole('img', { name: /Preliminary floor plan: 9 by 6 metres/ })).toBeVisible()
  const canvas = page.getByTestId('cabin-canvas').locator('canvas')
  await expect(canvas).toBeVisible()
  await expect.poll(() => canvas.evaluate((node: HTMLCanvasElement) => {
    const gl = node.getContext('webgl2')
    return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) as number : 0
  })).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Front camera view', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Front camera view', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: 'test-results/studio-desktop.png', fullPage: true })
  expect(errors).toEqual([])
})

test('dimension and finish changes update the allowance and survive reload', async ({ page }) => {
  await page.goto('/')
  const length = page.getByLabel('Cabin length', { exact: true })
  await length.focus()
  await length.press('ArrowRight')
  await length.press('ArrowRight')
  await expect(length).toHaveValue('10')
  await expect(page.getByTestId('total-area')).toHaveText('66.0 / 60 m²')
  await expect(page.getByText('Over allowance', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Charcoal timber', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Cabin length', { exact: true })).toHaveValue('10')
  await expect(page.getByRole('button', { name: 'Charcoal timber', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Reset design' }).click()
  await expect(page.getByTestId('total-area')).toHaveText('60.0 / 60 m²')
})

test('budget edits show an overrun and persist independently of design', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: /Budget/ }).click()
  await expect(page.getByTestId('budget-total')).toContainText('80.000.000')
  await page.getByLabel('Site preparation & foundations cost', { exact: true }).fill('12000000')
  await expect(page.getByTestId('budget-total')).toContainText('84.000.000')
  await expect(page.getByTestId('budget-remaining')).toContainText('4.000.000')
  await expect(page.getByRole('alert')).toContainText('exceeds the COP 80M ceiling')
  await page.reload()
  await page.getByRole('tab', { name: /Budget/ }).click()
  await expect(page.getByLabel('Site preparation & foundations cost', { exact: true })).toHaveValue('12000000')
})

test('inspiration images, categories and notes can be saved and removed', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: /Inspiration/ }).click()
  await page.getByLabel('Upload inspiration image').setInputFiles({
    name: 'woodland.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9aUAAAAASUVORK5CYII=', 'base64'),
  })
  await expect(page.getByRole('img', { name: 'woodland', exact: true })).toBeVisible()
  await page.getByLabel('Category', { exact: true }).selectOption('Landscaping')
  await page.getByLabel('What do you love about it?').fill('Keep the mature trees.')
  await page.reload()
  await page.getByRole('tab', { name: /Inspiration/ }).click()
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('Landscaping')
  await expect(page.getByLabel('What do you love about it?')).toHaveValue('Keep the mature trees.')
  await page.getByRole('button', { name: 'Remove woodland' }).click()
  await expect(page.getByText('Your board begins with a feeling.')).toBeVisible()
})

test('mobile layout stays usable when WebGL is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/')
  await expect(page.getByText('3D rendering is unavailable in this browser.', { exact: false })).toBeVisible()
  await expect(page.getByLabel('Cabin length', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/studio-mobile.png', fullPage: true })
})
