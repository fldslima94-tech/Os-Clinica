// Disable Vite HMR in AI Studio container to prevent iframe WebSocket connection errors
process.env.DISABLE_HMR = "true";

import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getUsers } from "./src/db/users.ts";
import { handleGeminiChat, handleMapsGrounding, handleGenerateImage } from "./server/gemini.ts";
import {
  executarDumpCriticoStorage,
  listarDumpsStorage,
  obterConteudoArquivoDump,
  salvarDumpLocal,
  iniciarAgendador03h
} from "./server/cloudStorageBackup.ts";
import {
  enviarMensagemWhatsApp,
  handleWhatsAppWebhookVerify,
  handleWhatsAppWebhookReceive,
  getWhatsAppConfigStatus,
  testarConexaoWhatsApp
} from "./server/whatsapp.ts";

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
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

  // ==========================================
  // Rotas da Cloud Function / Dumps Firebase Storage
  // ==========================================

  // 1. Listar dumps salvos no Firebase Storage
  app.get("/api/backups/storage/list", async (req, res) => {
    try {
      const dumps = await listarDumpsStorage();
      res.json({ sucesso: true, dumps });
    } catch (error: any) {
      console.error("Erro ao listar dumps do storage:", error);
      res.status(500).json({ error: error.message || "Erro ao listar dumps do storage" });
    }
  });

  // 2. Disparar dump imediato das coleções críticas para o Storage (mesma lógica da Cloud Function 03:00)
  app.post("/api/backups/storage/trigger-dump", async (req, res) => {
    try {
      const tipo = req.body?.tipo === 'cloud_function_03h' ? 'cloud_function_03h' : 'manual_cloud_trigger';
      const resultado = await executarDumpCriticoStorage(tipo);
      res.json({
        sucesso: true,
        mensagem: "Dump das coleções críticas realizado com sucesso para o Firebase Storage!",
        metadata: resultado.metadata
      });
    } catch (error: any) {
      console.error("Erro ao executar dump crítico para storage:", error);
      res.status(500).json({ error: error.message || "Falha ao processar dump para o Firebase Storage" });
    }
  });

  // 3. Download manual direto do arquivo JSON de backup do Storage
  app.get("/api/backups/storage/download/:filenameOrId", async (req, res) => {
    try {
      const { filenameOrId } = req.params;
      const conteudo = obterConteudoArquivoDump(filenameOrId);

      if (!conteudo) {
        return res.status(404).json({ error: "Arquivo de backup não localizado no Storage." });
      }

      const nomeDownload = filenameOrId.endsWith('.json') ? filenameOrId : `${filenameOrId}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeDownload}"`);
      res.send(conteudo);
    } catch (error: any) {
      console.error("Erro no download de backup do storage:", error);
      res.status(500).json({ error: error.message || "Erro ao baixar arquivo do storage" });
    }
  });

  // 4. Obter prévia/conteúdo do arquivo JSON de backup
  app.get("/api/backups/storage/content/:filenameOrId", async (req, res) => {
    try {
      const { filenameOrId } = req.params;
      const conteudo = obterConteudoArquivoDump(filenameOrId);

      if (!conteudo) {
        return res.status(404).json({ error: "Arquivo de backup não localizado." });
      }

      const parsed = JSON.parse(conteudo);
      res.json({ sucesso: true, dados: parsed });
    } catch (error: any) {
      console.error("Erro ao ler conteúdo do dump:", error);
      res.status(500).json({ error: error.message || "Erro ao abrir conteúdo do backup" });
    }
  });

  // 5. Salvar dump emitido pelo cliente no armazenamento local do servidor
  app.post("/api/backups/storage/save-dump", async (req, res) => {
    try {
      const { metadata, payload } = req.body;
      if (!metadata || !metadata.nomeArquivo) {
        return res.status(400).json({ error: "Metadados do dump inválidos" });
      }
      const ok = salvarDumpLocal(metadata, payload);
      res.json({ sucesso: ok });
    } catch (error: any) {
      console.error("Erro ao salvar dump local no servidor:", error);
      res.status(500).json({ error: error.message || "Falha ao salvar dump no servidor" });
    }
  });

  // Inicializa o agendador das 03:00 (America/Sao_Paulo)
  iniciarAgendador03h();

  // ==========================================
  // Rotas da Integração WhatsApp (Cloud API oficial da Meta)
  // ==========================================

  // Status das variáveis de ambiente configuradas no AI Studio / servidor
  app.get("/api/whatsapp/status", (req, res) => {
    try {
      const status = getWhatsAppConfigStatus();
      const host = req.get('host') || 'localhost:3000';
      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol = forwardedProto ? String(forwardedProto).split(',')[0] : (req.secure ? 'https' : 'http');
      res.json({
        sucesso: true,
        ...status,
        webhookUrl: `${protocol}://${host}/api/whatsapp/webhook`,
      });
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  // Testar conexão oficial com a Graph API da Meta usando as credenciais salvas
  app.post("/api/whatsapp/test-connection", async (req, res) => {
    try {
      const resultado = await testarConexaoWhatsApp();
      res.json(resultado);
    } catch (err: any) {
      res.status(500).json({ sucesso: false, mensagem: err.message || 'Erro ao testar conexão com o WhatsApp' });
    }
  });

  // 1. Verificação do webhook (chamada uma vez pela Meta ao configurar o webhook)
  app.get("/api/whatsapp/webhook", handleWhatsAppWebhookVerify);

  // 2. Recebimento de mensagens/pedidos dos clientes (chamado pela Meta a cada mensagem)
  app.post("/api/whatsapp/webhook", handleWhatsAppWebhookReceive);

  // 3. Envio manual/interno de mensagens (usado pela tela de Automação WhatsApp do app)
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { telefone, mensagem } = req.body;
      if (!telefone || !mensagem) {
        return res.status(400).json({ error: "Os campos 'telefone' e 'mensagem' são obrigatórios." });
      }
      const resultado = await enviarMensagemWhatsApp(telefone, mensagem);
      if (!resultado.sucesso) {
        return res.status(502).json({ error: resultado.erro || "Falha ao enviar mensagem via WhatsApp" });
      }
      res.json({ sucesso: true, id: resultado.id });
    } catch (error: any) {
      console.error("Erro ao enviar mensagem WhatsApp:", error);
      res.status(500).json({ error: error.message || "Erro ao enviar mensagem WhatsApp" });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const customViteLogger = createLogger();
    const origError = customViteLogger.error.bind(customViteLogger);
    const origWarn = customViteLogger.warn.bind(customViteLogger);
    const origInfo = customViteLogger.info.bind(customViteLogger);

    customViteLogger.error = (msg, opts) => {
      const str = typeof msg === 'string' ? msg : (msg && (msg as any).message) || String(msg);
      if (str.includes('WebSocket') || str.includes('ws error') || str.includes('vite-hmr') || str.includes('EADDRINUSE')) {
        return;
      }
      origError(msg, opts);
    };

    customViteLogger.warn = (msg, opts) => {
      const str = typeof msg === 'string' ? msg : (msg && (msg as any).message) || String(msg);
      if (str.includes('WebSocket') || str.includes('ws error') || str.includes('vite-hmr')) {
        return;
      }
      origWarn(msg, opts);
    };

    customViteLogger.info = (msg, opts) => {
      const str = typeof msg === 'string' ? msg : (msg && (msg as any).message) || String(msg);
      if (str.includes('WebSocket') || str.includes('ws error') || str.includes('vite-hmr')) {
        return;
      }
      origInfo(msg, opts);
    };

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
      customLogger: customViteLogger,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
