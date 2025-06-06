import {expect, test} from '@playwright/test';

test.describe('Test InternalViewer', async () => {
    test('Test internalViewer header link', async ({page}) => {
        page.goto('');
        const link = page.locator('header').locator('a').filter({hasText: 'Developer UI'});
        const href = await link.getAttribute('href');

        expect(href).not.toBeNull();

        const response = await page.goto(href as string);
        expect(response?.ok()).toBe(true);

        expect(await page.title()).toContain('YDB Developer UI');
    });
});
