import express, { Request, Response } from "express";
import { page, initBrowser } from "./browserManager";

const app = express();
app.use(express.json());
const PORT: number = Number(process.env.PORT) || 3000;

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

app.post("/navigate", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    res.status(400).send({ error: "Invalid URL" });
    return;
  }
  await page.goto(url, { waitUntil: "networkidle2" });
  res.send({ message: "Navigation complete", currentUrl: page.url() });
}));

app.post("/screenshot", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  const fs = await import("fs");
  const pathModule = await import("path");
  const screenshotDir = pathModule.join(process.cwd(), "screenShot");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const viewport = page.viewport();
  const resolutionText = viewport ? `${viewport.width}x${viewport.height}` : "unknown";
  const screenshotPath = pathModule.join(screenshotDir, `screenshot-${timestamp}-${resolutionText}.png`);
  await page.screenshot({ path: screenshotPath });
  res.send({ message: "Screenshot saved", path: screenshotPath });
}));

if (process.env.NODE_ENV !== "test") {
  initBrowser().then(() => {
    app.listen(PORT, () => {
      console.log(`Express server is running on port ${PORT}`);
    });
  }).catch((error: Error): void => {
    console.error("Failed to initialize browser:", error);
    process.exit(1);
  });
}
export default app;
