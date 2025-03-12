import dotenv from 'dotenv';
dotenv.config();

import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import {
  CACHE_DIR,
  GRID_IMAGE_DIR,
  RAW_IMAGE_FILENAME,
  GRID_IMAGE_FILENAME,
  COMBINED_IMAGE_FILENAME
} from './constants';

/**
 * このスクリプトは、.cache/rawImage.WxH.日時.png の上に gridImage/gridWxH.png を重ね合わせ、
 * 統合結果として .cache/withGridImage.WxH.日時.png を作成します。
 *
 * コマンドライン引数:
 *   width     - 画像の横幅（例: 1280, 引数がない場合は .env の VIEWPORT_WIDTH または 1280）
 *   height    - 画像の高さ（例: 720, 引数がない場合は .env の VIEWPORT_HEIGHT または 720）
 *   timestamp - rawImage に付与された日時（例: 20250312-210000）
 */
async function main(): Promise<string> {
  const args = process.argv.slice(2);

  const width: number = parseInt((args[0] ?? process.env.VIEWPORT_WIDTH) || '1280');
  const height: number = parseInt((args[1] ?? process.env.VIEWPORT_HEIGHT) || '720');

  if (!args[2]) {
    console.error('Timestamp (日時) is required as the third argument.');
    process.exit(1);
  }
  const timestamp: string = args[2];

  const resolution = `${width}x${height}`;
  const rawImagePath = path.join(process.cwd(), CACHE_DIR, RAW_IMAGE_FILENAME(resolution, timestamp));
  const gridImagePath = path.join(process.cwd(), GRID_IMAGE_DIR, GRID_IMAGE_FILENAME(resolution));
  const outputPath = path.join(process.cwd(), CACHE_DIR, COMBINED_IMAGE_FILENAME(resolution, timestamp));

  try {
    const rawImage = await loadImage(rawImagePath);
    const gridImage = await loadImage(gridImagePath);

    const canvas = createCanvas(rawImage.width, rawImage.height);
    const ctx = canvas.getContext('2d');

    // rawImage を描画
    ctx.drawImage(rawImage, 0, 0);
    // gridImage を rawImage と同じサイズで上に重ねる
    ctx.drawImage(gridImage, 0, 0, rawImage.width, rawImage.height);

    const buffer = canvas.toBuffer('image/png');
    const cacheDir = path.join(process.cwd(), CACHE_DIR);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
    console.log(`Combined image saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error combining images:', error);
    process.exit(1);
    return ''; // This line will never be reached due to process.exit(1), but needed for TypeScript
  }
}

main().then(outputPath => {
  // メインプロセスから呼び出された場合は、出力パスを標準出力に出力
  if (require.main === module) {
    console.log(outputPath);
  }
}).catch(error => {
  console.error('Error in main process:', error);
  process.exit(1);
});
