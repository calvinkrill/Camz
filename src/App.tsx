import { useState, useEffect } from "react";
import { 
  Bot, 
  Terminal, 
  Server, 
  Settings, 
  LogOut, 
  Activity, 
  Users, 
  Cpu, 
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
interface BotStatus {
  status: string;
  tag: string;
  avatar: string | null;
  guildCount: number;
  userCount: number;
  uptime: number;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
}

// --- Components ---

const Login = () => {
  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/url");
      const { url } = await response.json();
      const authWindow = window.open(url, "discord_auth", "width=600,height=800");
      if (!authWindow) alert("Popup blocked! Please allow popups.");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E11] text-slate-200 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#151921] rounded-2xl p-8 border border-white/5 shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#5865F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
            <Bot size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight">AEGIS</h1>
        <p className="text-slate-500 text-center uppercase tracking-widest text-xs font-bold mb-8">Command Center</p>
        
        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] transition-colors rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20 group text-white"
          id="login-button"
        >
          <Bot size={20} className="group-hover:rotate-12 transition-transform" />
          Login with Discord
        </button>
        
        <p className="mt-8 text-[10px] text-slate-600 text-center uppercase tracking-[0.2em] font-black italic">
          Secure • Real-time • Modern
        </p>
      </motion.div>
    </div>
  );
};

const DashboardStats = ({ status }: { status: BotStatus | null }) => {
  if (!status) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: "Status", value: status.status, icon: Activity, color: status.status === "online" ? "text-green-400" : "text-red-400", sub: status.status === "online" ? "Active" : "Down" },
        { label: "Total Guilds", value: status.guildCount.toLocaleString(), icon: Server, color: "text-blue-400", sub: "+2% from last week" },
        { label: "Active Users", value: status.userCount.toLocaleString(), icon: Users, color: "text-purple-400", sub: "Peak: 14:02 UTC" },
        { label: "Uptime", value: `${Math.floor(status.uptime / 60000)}m`, icon: Cpu, color: "text-orange-400", sub: "Avg: 99.9%" },
      ].map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-[#151921] p-5 rounded-xl border border-white/5 flex flex-col gap-1 shadow-sm hover:border-white/10 transition-colors"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-white tracking-tight capitalize">{stat.value}</p>
            <stat.icon size={20} className={stat.color} />
          </div>
          <p className={`text-[10px] ${stat.color}`}>{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  );
};

const LogsPanel = ({ logs }: { logs: string[] }) => {
  return (
    <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden shadow-sm flex flex-col h-[500px] font-mono">
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
          <span className="text-[10px] text-slate-500 ml-2 uppercase tracking-wider font-bold">LIVE_TERMINAL</span>
        </div>
        <div className="text-[10px] text-slate-600 font-bold tracking-widest">SHARD_01</div>
      </div>
      <div className="p-4 text-[11px] overflow-y-auto flex-1 custom-scrollbar space-y-1">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">Listening for gateway events...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 shrink-0">[{i.toString().padStart(2, '0')}]</span>
              <span className="text-slate-300 break-all">{log}</span>
            </div>
          ))
        )}
        <p className="text-white animate-pulse">_</p>
      </div>
    </div>
  );
};

