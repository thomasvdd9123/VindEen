import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import handler from "../api/index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const callHandler = async (req: Request, res: Response) => {
    try {
      const originalUrl = req.originalUrl;
      Object.defineProperty(req, 'url', { value: originalUrl, writable: true });
      await handler(req as any, res as any);
    } catch (error) {
      console.error("API handler error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };

  // /api/* requests
  app.use("/api", callHandler);

  // SEO / static endpoints handled inside api/index.ts
  app.get("/sitemap.xml", callHandler);
  app.get("/robots.txt", callHandler);
  app.get("/llms.txt", callHandler);
  app.get("/llms-full.txt", callHandler);
  app.use("/sitemaps", callHandler);
  app.get(/^\/google[a-z0-9]+\.html$/, callHandler);

  return httpServer;
}
