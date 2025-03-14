import dotenv from 'dotenv';
dotenv.config();

import { generateCoordinateGrid } from './generateCoordinateGrid';

/**
 * コマンドライン引数を解析して座標グリッド画像を生成する
 */
async function main(): Promise<void> {
  try {
    // コマンドライン引数を解析
    const args = process.argv.slice(2);
    
    // ヘルプメッセージを表示
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Usage: npm run generate-grid [width] [height] [gridSize]

Generate a coordinate grid image with the specified dimensions and grid size.

Arguments:
  width     - Width of the image in pixels (default: value from .env or 1280)
  height    - Height of the image in pixels (default: value from .env or 720)
  gridSize  - Size of the grid cells in pixels (default: 100)

Example:
  npm run generate-grid 1920 1080 200
      `);
      return;
    }
    
    const width: number = parseInt((args[0] ?? process.env.VIEWPORT_WIDTH) || '1280');
    const height: number = parseInt((args[1] ?? process.env.VIEWPORT_HEIGHT) || '720');
    const gridSize: number = parseInt(args[2] || '100');
    
    console.log(`Generating grid image with dimensions ${width}x${height} and grid size ${gridSize}px...`);
    
    // グリッド画像を生成
    const outputPath: string = await generateCoordinateGrid(width, height, gridSize);
    
    console.log(`Grid image successfully generated at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating grid image:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();
