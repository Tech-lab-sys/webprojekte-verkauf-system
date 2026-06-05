import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:3005")
        await page.wait_for_timeout(2000)

        # Click on Affiliate (it should be selected by default, but to be sure)
        await page.click("text=🎯 Affiliate")
        await page.wait_for_timeout(500)

        # Take a screenshot showing the Affiliate Sub-Types
        await page.screenshot(path="/home/jules/verification/verification_affiliate_types.png")
        await browser.close()

asyncio.run(run())
