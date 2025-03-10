import express, { Request, Response } from "express";
import * as puppeteer from "puppeteer";
import { page, initBrowser } from "./browserManager";

const app = express();
app.use(express.json());
const PORT: number = Number(process.env.PORT) || 2000;

/**
 * ルートハンドラーを非同期処理に対応させるためのラッパー関数
 * 
 * @param fn - Express リクエストハンドラー関数
 * @returns ラップされた Express リクエストハンドラー関数
 */
const asyncHandler = (fn: express.RequestHandler): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 現在のブラウザページのURLを取得するエンドポイント
 * 
 * @route GET /current-url
 * @returns {Object} 現在のURLを含むJSONオブジェクト
 * @returns {string} url - 現在のページのURL
 * @throws {500} ブラウザページが初期化されていない場合
 */
app.get("/current-url", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  res.send({ url: page.url() });
}));

/**
 * 現在のブラウザページのHTML内容を取得するエンドポイント
 * トークン消費が多いためコメントアウト
 * 
 * @route GET /current-content
 * @returns {Object} 現在のページのHTML内容を含むJSONオブジェクト
 * @returns {string} content - 現在のページのHTML内容
 * @throws {500} ブラウザページが初期化されていない場合
 */
// app.get("/current-content", asyncHandler(async (req: Request, res: Response): Promise<void> => {
//   if (!page) {
//     res.status(500).send({ error: "Page not initialized yet" });
//     return;
//   }
//   const content: string = await page.content();
//   res.send({ content });
// }));

/**
 * ブラウザを指定したURLに移動させるエンドポイント
 * 
 * @route POST /navigate
 * @param {Object} req.body - リクエストボディ
 * @param {string} req.body.url - 移動先のURL
 * @returns {Object} 移動結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {string} currentUrl - 移動後の現在のURL
 * @throws {400} URLが無効な場合
 * @throws {500} ブラウザページが初期化されていない場合
 */
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

/**
 * 現在のブラウザページのスクリーンショットを撮影して保存するエンドポイント
 * 
 * @route POST /screenshot
 * @returns {Object} スクリーンショット保存結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {string} path - 保存されたスクリーンショットのファイルパス
 * @throws {500} ブラウザページが初期化されていない場合
 */
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

/**
 * 指定した座標でマウスクリックを実行するエンドポイント
 * 
 * @route POST /click
 * @param {Object} req.body - リクエストボディ
 * @param {number} req.body.x - クリックするX座標
 * @param {number} req.body.y - クリックするY座標
 * @param {string} [req.body.button="left"] - マウスボタン（"left", "right", "middle"）
 * @param {number} [req.body.clickCount=1] - クリック回数（デフォルト: 1）
 * @returns {Object} クリック操作結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {Object} coordinates - クリックした座標
 * @throws {400} 座標が無効な場合
 * @throws {500} ブラウザページが初期化されていない場合
 */
app.post("/click", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  
  const { x, y, button = "left", clickCount = 1 } = req.body;
  
  // 座標の検証
  if (typeof x !== "number" || typeof y !== "number" || isNaN(x) || isNaN(y)) {
    res.status(400).send({ error: "Invalid coordinates. x and y must be numbers." });
    return;
  }
  
  // ボタンの検証
  const validButtons = ["left", "right", "middle"];
  if (button && !validButtons.includes(button)) {
    res.status(400).send({ 
      error: `Invalid button type. Must be one of: ${validButtons.join(", ")}` 
    });
    return;
  }
  
  // クリック回数の検証
  if (typeof clickCount !== "number" || clickCount < 1) {
    res.status(400).send({ error: "Invalid clickCount. Must be a positive number." });
    return;
  }
  
  try {
    // 指定座標に移動してクリック
    await page.mouse.move(x, y);
    await page.mouse.click(x, y, { 
      button: button as puppeteer.MouseButton, 
      clickCount 
    });
    
    res.send({ 
      message: `Successfully clicked at coordinates (${x}, ${y})`,
      coordinates: { x, y },
      details: {
        button,
        clickCount
      }
    });
  } catch (error) {
    console.error("Click operation failed:", error);
    res.status(500).send({ 
      error: "Click operation failed", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * サーバー初期化処理
 * テスト環境でない場合にブラウザを初期化し、Expressサーバーを起動する
 */
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