const ServerList = ({ guilds }: { guilds: Guild[] }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Active Clusters</h2>
      <div className="grid grid-cols-1 gap-2">
        {guilds.map((guild) => (
          <motion.div 
            key={guild.id}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between p-3 bg-[#151921] border border-white/5 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {guild.icon ? (
                <img src={guild.icon} alt={guild.name} className="w-8 h-8 rounded shadow-md" />
              ) : (
                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
                  {guild.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-200 text-xs group-hover:text-blue-400 transition-colors uppercase tracking-tight">{guild.name}</p>
                <p className="text-[10px] text-slate-500">{guild.memberCount.toLocaleString()} members</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
          </motion.div>
        ))}
        {guilds.length === 0 && (
          <div className="p-8 text-center bg-[#151921] border border-dashed border-white/5 rounded-xl">
            <p className="text-slate-500 text-xs italic">No active telemetry found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchData = async () => {
    try {
      const [userRes, statusRes, logsRes, guildsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/bot/status"),
        fetch("/api/bot/logs"),
        fetch("/api/bot/guilds")
      ]);

      if (userRes.ok) setUser(await userRes.json());
      if (statusRes.ok) setBotStatus(await statusRes.json());
      if (logsRes.ok) {
        const { logs } = await logsRes.json();
        setLogs(logs);
      }
      if (guildsRes.ok) {
        const { guilds } = await guildsRes.json();
        setGuilds(guilds);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (user) fetchData();
    }, 5000);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "OAUTH_AUTH_SUCCESS") fetchData();
    };
    window.addEventListener("message", handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    };
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const handleSendMessage = async (guildId: string) => {
    const channelId = prompt("Enter Channel ID to send message to:");
    if (!channelId) return;
    const message = prompt("Enter message to send:");
    if (!message) return;

    try {
      const res = await fetch("/api/bot/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, message }),
      });
      if (res.ok) alert("Message sent successfully!");
      else alert("Failed to send message.");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0E10] text-[#5865F2]">
        <RefreshCw className="animate-spin" size={40} />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="flex bg-[#0B0E11] min-h-screen text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#151921] border-r border-white/5 hidden lg:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#5865F2] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight text-white uppercase">AEGIS</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Command Center</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: RefreshCw },
            { id: "guilds", label: "Module Config", icon: Server },
            { id: "logs", label: "Log Streaming", icon: Terminal },
            { id: "settings", label: "System Setup", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                activeTab === item.id 
                  ? "bg-white/5 text-white border border-white/10" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === item.id ? "bg-blue-400" : "bg-transparent"}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-[#1C212B] p-3 rounded-lg flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <img 
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
                alt={user.username} 
                className="w-8 h-8 rounded-full bg-slate-500"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 truncate italic">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={12} />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Top Bar Indicator Panel */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#0B0E11]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <span className={`px-2 py-1 ${botStatus?.status === "online" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} text-[10px] font-bold rounded border uppercase tracking-wider`}>
              Shard 01: {botStatus?.status || "offline"}
            </span>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs text-slate-500 font-medium tracking-tight">Latency: <span className="text-slate-300">24ms</span></span>
              <span className="text-xs text-slate-500 font-medium tracking-tight">RAM: <span className="text-slate-300">1.24 GB</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              className="bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 rounded text-[10px] font-bold transition-colors uppercase tracking-widest text-white shadow-lg shadow-[#5865F2]/20"
            >
              Sync System
            </motion.button>
          </div>
        </header>

        <div className="p-8 lg:p-12 max-w-6xl w-full mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DashboardStats status={botStatus} />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <LogsPanel logs={logs} />
                  </div>
                  <div>
                    <ServerList guilds={guilds.slice(0, 8)} />
                    <button 
                      onClick={() => setActiveTab("guilds")}
                      className="w-full mt-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 border border-blue-500/10 rounded-lg bg-blue-500/5"
                    >
                      Access Global Clusters <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "guilds" && (
              <motion.div 
                key="guilds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {guilds.map((guild) => (
                  <div key={guild.id} className="bg-[#151921] border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {guild.icon ? (
                          <img src={guild.icon} alt={guild.name} className="w-12 h-12 rounded-lg shadow-xl ring-2 ring-white/5" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-lg font-bold text-white shadow-xl ring-2 ring-white/5">
                            {guild.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-tight truncate w-32">{guild.name}</h3>
                          <p className="text-[10px] text-slate-500 font-mono italic">{guild.id}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-black">
                        <span>Registry</span>
                        <span>{guild.memberCount} POP.</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-2/3" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button className="py-2 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-white uppercase tracking-widest transition-colors border border-white/5">
                          Kernel
                        </button>
                        <button 
                          onClick={() => handleSendMessage(guild.id)}
                          className="py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase tracking-widest transition-colors border border-blue-500/20 flex items-center justify-center gap-1.5"
                        >
                          Push <Send size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "logs" && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse outline outline-blue-500/30 outline-offset-2" />
                    Telemetric Stream
                  </p>
                  <p className="text-[10px] font-mono text-slate-600">BUFFER: 100/100</p>
                </div>
                <LogsPanel logs={logs} />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                <div className="bg-[#151921] border border-white/5 rounded-xl p-8 space-y-8 shadow-2xl">
                  <section>
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center justify-between uppercase tracking-[0.2em]">
                      Environment Protocol
                      <span className="text-[10px] text-slate-500 font-mono">SEC_LEVEL: 4</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1 text-center italic">Gateway Token</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="password" 
                            value="•••••••••••••••••••••••••" 
                            readOnly 
                            className="flex-1 bg-black/20 border border-white/5 rounded-lg px-4 py-3 text-xs text-slate-500 font-mono focus:outline-none"
                          />
                          <button className="px-5 py-3 bg-white/5 rounded-lg text-[10px] font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-[0.2em] border border-white/5">Access</button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="pt-8 border-t border-white/5">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-[0.2em]">Automated Routines</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { title: "Debug Overlays", desc: "Global event trace logging" },
                        { title: "Autonomous Rec", desc: "Gateway reconnect logic" }
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-tight">{s.title}</p>
                            <p className="text-[10px] text-slate-500 italic">{s.desc}</p>
                          </div>
                          <div className="w-10 h-5 bg-green-500/10 border border-green-500/20 rounded-full relative cursor-pointer">
                            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-500/20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pt-8 border-t border-white/5 px-2">
                    <div className="flex gap-4 items-start opacity-60 hover:opacity-100 transition-opacity">
                      <ExternalLink className="text-slate-500 shrink-0 mt-1" size={18} />
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-[0.2em]">Reference Documentation</h4>
                        <a 
                          href="https://discord.com/developers/applications" 
                          target="_blank" 
                          className="text-[10px] font-bold text-blue-400 hover:underline flex items-center gap-1.5 uppercase tracking-widest italic"
                        >
                          Manual Override <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
