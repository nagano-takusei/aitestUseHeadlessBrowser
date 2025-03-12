import express, { Request, Response } from "express";
import * as puppeteer from "puppeteer";
import { page, initBrowser } from "./browserManager";
import * as fs from "fs";
import * as pathModule from "path";
import { CACHE_DIR, RAW_IMAGE_FILENAME } from "./constants";
import { spawn } from "child_process";

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
  // Using top-level imported fs, pathModule, and constants.
  const screenshotDir = pathModule.join(process.cwd(), CACHE_DIR);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const viewport = page.viewport();
  const resolutionText = viewport ? `${viewport.width}x${viewport.height}` : "unknown";
  const screenshotPath = pathModule.join(screenshotDir, RAW_IMAGE_FILENAME(resolutionText, timestamp));
  await page.screenshot({ path: screenshotPath });
  res.send({ message: "Screenshot saved", path: screenshotPath });
}));

/**
 * スクリーンショットを撮影し、グリッドを重ねた画像を生成するエンドポイント
 * 
 * @route POST /screenshot-with-grid
 * @param {Object} req.body - リクエストボディ
 * @param {number} [req.body.x] - マウスカーソルのX座標（デフォルト: 画面中央）
 * @param {number} [req.body.y] - マウスカーソルのY座標（デフォルト: 画面中央）
 * @returns {Object} グリッド付きスクリーンショット保存結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {string} path - 保存されたグリッド付きスクリーンショットのファイルパス
 * @throws {500} ブラウザページが初期化されていない場合
 */
app.post("/screenshot-with-grid", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  
  const viewport = page.viewport();
  if (!viewport) {
    res.status(500).send({ error: "Viewport not available" });
    return;
  }
  
  // デフォルトでは画面中央にマウスを移動
  const x = req.body.x !== undefined ? req.body.x : Math.floor(viewport.width / 2);
  const y = req.body.y !== undefined ? req.body.y : Math.floor(viewport.height / 2);
  
  // マウスを指定位置に移動
  await page.mouse.move(x, y);
  
  // スクリーンショットを撮影
  const screenshotDir = pathModule.join(process.cwd(), CACHE_DIR);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resolutionText = `${viewport.width}x${viewport.height}`;
  const screenshotPath = pathModule.join(screenshotDir, RAW_IMAGE_FILENAME(resolutionText, timestamp));
  
  await page.screenshot({ path: screenshotPath });
  
  // グリッドを重ねた画像を生成
  try {
    const combineProcess = spawn('npx', [
      'ts-node', 
      'src/combineGridImage.ts', 
      viewport.width.toString(), 
      viewport.height.toString(), 
      timestamp
    ]);
    
    let outputPath = '';
    
    combineProcess.stdout.on('data', (data) => {
      // 最後の行だけを取得（"Combined image saved to: "の行は無視）
      const lines = data.toString().trim().split('\n');
      const lastLine = lines[lines.length - 1];
      if (!lastLine.includes('Combined image saved to:')) {
        outputPath = lastLine;
      }
    });
    
    await new Promise<void>((resolve, reject) => {
      combineProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      combineProcess.on('error', (err) => {
        reject(err);
      });
    });
    
    res.send({ 
      message: "Screenshot with grid saved", 
      path: outputPath,
      coordinates: { x, y }
    });
  } catch (error) {
    console.error("Error generating grid image:", error);
    res.status(500).send({ 
      error: "Failed to generate grid image", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * キーボード入力を実行するエンドポイント
 * 
 * @route POST /type
 * @param {Object} req.body - リクエストボディ
 * @param {string} req.body.text - 入力するテキスト
 * @param {number} [req.body.delay=100] - キー入力間の遅延（ミリ秒）
 * @param {boolean} [req.body.useClipboard=false] - クリップボード貼り付けを使用するかどうか
 * @returns {Object} 入力操作結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {string} text - 入力したテキスト
 * @throws {400} テキストが無効な場合
 * @throws {500} ブラウザページが初期化されていない場合
 */
app.post("/type", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  
  const { text, delay = 100, useClipboard = false } = req.body;
  
  // テキストの検証
  if (!text || typeof text !== "string") {
    res.status(400).send({ error: "Invalid text. Text must be a non-empty string." });
    return;
  }
  
  try {
    if (useClipboard) {
      // 入力フィールドに直接値を設定（ユーザーがコピペしたような挙動）
      await page.evaluate((inputText) => {
        // アクティブな要素が入力フィールドの場合、その値を設定
        const activeElement = document.activeElement as HTMLInputElement;
        if (activeElement && 'value' in activeElement) {
          activeElement.value = inputText;
          
          // 入力イベントを発火させて、Googleの検索候補などが表示されるようにする
          const inputEvent = new Event('input', { bubbles: true });
          activeElement.dispatchEvent(inputEvent);
          
          // changeイベントも発火させる
          const changeEvent = new Event('change', { bubbles: true });
          activeElement.dispatchEvent(changeEvent);
        }
      }, text);
    } else {
      // 通常のキーボード入力
      await page.keyboard.type(text, { delay: delay });
    }
    
    res.send({ 
      message: "Successfully typed text",
      text: text,
      method: useClipboard ? "clipboard" : "keyboard"
    });
  } catch (error) {
    console.error("Keyboard typing operation failed:", error);
    res.status(500).send({ 
      error: "Keyboard typing operation failed", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * 特定のキーを押すエンドポイント
 * 
 * @route POST /press-key
 * @param {Object} req.body - リクエストボディ
 * @param {string} req.body.key - 押すキー（例: "Enter", "Escape", "ArrowDown"など）
 * @returns {Object} キー操作結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {string} key - 押されたキー
 * @throws {400} キーが無効な場合
 * @throws {500} ブラウザページが初期化されていない場合
 */
app.post("/press-key", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  
  const { key } = req.body;
  
  // キーの検証
  if (!key || typeof key !== "string") {
    res.status(400).send({ error: "Invalid key. Key must be a non-empty string." });
    return;
  }
  
  try {
    // Puppeteer expects specific key values
    await page.keyboard.press(key as puppeteer.KeyInput);
    
    res.send({ 
      message: `Successfully pressed key: ${key}`,
      key: key
    });
  } catch (error) {
    console.error("Key press operation failed:", error);
    res.status(500).send({ 
      error: "Key press operation failed", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * 指定した座標にマウスカーソルを移動するエンドポイント
 * 
 * @route POST /move-mouse
 * @param {Object} req.body - リクエストボディ
 * @param {number} req.body.x - 移動先のX座標
 * @param {number} req.body.y - 移動先のY座標
 * @returns {Object} マウス移動結果を含むJSONオブジェクト
 * @returns {string} message - 操作結果メッセージ
 * @returns {Object} coordinates - 移動先の座標
 * @throws {400} 座標が無効な場合
 * @throws {500} ブラウザページが初期化されていない場合
 */
app.post("/move-mouse", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!page) {
    res.status(500).send({ error: "Page not initialized yet" });
    return;
  }
  
  const { x, y } = req.body;
  
  // 座標の検証
  if (typeof x !== "number" || typeof y !== "number" || isNaN(x) || isNaN(y)) {
    res.status(400).send({ error: "Invalid coordinates. x and y must be numbers." });
    return;
  }
  
  try {
    // 指定座標にマウスカーソルを移動
    await page.mouse.move(x, y);
    
    res.send({ 
      message: `Successfully moved mouse to coordinates (${x}, ${y})`,
      coordinates: { x, y }
    });
  } catch (error) {
    console.error("Mouse move operation failed:", error);
    res.status(500).send({ 
      error: "Mouse move operation failed", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
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
