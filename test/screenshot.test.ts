/// <reference types="jest" />
import request from "supertest";
import app from "../src/api";
import * as browserManager from "../src/browserManager";

// Create a dummy page object for testing
const dummyPage: any = {
  screenshot: async ({ path }: { path: string }) => Promise.resolve(path),
  url: () => "https://example.com",
  content: async () => "<html></html>",
  goto: async (url: string, options: any) => { return; }
};

describe("Screenshot API", () => {
  beforeAll(() => {
    // Assign dummy page to simulate an initialized browser page
    Object.defineProperty(browserManager, 'page', { value: dummyPage, configurable: true, writable: true });
  });

  afterAll(() => {
    // Cleanup if needed
    Object.defineProperty(browserManager, 'page', { value: null, configurable: true, writable: true });
  });

  it("should return error if page is not initialized", async () => {
    // Temporarily set page to null to test error response
    const originalPage = browserManager.page;
    Object.defineProperty(browserManager, 'page', { value: null, configurable: true, writable: true });
    const res = await request(app).post("/screenshot").send({});
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Page not initialized yet");
    // Restore the dummy page
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
