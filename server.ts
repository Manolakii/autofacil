import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: WhatsApp Proxy (Optional, for logging or analytics)
  app.get("/api/whatsapp", (req, res) => {
    const { phone, message } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone required" });
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(String(message || ""))}`;
    res.redirect(waUrl);
  });

  // Background check for expired reservations (Simple simulation)
  // In a real app, this would use firebase-admin cron job
  setInterval(() => {
    // console.log("Checking for expired reservations...");
    // logic would go here: query reservations where expiresAt < now and status == 'active'
    // then update car status to 'available' and reservation to 'expired'
  }, 1000 * 60 * 5); // every 5 mins

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
