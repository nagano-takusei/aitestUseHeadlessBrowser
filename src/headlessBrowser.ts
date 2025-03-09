import express, { Request, Response } from "express";
import * as puppeteer from "puppeteer";

const PORT: number = Number(process.env.PORT) || 3000;

let browser: puppeteer.Browser | null = null;
let page: puppeteer.Page | null = null;

async function initBrowser(): Promise<void> {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto("https://www.example.com");
  console.log("Browser initialized and page loaded");
}

const app = express();

const asyncHandler = (fn: express.RequestHandler): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

app.get("/current-url", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  res.send({ url: page.url() });
}));

app.get("/current-content", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  const content: string = await page.content();
  res.send({ content });
}));

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

initBrowser().catch((error: Error): void => {
  console.error("Failed to initialize browser:", error);
  process.exit(1);
});
