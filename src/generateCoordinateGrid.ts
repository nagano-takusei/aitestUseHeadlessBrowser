import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 解像度に合わせて等間隔にグリッド線のPNGを作成する関数
 * 
 * @param width - 画像の幅（ピクセル）
 * @param height - 画像の高さ（ピクセル）
 * @param gridSize - グリッドのサイズ（ピクセル）
 * @param outputPath - 出力ファイルのパス
 * @returns 生成された画像のパス
 */
export async function generateCoordinateGrid(
  width: number = 1280,
  height: number = 720,
  gridSize: number = 100,
  outputPath?: string
): Promise<string> {
  // キャンバスを作成
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 背景を透明に設定
  ctx.clearRect(0, 0, width, height);
  
  // グリッド線を描画
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  
  // 横線
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // 縦線
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // 座標値を描画
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.font = '12px Arial';
  
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      // 座標点にマーカーを描画
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // 座標値を描画
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(`${x},${y}`, x + 5, y + 15);
    }
  }
  
  // 出力パスが指定されていない場合はデフォルトのパスを使用
  if (!outputPath) {
    const dir = path.join(process.cwd(), 'screenShot');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    outputPath = path.join(dir, `grid-${width}x${height}-${gridSize}px.png`);
  }
  
  // PNGとして保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Grid image generated at: ${outputPath}`);
  return outputPath;
}

/**
 * コマンドラインから実行された場合の処理
 */
if (require.main === module) {
  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  const width = parseInt(args[0]) || 1280;
  const height = parseInt(args[1]) || 720;
  const gridSize = parseInt(args[2]) || 100;
  
  generateCoordinateGrid(width, height, gridSize)
    .then(path => console.log(`Grid image saved to: ${path}`))
    .catch(err => console.error('Error generating grid image:', err));
}
