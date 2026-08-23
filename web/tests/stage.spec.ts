import { expect, test, type Page } from '@playwright/test';

const staticRoutes = [
  '/', '/events', '/calendar', '/artists', '/reels', '/auth', '/alerts',
  '/account', '/tickets', '/studio', '/studio/events/new', '/studio/profile',
  '/studio/reels/new',
];

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test('public pages, API proxy, and dynamic links are healthy', async ({ page, request }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();

  for (const route of staticRoutes) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status(), `${route} should not be broken`).toBeLessThan(400);
  }

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /your night/i })).toBeVisible();
  await expect(page.locator('.event-card').first()).toBeVisible();
  await expect(page.locator('.artist-card').first()).toBeVisible();

  await page.goto('/events');
  await expect(page.getByRole('heading', { name: /find your next night out/i })).toBeVisible();
  const eventLink = page.locator('.event-card').first();
  await expect(eventLink).toBeVisible();
  const eventHref = await eventLink.getAttribute('href');
  expect(eventHref).toMatch(/^\/events\/.+/);
  await eventLink.click();
  await expect(page).toHaveURL(/\/events\/.+/);
  await expect(page.locator('.detail-hero h1')).toBeVisible();

  await page.goto('/artists');
  const artistLink = page.locator('.artist-card').first();
  await expect(artistLink).toBeVisible();
  const artistHref = await artistLink.getAttribute('href');
  expect(artistHref).toMatch(/^\/artists\/.+/);
  await artistLink.click();
  await expect(page).toHaveURL(/\/artists\/.+/);
  await expect(page.locator('.profile-header h1')).toBeVisible();
});

test('calendar is clear, interactive, and responsive', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.getByText('Event matrix')).toBeVisible();
  await expect(page.locator('.calendar-cell')).toHaveCount(42);
  await expect(page.locator('.calendar-agenda')).toBeVisible();

  const initialMonth = await page.locator('.calendar-month strong').textContent();
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('.calendar-month strong')).not.toHaveText(initialMonth || '');
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(page.locator('.calendar-cell.today')).toHaveCount(1);
  await expect(page.locator('.calendar-cell.today')).toHaveClass(/selected/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('.calendar-cell')).toHaveCount(42);
  await expect(page.locator('.calendar-agenda')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('reel media streams, decodes, and responds to playback controls', async ({ page, request }) => {
  const response = await request.get('/api/reels?take=50');
  expect(response.ok()).toBeTruthy();

  const payload = await response.json() as {
    items: Array<{ videoUrl?: string | null }>;
  };
  const videoReel = payload.items.find((reel) => reel.videoUrl);
  expect(videoReel?.videoUrl).toBeTruthy();

  const mediaPath = new URL(videoReel!.videoUrl!).pathname.replace('/uploads/', '/media/');
  const mediaResponse = await request.get(mediaPath, { headers: { Range: 'bytes=0-1023' } });
  expect(mediaResponse.status()).toBe(206);
  expect(mediaResponse.headers()['content-type']).toContain('video/mp4');
  expect(mediaResponse.headers()['content-range']).toMatch(/^bytes 0-1023\//);

  await page.goto('/reels');
  const video = page.locator('.reel-video').first();
  await expect(video).toBeVisible();
  await expect.poll(async () => video.evaluate((element: HTMLVideoElement) => ({
    error: element.error?.code || null,
    readyState: element.readyState,
  }))).toMatchObject({ error: null, readyState: 4 });
  await expect.poll(async () => video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBeGreaterThan(0);

  await expect.poll(async () => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
  await page.locator('.reel-controls button[aria-label="Pause"]').click();
  await expect.poll(async () => video.evaluate((element: HTMLVideoElement) => element.paused)).toBeTruthy();
  await page.locator('.reel-controls button[aria-label="Play"]').click();
  await expect.poll(async () => video.evaluate((element: HTMLVideoElement) => element.paused)).toBeFalsy();

  await page.locator('.reel-queue-item').nth(1).click();
  await expect(page.locator('.reel-visualizer')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('.reel-player')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('navigation has no broken internal destinations', async ({ page, request }) => {
  const sourcePages = ['/', '/events', '/calendar', '/artists', '/reels'];
  const hrefs = new Set<string>();

  for (const route of sourcePages) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const links = await page.locator('a[href]').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href')).filter((href): href is string => !!href),
    );
    links.filter((href) => href.startsWith('/') && !href.startsWith('//')).forEach((href) => hrefs.add(href));
  }

  for (const href of hrefs) {
    const response = await request.get(href, { maxRedirects: 0 });
    expect(response.status(), `${href} should resolve`).toBeLessThan(400);
  }
});

test('authenticated organizer session reaches protected areas', async ({ page }) => {
  await page.goto('/auth?next=/studio');
  await page.locator('input[type="email"]').fill('mihiran@eventsocial.local');
  await page.locator('input[type="password"]').fill('demo1234');
  await page.getByRole('button', { name: /^sign in/i }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByRole('heading', { name: /mihiran/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible();
  await expect(page.getByRole('link', { name: /create event/i })).toBeVisible();

  await page.goto('/tickets');
  await expect(page.getByRole('heading', { name: /tickets, ready when you are/i })).toBeVisible();

  await page.goto('/studio/profile');
  await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible();
});
