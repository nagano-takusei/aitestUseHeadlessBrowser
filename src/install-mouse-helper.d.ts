/**
 * マウスカーソルをページに表示するためのヘルパー関数
 * 
 * @param page - Puppeteerのページオブジェクト
 * @returns Promise<void>
 */
import * as puppeteer from "puppeteer";

declare function installMouseHelper(page: puppeteer.Page): Promise<void>;
export = installMouseHelper;
