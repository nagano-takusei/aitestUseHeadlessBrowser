/// <reference types="jest" />
import 'dotenv/config';
import request from "supertest";

const dummyPage: any = {
  screenshot: async ({ path }: { path: string }) => Promise.resolve(path),
  viewport: () => ({
    width: Number(process.env.VIEWPORT_WIDTH) || 1280,
    height: Number(process.env.VIEWPORT_HEIGHT) || 720
  }),
  url: () => "https://example.com",
  content: async () => "<html></html>",
  goto: async (url: string, options: any) => { return; }
};

let app: any;
let browserManager: any;

describe("Screenshot API", () => {
  beforeEach(async () => {
    jest.resetModules();
    // Import browserManager and override page with dummyPage
    const browserModule = await import("../src/browserManager");
    browserManager = browserModule;
    Object.defineProperty(browserManager, 'page', { value: dummyPage, configurable: true, writable: true });
    // Import API module after setting dummyPage
    const apiModule = await import("../src/api");
    app = apiModule.default;
    // Re-assign dummyPage after API import to ensure live binding is updated
    Object.defineProperty(browserManager, 'page', { value: dummyPage, configurable: true, writable: true });
  });

  afterAll(() => {
    if (browserManager) {
      Object.defineProperty(browserManager, 'page', { value: null, configurable: true, writable: true });
    }
  });

  it("should return error if page is not initialized", async () => {
    const originalPage = browserManager.page;
    Object.defineProperty(browserManager, 'page', { value: null, configurable: true, writable: true });
    const res = await request(app).post("/screenshot").send({});
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Page not initialized yet");
    Object.defineProperty(browserManager, 'page', { value: originalPage, configurable: true, writable: true });
  });

  it("should save screenshot and return the file path", async () => {
    const res = await request(app).post("/screenshot").send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Screenshot saved");
    expect(res.body).toHaveProperty("path");
    expect(res.body.path).toMatch(/screenShot\/screenshot-.*\.png/);
  });
});
