import express, { Request, Response } from "express";
import { page } from "./browserManager";

const app = express();
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

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
