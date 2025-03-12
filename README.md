# Headless Browser API

このプロジェクトは、Puppeteerを使用したヘッドレスブラウザを制御するためのREST APIを提供します。ブラウザの操作、スクリーンショットの撮影、マウスやキーボードの操作などが可能です。

## 機能

- ブラウザの操作（URL移動、現在のURLの取得）
- スクリーンショットの撮影
- マウス操作（移動、クリック）
- キーボード操作（テキスト入力、キー押下）
- 座標グリッド画像の生成（デバッグ用）

## インストール

```bash
# 依存関係のインストール
npm install
```

## 使用方法

### ビルド

```bash
npm run build
```

### サーバーの起動

```bash
npm start
```

デフォルトでは、サーバーはポート2000で起動します。環境変数`PORT`を設定することで、ポート番号を変更できます。

### 座標グリッド画像の生成

デバッグ用に座標グリッド画像を生成できます。

```bash
# デフォルト設定（1280x720、グリッドサイズ100px）
npm run generate-grid:default

# カスタム設定
npm run generate-grid [width] [height] [gridSize]
```

例：
```bash
npm run generate-grid 1920 1080 200
```

## API エンドポイント

### GET /current-url

現在のブラウザページのURLを取得します。

**レスポンス例**:
```json
{
  "url": "https://www.example.com"
}
```

### POST /navigate

ブラウザを指定したURLに移動させます。

**リクエスト例**:
```json
{
  "url": "https://www.google.com"
}
```

**レスポンス例**:
```json
{
  "message": "Navigation complete",
  "currentUrl": "https://www.google.com"
}
```

### POST /screenshot

現在のブラウザページのスクリーンショットを撮影して保存します。

**レスポンス例**:
```json
{
  "message": "Screenshot saved",
  "path": "/path/to/screenshot.png"
}
```

### POST /type

キーボード入力を実行します。

**リクエスト例**:
```json
{
  "text": "Hello, World!",
  "delay": 100,
  "useClipboard": false
}
```

**レスポンス例**:
```json
{
  "message": "Successfully typed text",
  "text": "Hello, World!",
  "method": "keyboard"
}
```

### POST /press-key

特定のキーを押します。

**リクエスト例**:
```json
{
  "key": "Enter"
}
```

**レスポンス例**:
```json
{
  "message": "Successfully pressed key: Enter",
  "key": "Enter"
}
```

### POST /move-mouse

指定した座標にマウスカーソルを移動します。

**リクエスト例**:
```json
{
  "x": 100,
  "y": 200
}
```

**レスポンス例**:
```json
{
  "message": "Successfully moved mouse to coordinates (100, 200)",
  "coordinates": {
    "x": 100,
    "y": 200
  }
}
```

### POST /click

指定した座標でマウスクリックを実行します。

**リクエスト例**:
```json
{
  "x": 100,
  "y": 200,
  "button": "left",
  "clickCount": 1
}
```

**レスポンス例**:
```json
{
  "message": "Successfully clicked at coordinates (100, 200)",
  "coordinates": {
    "x": 100,
    "y": 200
  },
  "details": {
    "button": "left",
    "clickCount": 1
  }
}
```

## 環境変数

- `PORT`: サーバーのポート番号（デフォルト: 2000）
- `VIEWPORT_WIDTH`: ブラウザのビューポート幅（デフォルト: 1280）
- `VIEWPORT_HEIGHT`: ブラウザのビューポート高さ（デフォルト: 720）

## テスト

```bash
npm test
```

## ライセンス

ISC
