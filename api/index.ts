import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, initializeApp } from "../server/app";

let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize Express routes on first request
  if (!initialized) {
    await initializeApp();
    initialized = true;
  }

  // Let Express handle the request
  return new Promise((resolve) => {
    app(req as any, res as any, () => {
      resolve(undefined);
    });
  });
}
