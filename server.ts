import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getUsers } from "./src/db/users.ts";
import { handleGeminiChat, handleMapsGrounding, handleGenerateImage } from "./server/gemini.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and large base64 payload for image editing
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini AI Chat endpoint (Multi-turn, role-based, speed-modes)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, role, mode } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "A mensagem é obrigatória." });
      }
      const result = await handleGeminiChat({ message, history, role, mode });
      res.json(result);
    } catch (error: any) {
      console.error("Erro no chat Gemini:", error);
      res.status(500).json({ error: error.message || "Erro ao processar mensagem com Gemini" });
    }
  });

  // Gemini Google Maps Grounding endpoint
  app.post("/api/gemini/maps-grounding", async (req, res) => {
    try {
      const { query, location } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "A consulta de busca é obrigatória." });
      }
      const result = await handleMapsGrounding({ query, location });
      res.json(result);
    } catch (error: any) {
      console.error("Erro no Maps Grounding:", error);
      res.status(500).json({ error: error.message || "Erro ao consultar Google Maps com Gemini" });
    }
  });

  // Gemini Image Creation & Simulation Studio endpoint
  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, imageSize, base64Image, mimeType, mode } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "O prompt descritivo da imagem é obrigatório." });
      }
      const result = await handleGenerateImage({ prompt, aspectRatio, imageSize, base64Image, mimeType, mode });
      res.json(result);
    } catch (error: any) {
      console.error("Erro na geração de imagem Gemini:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar ou editar imagem com Gemini" });
    }
  });

  // Protected user sync endpoint
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      const nome = req.body?.nome || req.user?.name || "";

      if (!uid) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const userRecord = await getOrCreateUser(uid, email, nome);
      res.json({ success: true, user: userRecord });
    } catch (error: any) {
      console.error("User sync error:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // Protected users list endpoint
  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const usersList = await getUsers();
      res.json(usersList);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Vite middleware for development vs static serve for production
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
