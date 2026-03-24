/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint to bypass CORS
  app.get("/api/proxy", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Proxying request to: ${url}`);
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
        },
        timeout: 20000,
        validateStatus: (status) => true,
      });

      if (response.status === 403) {
        console.warn(`Provider returned 403 Forbidden for ${url}`);
        return res.status(403).json({ 
          error: "Access Denied (403)", 
          details: "The IPTV provider blocked the request. This often happens if the provider blocks cloud-based IP addresses or requires specific authentication headers not present in this request." 
        });
      }

      if (response.status === 884) {
        console.warn(`Provider returned 884 Account Issue for ${url}`);
        return res.status(403).json({ 
          error: "Account Issue (884)", 
          details: "The IPTV provider returned code 884. This usually means the account is expired, disabled, or has reached its connection limit." 
        });
      }

      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error(`Proxy error for ${url}:`, error.message);
      res.status(error.response?.status || 500).json({
        error: "Failed to fetch resource",
        details: error.message,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
