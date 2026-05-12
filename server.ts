import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import session from "express-session";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";
import { spawn, ChildProcess } from "child_process";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const PYTHON_API = "http://127.0.0.1:5000";

  let pythonBot: ChildProcess | null = null;
  let botLogs: string[] = ["[System] Initializing unified controller..."];

  const log = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    botLogs.push(`[${timestamp}] ${msg}`);
    if (botLogs.length > 100) botLogs.shift();
    console.log(`[Dashboard] ${msg}`);
  };

  // --- Start Python Bot ---
  if (process.env.DISCORD_TOKEN) {
    try {
      pythonBot = spawn("python3", ["bot.py"], {
        env: process.env,
      });

      pythonBot.stdout?.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach((line: string) => {
          if (line.trim()) log(line.trim());
        });
      });

      pythonBot.stderr?.on("data", (data) => {
        log(`[Python Error] ${data.toString()}`);
      });

      pythonBot.on("close", (code) => {
        log(`Python bot process exited with code ${code}`);
      });
      
      log("Python bot engine spawned.");
    } catch (err: any) {
      log(`Failed to spawn Python bot: ${err.message}`);
    }
  } else {
    log("Waiting for DISCORD_TOKEN configuration...");
  }

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "discord-dashboard-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true if using HTTPS
        sameSite: "lax",
        httpOnly: true,
      },
    })
  );

  // --- API Routes ---

  // Auth Status
  app.get("/api/auth/me", (req, res) => {
    const user = (req.session as any).user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // OAuth URL
  app.get("/api/auth/url", (req, res) => {
    const configuredAuthUrl = process.env.DISCORD_AUTH_URL;

    if (configuredAuthUrl) {
      return res.json({ url: configuredAuthUrl });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: "DISCORD_CLIENT_ID not configured" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify guilds",
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // OAuth Callback
  app.get("/api/auth/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/callback`;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Missing code or configuration");
    }

    try {
      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: redirectUri,
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      (req.session as any).user = userResponse.data;
      (req.session as any).accessToken = access_token;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("OAuth error:", err.response?.data || err.message);
      res.status(500).send("Authentication failed");
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Bot Status & Stats (Proxied to Python)
  app.get("/api/bot/status", async (req, res) => {
    if (!(req.session as any).user) return res.status(401).send("Unauthorized");
    
    try {
      const response = await axios.get(`${PYTHON_API}/status`);
      res.json(response.data);
    } catch (err) {
      res.json({
        status: "offline",
        tag: "N/A",
        guildCount: 0,
        userCount: 0,
        uptime: 0,
      });
    }
  });

  // Bot Logs (Local Dashboard Logs + Proxied Python Logs)
  app.get("/api/bot/logs", async (req, res) => {
    if (!(req.session as any).user) return res.status(401).send("Unauthorized");
    res.json({ logs: botLogs });
  });

  // Guilds List (We still use OAuth for the dashboard to see user's guilds, 
  // or proxy to bot to see bot's guilds)
  app.get("/api/bot/guilds", async (req, res) => {
    if (!(req.session as any).user) return res.status(401).send("Unauthorized");
    // Since we don't have a direct guild list from the simple bot API yet, 
    // we'll return an empty list or fetch from Discord API if we wanted.
    // For now, let's just stick to the status.
    res.json({ guilds: [] });
  });

  // Controls: Send Message (Proxied to Python)
  app.post("/api/bot/send-message", async (req, res) => {
    if (!(req.session as any).user) return res.status(401).send("Unauthorized");
    const { channelId, message } = req.body;
    
    try {
      const response = await axios.post(`${PYTHON_API}/send-message`, { channelId, message });
      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: "Python bot bridge failed: " + err.message });
    }
  });

  // Vite middleware
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
