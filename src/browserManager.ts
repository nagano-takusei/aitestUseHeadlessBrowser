import * as puppeteer from "puppeteer";

export let browser: puppeteer.Browser | null = null;
export let page: puppeteer.Page | null = null;

export async function initBrowser(): Promise<void> {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto("https://www.example.com");
  console.log("Browser initialized and page loaded");
}
