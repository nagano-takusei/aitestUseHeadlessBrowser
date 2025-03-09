import * as dotenv from "dotenv";
dotenv.config();
import * as puppeteer from "puppeteer";

export let browser: puppeteer.Browser | null = null;
export let page: puppeteer.Page | null = null;

export async function initBrowser(): Promise<void> {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  const width: number = process.env.VIEWPORT_WIDTH ? parseInt(process.env.VIEWPORT_WIDTH, 10) : 1280;
  const height: number = process.env.VIEWPORT_HEIGHT ? parseInt(process.env.VIEWPORT_HEIGHT, 10) : 720;
  await page.setViewport({ width, height });
  await page.goto("https://www.example.com");
  console.log(`Browser initialized with resolution ${width}x${height} and page loaded`);
}
