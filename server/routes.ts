import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import handler from "../api/index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Route all /api requests through the Vercel handler using middleware
  app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Restore original URL for the handler
      const originalUrl = req.originalUrl;
      Object.defineProperty(req, 'url', { value: originalUrl, writable: true });
      
      await handler(req as any, res as any);
    } catch (error) {
      console.error("API handler error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  return httpServer;
}
