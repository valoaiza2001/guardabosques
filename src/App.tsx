import React, { useState, useEffect } from "react";
import { MapPin, Flame, Bell, ShieldPlus, BookOpen, Users, Camera, Upload, MessageCircle, Send, Home, BarChart3, AlertTriangle, Compass, Leaf, Trophy, ChevronRight, Play, User, Phone, Route, Copy, Moon, Sun, Settings, HandHeart, PlayCircle, FileDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

/**
 * Guardabosques – App móvil (HI-FI prototype)
 * - Login realista (usuario+contraseña). Sin localStorage.
 * - Roles (Ciudadano / Academia / Autoridad) se cambian solo en Perfil.
 * - Modo claro/oscuro con interruptor global.
 * - Academia: variables extra (viento, humo) + CSV/API + rango de fechas.
 * - Autoridades: Panel de despacho con lógica de botones y jerarquía.
 * - Overlays: Detalle de alerta, Micro-curso, Curso detallado (Prevención en caminatas).
 * - Hovers en TODOS los botones.
 */

type Role = "ciudadano" | "academia" | "autoridad";

type AlertItem = { id: number; place: string; level: "Bajo" | "Medio" | "Alto"; time: string; color: string };

const accent = "#C5F65B";
const primary = "#2f7a49";
const amber = "#FFB300";
const danger = "#E53935";
const ink = "#0F172A";

// Serie demo extendida con viento (km/h) y humo (0-1)
const series = [
  { t: "08:00", temp: 22, hum: 58, wind: 7, smoke: 0.05 },
  { t: "10:00", temp: 26, hum: 52, wind: 11, smoke: 0.08 },
  { t: "12:00", temp: 30, hum: 45, wind: 14, smoke: 0.12 },
  { t: "14:00", temp: 33, hum: 40, wind: 18, smoke: 0.20 },
  { t: "16:00", temp: 31, hum: 44, wind: 13, smoke: 0.10 },
  { t: "18:00", temp: 27, hum: 50, wind: 9, smoke: 0.06 },
];

const alerts: AlertItem[] = [
  { id: 1, place: "Cristo Rey", level: "Alto", time: "hace 12 min", color: danger },
  { id: 2, place: "Altos de Menga", level: "Medio", time: "hace 35 min", color: amber },
  { id: 3, place: "Terrón Colorado", level: "Bajo", time: "hace 1 h", color: primary },
];

const btnBase = "transition active:scale-[0.99]"; // util para consistencia de hover/active

// ---------- Helpers tema ----------
function ThemeStyles() {
  return (
    <style>{`
      .theme-dark { background: #0b1220; }
      .theme-dark .phone { background: #0f172a !important; border-color: #1f2a44 !important; }
      .theme-dark .chip, .theme-dark .card, .theme-dark .bar { background: #0f172a !important; }
      .theme-dark .text-main { color: #e2e8f0 !important; }
      .theme-dark .text-sub { color: #94a3b8 !important; }
      .theme-dark .bg-white { background-color: #0f172a !important; }
      .theme-dark .border, .theme-dark .border-slate-200 { border-color: #1f2a44 !important; }
      .theme-dark .hover\\:bg-slate-50:hover { background-color: #0b1220 !important; }
      .theme-dark .backdrop-blur { backdrop-filter: blur(8px); background-color: rgba(15,23,42,0.6) !important; }
      /* Inputs y selects */
      .theme-dark input, .theme-dark select, .theme-dark textarea { background-color: #0f172a !important; color: #e2e8f0 !important; border-color: #1f2a44 !important; }
      .theme-dark input::placeholder, .theme-dark textarea::placeholder { color: #64748b !important; }
      /* Botones: texto por defecto claro en oscuro; respetar botones sólidos */
      .theme-dark button { color: #e2e8f0; }
      .theme-dark button.text-white { color: #ffffff !important; }
    `}</style>
  );
}

function MobileFrame({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div className={"w-full flex justify-center py-6 " + (dark ? "theme-dark" : "theme-light")}>
      <ThemeStyles />
      <div className="w-[390px] h-[844px] rounded-[36px] shadow-2xl overflow-hidden border relative phone bg-white border-slate-200">
        {/* dynamic island notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 w-40 h-6 bg-black/80 rounded-full" />
        {children}
      </div>
    </div>
  );
}

function TopBar({ title, right, dark, onToggleTheme }: { title: string; right?: React.ReactNode; dark: boolean; onToggleTheme?: () => void }) {
  return (
    <div className="px-5 pt-10 pb-3 flex items-center justify-between border-b border-slate-100 bg-white/70 backdrop-blur sticky top-0 z-10 card">
      <div className="flex items-center gap-2">
        <Compass size={18} color={primary} />
        <span className="text-xs tracking-wide text-sub">Cali · Cerros</span>
      </div>
      <h1 className="text-lg font-semibold text-main">{title}</h1>
      {right ?? (
        <button onClick={onToggleTheme} title={dark ? "Modo claro" : "Modo oscuro"} className={`w-8 h-8 rounded-full grid place-items-center hover:bg-slate-200 ${btnBase}`}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      )}
    </div>
  );
}

function Metric({ label, value, chipColor }: { label: string; value: string; chipColor?: string }) {
  return (
    <div className="flex-1 rounded-2xl p-3 border card">
      <div className="text-xs text-sub mb-1">{label}</div>
      <div className="text-xl font-semibold text-main">{value}</div>
      {chipColor && <div className="mt-2 inline-flex items-center text-[10px] px-2 py-1 rounded-full" style={{ background: chipColor + "20", color: chipColor }}>● En rango</div>}
    </div>
  );
}

function MapCard() {
  return (
    <div className="rounded-3xl p-4 border card bg-gradient-to-br from-[#e9f7ee] to-white">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-main flex items-center gap-2"><MapPin size={16} color={primary} /> Mapa en vivo</div>
        <div className="text-xs text-sub">Riesgo: <span className="font-semibold" style={{ color: amber }}>Medio</span></div>
      </div>
      {/* pseudo-mapa */}
      <div className="relative w-full h-48 rounded-2xl bg-[conic-gradient(at_top_left,_#d6f0de,_#ffffff)] overflow-hidden">
        {[{ x: '20%', y: '25%', c: danger }, { x: '60%', y: '40%', c: amber }, { x: '75%', y: '70%', c: primary }].map((m, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-3 animate-pulse" style={{ left: m.x, top: m.y }}>
            <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: m.c, left: m.x, top: m.y, position: 'absolute' }} />
          </div>
        ))}
        <div className="absolute bottom-2 left-2 text-[10px] text-sub">Simulación</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className={`flex-1 rounded-xl border py-2 text-sm hover:bg-slate-50 ${btnBase} text-main`}>Filtrar</button>
        <button className={`flex-1 rounded-xl py-2 text-sm text-white hover:opacity-90 ${btnBase}`} style={{ background: primary }}>Vista satelital</button>
      </div>
    </div>
  );
}

function AlertList({ onOpen }: { onOpen?: (a: AlertItem) => void }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} color={amber} />
        <span className="text-main font-medium">Alertas recientes</span>
      </div>
      <div className="flex flex-col gap-2">
        {alerts.map(a => (
          <button key={a.id} onClick={() => onOpen?.(a)} className={`rounded-2xl p-3 border card flex items-center justify-between text-left hover:bg-slate-50 ${btnBase}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-white" style={{ background: a.color }}>
                <Flame size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-main">{a.place}</div>
                <div className="text-[11px] text-sub">{a.time}</div>
              </div>
            </div>
            <div className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: a.color + "20", color: a.color }}>{a.level}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniStats() {
  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      <Metric label="Temp" value="31°C" chipColor={danger} />
      <Metric label="Humedad" value="44%" chipColor={primary} />
      <Metric label="Viento" value="9 km/h" chipColor={amber} />
      <Metric label="Humo" value="0.08" chipColor={danger} />
    </div>
  );
}

function HomeScreen({ role, onOpenAlert, dark, onToggleTheme }: { role: Role; onOpenAlert: (a: AlertItem) => void; dark: boolean; onToggleTheme: () => void }) {
  return (
    <div className="px-5 pb-28">
      <TopBar title="Guardianes" dark={dark} onToggleTheme={onToggleTheme} right={<div className="text-[11px] px-2 py-1 rounded-full border chip">{role}</div>} />
      <div className="px-1 pt-2">
        <MapCard />
        <MiniStats />
        <div className="mt-4 rounded-3xl border p-4 card">
          <div className="text-sm font-medium mb-3 flex items-center gap-2"><BarChart3 size={16} color={primary} /> Tª/Humedad (hoy)</div>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[20, 36]} />
                <Tooltip />
                <Area type="monotone" dataKey="temp" stroke={primary} fill="url(#grad)" />
                <Line type="monotone" dataKey="hum" stroke={amber} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <AlertList onOpen={onOpenAlert} />
      </div>
    </div>
  );
}

function ReportScreen() {
  return (
    <div className="px-5 pb-28">
      <TopBar title="Reportar incendio" dark={false} />
      <div className="space-y-3 mt-2">
        <div className="rounded-2xl border p-4 card">
          <div className="text-sm font-medium mb-2 flex items-center gap-2"><MapPin size={16} color={primary} /> Ubicación</div>
          <div className="text-xs text-sub mb-2">Usa tu GPS o ajusta en el mapa</div>
          <div className="w-full h-44 rounded-xl bg-[conic-gradient(at_top_left,_#e7f7d6,_#ffffff)] relative" />
          <button className={`mt-3 w-full rounded-xl py-2 text-sm hover:bg-lime-200 ${btnBase} text-main`} style={{ background: accent }}>Usar mi ubicación</button>
        </div>
        <div className="rounded-2xl border p-4 card">
          <div className="text-sm font-medium mb-2 flex items-center gap-2"><Camera size={16} /> Evidencia</div>
          <div className="grid grid-cols-3 gap-2">
            <button className={`aspect-square rounded-xl border border-dashed grid place-items-center text-sub hover:bg-slate-50 ${btnBase}`}> <Upload size={18} /> </button>
            <button className={`aspect-square rounded-xl border border-dashed grid place-items-center text-sub hover:bg-slate-50 ${btnBase}`}>+</button>
            <button className={`aspect-square rounded-xl border border-dashed grid place-items-center text-sub hover:bg-slate-50 ${btnBase}`}>+</button>
          </div>
        </div>
        <div className="rounded-2xl border p-4 card">
          <div className="text-sm font-medium mb-2 flex items-center gap-2"><MessageCircle size={16} /> Descripción</div>
          <textarea className="w-full h-24 border rounded-xl p-3 text-sm text-main placeholder:text-sub" placeholder="Ej: llama visible en ladera, viento moderado, sin heridos." />
          <div className="flex items-center justify-between mt-3 text-xs text-sub">
            <div className="flex items-center gap-2"><AlertTriangle size={14} color={amber} /> Prioridad estimada: <span className="font-semibold text-main">Media</span></div>
            <label className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" className="ml-1" defaultChecked />Anonimato</label>
          </div>
        </div>
        <button className={`w-full rounded-2xl py-3 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 ${btnBase}`} style={{ background: danger }}>
          <Send size={18} /> Enviar reporte
        </button>
        <div className="text-center text-xs text-sub">Se notificará a Bomberos, DAGMA y CVC automáticamente.</div>
      </div>
    </div>
  );
}

function LearnScreen({ onStartLesson, onOpenCourse, dark, onToggleTheme }: { onStartLesson: () => void; onOpenCourse: () => void; dark: boolean; onToggleTheme: () => void }) {
  const tiles = [
    { t: "Prevención en caminatas", i: <Leaf size={16} />, onClick: onOpenCourse },
    { t: "Qué hacer / NO hacer", i: <ShieldPlus size={16} />, onClick: onStartLesson },
    { t: "Primeros auxilios básicos", i: <ShieldPlus size={16} />, onClick: onStartLesson },
  ];
  return (
    <div className="px-5 pb-28">
      <TopBar title="Educar & prevenir" dark={dark} onToggleTheme={onToggleTheme} />
      <div className="mt-2 grid grid-cols-2 gap-3">
        {tiles.map((k, idx) => (
          <button key={idx} onClick={k.onClick} className={`rounded-3xl border p-4 text-left card hover:bg-slate-50 transition ${btnBase}`}>
            <div className="w-8 h-8 rounded-xl grid place-items-center mb-3" style={{ background: accent }}>
              {k.i}
            </div>
            <div className="text-sm font-semibold text-main">{k.t}</div>
            <div className="text-[11px] text-sub mt-1">3–5 min</div>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-3xl border p-4 card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-main">Micro-curso: Actuación segura</div>
            <div className="text-[11px] text-sub">Gana la insignia <b>Primer Respondiente</b></div>
          </div>
          <button onClick={onStartLesson} className={`rounded-full p-3 hover:opacity-90 ${btnBase}`} style={{ background: primary }}><Play size={16} color="#fff" /></button>
        </div>
      </div>
    </div>
  );
}

function CommunityScreen({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const posts = [
    { user: "Laura", text: "Vimos humo leve en La Castilla, ya atendido.", ts: "hace 2 h" },
    { user: "Andrés", text: "Consejo: lleven bolsas para su basura al subir.", ts: "hace 5 h" },
  ];
  return (
    <div className="px-5 pb-28">
      <TopBar title="Comunidad" dark={dark} onToggleTheme={onToggleTheme} />
      <div className="space-y-2 mt-2">
        {posts.map((p, i) => (
          <div key={i} className="rounded-2xl p-3 border card">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 grid place-items-center"><User size={14} /></div>
              <div className="text-sm font-semibold text-main">{p.user}</div>
              <div className="text-[11px] text-sub ml-auto">{p.ts}</div>
            </div>
            <div className="text-sm text-main/90">{p.text}</div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[350px] flex gap-2">
        <input className="flex-1 rounded-xl border px-3 py-2 text-sm text-main placeholder:text-sub" placeholder="Comparte una recomendación" />
        <button className={`rounded-xl px-4 text-sm text-white hover:opacity-90 ${btnBase}`} style={{ background: primary }}>Publicar</button>
      </div>
    </div>
  );
}

function DataLabScreen({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const [sensor, setSensor] = useState("Sensor A");
  const [varKey, setVarKey] = useState<"temp" | "hum" | "wind" | "smoke">("temp");
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const apiUrl = `https://api.guardabosques.local/sensors?sensor=${encodeURIComponent(sensor)}&var=${varKey}&from=${from}&to=${to}`;

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(apiUrl); alert("URL copiada"); } catch { alert("No se pudo copiar"); }
  };

  const downloadCsv = () => {
    const header = "hora," + ({ temp: "temperatura", hum: "humedad", wind: "viento_kmh", smoke: "humo_index" } as any)[varKey] + "\n";
    const rows = series.map(d => `${d.t},${(d as any)[varKey]}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `datos_${sensor}_${varKey}_${from}_a_${to}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const domain = varKey === 'smoke' ? [0, 1] : varKey === 'wind' ? [0, 30] : undefined;

  return (
    <div className="px-5 pb-28">
      <TopBar title="Datos en tiempo real" dark={dark} onToggleTheme={onToggleTheme} />
      <div className="mt-3 rounded-3xl border p-4 card">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={sensor} onChange={e => setSensor(e.target.value)} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 text-main">
            <option>Sensor A</option>
            <option>Sensor B</option>
            <option>Sensor C</option>
          </select>
          <select value={varKey} onChange={e => setVarKey(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 text-main">
            <option value="temp">Temperatura</option>
            <option value="hum">Humedad</option>
            <option value="wind">Viento</option>
            <option value="smoke">Humo</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 text-main" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 text-main" />
        </div>
        <div className="text-xs text-sub break-all mb-2">{apiUrl}</div>
        <div className="flex gap-2 mb-3">
          <button onClick={copyUrl} className={`flex-1 rounded-xl border py-2 text-sm hover:bg-slate-50 ${btnBase} text-main`}><Copy size={14} className="inline mr-1" /> Copiar URL API</button>
          <button onClick={downloadCsv} className={`flex-1 rounded-xl border py-2 text-sm hover:bg-slate-50 ${btnBase} text-main`}>Descargar CSV</button>
        </div>
        <div className="text-sm font-medium mb-2 text-main">{sensor} · {({ temp: "Temperatura", hum: "Humedad", wind: "Viento", smoke: "Humo" } as any)[varKey]} (día)</div>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis domain={domain as any} />
              <Tooltip />
              <Line type="monotone" dataKey={varKey} stroke={varKey === 'temp' ? primary : varKey === 'hum' ? amber : varKey === 'wind' ? '#0284c7' : danger} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AlertsScreen({ onOpenAlert, dark, onToggleTheme }: { onOpenAlert: (a: AlertItem) => void; dark: boolean; onToggleTheme: () => void }) {
  return (
    <div className="px-5 pb-28">
      <TopBar title="Alertas" dark={dark} onToggleTheme={onToggleTheme} />
      <div className="px-1 pt-2">
        <MapCard />
        <AlertList onOpen={onOpenAlert} />
      </div>
    </div>
  );
}

function DispatchScreen() {
  const items = [
    { id: 101, lugar: "Cristo Rey", estado: "En ruta" as const, prioridad: "Alta" as const, hace: "8 min" },
    { id: 102, lugar: "La Castilla", estado: "Recibido" as const, prioridad: "Media" as const, hace: "15 min" },
    { id: 103, lugar: "Km 18", estado: "Controlado" as const, prioridad: "Alta" as const, hace: "40 min" },
  ];
  type Estado = typeof items[number]['estado'];
  const filtros: ("Todos" | Estado)[] = ["Todos", "Recibido", "En ruta", "Controlado"];
  const [filtro, setFiltro] = useState<("Todos" | Estado)>("Todos");
  const vis = items.filter(i => filtro === "Todos" ? true : i.estado === filtro);
  const contadores = filtros.reduce<Record<string, number>>((acc, f) => { acc[f] = f === "Todos" ? items.length : items.filter(i => i.estado === f).length; return acc; }, {} as any);

  const Acciones = ({ estado }: { estado: Estado }) => {
    if (estado === "Controlado") return null; // nada
    if (estado === "En ruta") {
      return (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {/* Solo marcar controlado (primario peligro) */}
          <button className={`col-span-2 rounded-xl py-2 text-white hover:opacity-90 ${btnBase}`} style={{ background: danger }}>Marcar controlado</button>
        </div>
      );
    }
    // Recibido: Asignar brigada (primario) + Marcar controlado (secundario)
    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className={`rounded-xl py-2 text-white hover:opacity-90 ${btnBase}`} style={{ background: primary }}>Asignar brigada</button>
        <button className={`rounded-xl border py-2 text-sm hover:bg-slate-50 ${btnBase} text-main`}>Marcar controlado</button>
      </div>
    );
  };

  return (
    <div className="px-5 pb-28">
      <TopBar title="Panel de despacho" dark={false} />
      <div className="mt-2 grid grid-cols-3 gap-2">
        {filtros.slice(1).map((k) => (
          <div key={k} className="rounded-xl border p-2 text-center card">
            <div className="text-[11px] text-sub">{k}</div>
            <div className="text-lg font-semibold text-main">{contadores[k]}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {filtros.map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-2 rounded-full border text-sm hover:bg-slate-50 ${btnBase} ${f === filtro ? "shadow-inner" : ''} text-main`} style={f === filtro ? { background: accent + "55" } : undefined}>{f}</button>
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {vis.map(r => (
          <div key={r.id} className="rounded-2xl border p-3 card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-main">{r.lugar}</div>
              <div className="text-[11px] text-sub">{r.hace}</div>
            </div>
            <div className="mt-2 h-20 rounded-xl bg-[conic-gradient(at_top_left,_#e7f7d6,_#ffffff)]" />
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="px-2 py-1 rounded-full border">{r.estado}</span>
              <span className="px-2 py-1 rounded-full" style={{ background: r.prioridad === "Alta" ? danger + "22" : amber + "22", color: r.prioridad === "Alta" ? danger : amber }}>{r.prioridad}</span>
            </div>
            <Acciones estado={r.estado} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ role, setRole, dark, onToggleTheme, onLogout, onOpenVolunteer }: { role: Role; setRole: (r: Role) => void; dark: boolean; onToggleTheme: () => void; onLogout: () => void; onOpenVolunteer: () => void }) {
  const rows = [
    { t: "Insignias y logros", icon: <Trophy size={16} /> },
    { t: "Voluntariado", icon: <HandHeart size={16} /> },
    { t: "Ajustes", icon: <Settings size={16} /> },
  ];
  return (
    <div className="px-5 pb-28">
      <TopBar title="Perfil" dark={dark} onToggleTheme={onToggleTheme} />
      <div className="mt-3 rounded-3xl border p-4 card">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,#C5F65B,rgba(47,122,73,0.25))] border" />
          <div>
            <div className="font-semibold text-main">Valentina</div>
            <div className="text-xs text-sub">Guardabosques Nivel 2</div>
          </div>
          <div className="ml-auto text-[11px] px-2 py-1 rounded-full border chip">{role}</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl p-3 border text-center card">
            <div className="text-xs text-sub">Reportes</div>
            <div className="text-lg font-semibold text-main">4</div>
          </div>
          <div className="rounded-xl p-3 border text-center card">
            <div className="text-xs text-sub">Cursos</div>
            <div className="text-lg font-semibold text-main">3</div>
          </div>
          <div className="rounded-xl p-3 border text-center card">
            <div className="text-xs text-sub">Insignias</div>
            <div className="text-lg font-semibold text-main">2</div>
          </div>
        </div>
        <div className="mt-4 divide-y border rounded-2xl card">
          {rows.map((row, idx) => (
            <button
              key={idx}
              onClick={() => { if (row.t === "Voluntariado") onOpenVolunteer(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 ${btnBase}`}
            >
              <div className="w-8 h-8 rounded-xl grid place-items-center" style={{ background: accent }}>{row.icon}</div>
              <span className="flex-1 text-left text-main">{row.t}</span>
              <ChevronRight size={16} className="text-sub" />
            </button>
          ))}
        </div>
        <div className="mt-4">
          <div className="text-xs text-sub mb-2">Cambiar rol</div>
          <div className="grid grid-cols-3 gap-2">
            {(["ciudadano", "academia", "autoridad"] as Role[]).map(r => (
              <button key={r} onClick={() => setRole(r)} className={`rounded-xl py-2 text-sm border hover:bg-slate-50 ${btnBase} ${r === role ? "ring-2 ring-[--ring]" : ''}`} style={{ ['--ring' as any]: primary, background: r === role ? accent + "55" : undefined }}>{r}</button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onToggleTheme} className={`rounded-xl py-2 border hover:bg-slate-50 ${btnBase}`}>{dark ? "Modo claro" : "Modo oscuro"}</button>
          <button onClick={onLogout} className={`rounded-xl py-2 border hover:bg-slate-50 ${btnBase}`}>Cerrar sesión</button>
        </div>
      </div>
      <div className="mt-3 text-center text-xs text-sub">Emergencias: <b>119 Bomberos</b> · <b>123</b></div>
    </div>
  );
}

// ---------- Overlays ----------
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-white backdrop-blur-sm flex items-end">
      <div className="w-full rounded-t-3xl max-h-[85%] overflow-y-auto card">
        <div className="p-3 text-center">
          <div className="mx-auto h-1 w-10 rounded bg-slate-200" />
        </div>
        <div className="px-5 pb-6">{children}</div>
        <div className="p-4"><button onClick={onClose} className={`w-full rounded-xl border py-2 hover:bg-slate-50 ${btnBase}`}>Cerrar</button></div>
      </div>
    </div>
  );
}

function AlertDetail({ a }: { a: AlertItem }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ background: a.color }}><Flame /></div>
        <div>
          <div className="text-lg font-semibold text-main">{a.place}</div>
          <div className="text-xs text-sub">Nivel {a.level} · {a.time}</div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border p-3 h-48 card"></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className={`rounded-xl py-3 text-white hover:opacity-90 ${btnBase}`} style={{ background: danger }}><Phone size={16} className="inline mr-1" /> Llamar 119</button>
        <button className={`rounded-xl py-3 border hover:bg-slate-50 ${btnBase} text-main`}><Route size={16} className="inline mr-1" /> Ver ruta segura</button>
      </div>
      <div className="mt-3 text-xs text-sub">Información sugerida: dirección de viento, proximidad a viviendas, puntos de agua cercanos.</div>
    </div>
  );
}

function LessonOverlay() {
  return (
    <div>
      <div className="text-lg font-semibold text-main">Actuación segura</div>
      <div className="text-xs text-sub mb-3">3 pasos · 4 min</div>
      <ol className="space-y-2 text-sm text-main/90 list-decimal pl-5">
        <li>Llama al 119 y reporta ubicación exacta.</li>
        <li>Evita humo; aléjate ladera abajo y contra el viento.</li>
        <li>No intentes apagar focos grandes: prioriza tu seguridad y alerta a otros.</li>
      </ol>
      <div className="mt-4 h-2 rounded bg-slate-100"><div className="h-2 rounded" style={{ width: "33%", background: accent }} /></div>
      <button className={`mt-3 w-full rounded-xl py-2 text-white hover:opacity-90 ${btnBase}`} style={{ background: primary }}>Siguiente</button>
    </div>
  );
}

function CourseDetail() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: accent }}><Leaf size={18} /></div>
        <div>
          <div className="text-lg font-semibold text-main">Prevención en caminatas</div>
          <div className="text-xs text-sub">Curso · 8–10 min · 3 lecciones</div>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border p-3 card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl grid place-items-center bg-black/10"><PlayCircle size={20} /></div>
          <div>
            <div className="text-sm font-semibold text-main">Video: Antes de salir</div>
            <div className="text-[11px] text-sub">3:12 min</div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-sm font-medium text-main mb-2">Contenido</div>
        <div className="rounded-2xl border card divide-y">
          <div className="p-3">
            <div className="text-sm font-semibold text-main">1) Antes de salir</div>
            <ul className="list-disc pl-5 text-sm text-main/90 mt-1">
              <li>Revisa pronóstico y riesgo de incendio.</li>
              <li>Empaca agua, bolsa para residuos, silbato y linterna.</li>
              <li>Evita encender fogatas; usa rutas autorizadas.</li>
            </ul>
          </div>
          <div className="p-3">
            <div className="text-sm font-semibold text-main">2) Durante la caminata</div>
            <ul className="list-disc pl-5 text-sm text-main/90 mt-1">
              <li>No arrojes colillas ni vidrio; camina por sendero.</li>
              <li>Identifica rutas de evacuación y puntos de encuentro.</li>
              <li>Reporta con la app señales de humo o quemas.</li>
            </ul>
          </div>
          <div className="p-3">
            <div className="text-sm font-semibold text-main">3) Si ves humo</div>
            <ul className="list-disc pl-5 text-sm text-main/90 mt-1">
              <li>Aléjate contra el viento y llama al 119.</li>
              <li>Evita zonas con pendientes fuertes y vegetación seca.</li>
              <li>Prioriza tu seguridad; no intentes apagar focos grandes.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className={`rounded-xl py-2 text-white hover:opacity-90 ${btnBase}`} style={{ background: primary }}><PlayCircle size={16} className="inline mr-1" /> Iniciar</button>
        <button className={`rounded-xl py-2 border hover:bg-slate-50 ${btnBase} text-main`}><FileDown size={16} className="inline mr-1" /> Descargar checklist</button>
      </div>
    </div>
  );
}

function VolunteerOverlay({ onSubmitted }: { onSubmitted?: () => void }) {
  const [name, setName] = useState("Valentina");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<"brigada" | "logistica" | "primeros_auxilios">("brigada");
  const [days, setDays] = useState<string[]>([]);
  const [hours, setHours] = useState<"manana" | "tarde" | "noche" | "indiferente">("indiferente");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const toggleDay = (d: string) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const submit = () => {
    if (!name.trim()) return setErr("Ingresa tu nombre.");
    if (!/^[0-9+\s-]{7,}$/.test(phone)) return setErr("Ingresa un teléfono válido.");
    if (days.length === 0) return setErr("Selecciona al menos un día disponible.");
    setErr(null);
    // Aquí enviarías al backend; por ahora simulamos éxito:
    setOk(true);
    setTimeout(() => {
      onSubmitted?.();
      alert("¡Gracias! Te contactaremos para próximas activaciones.");
    }, 300);
  };

  const dayOptions = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div>
      <div className="text-lg font-semibold text-main">Voluntariado</div>
      <div className="text-xs text-sub mb-3">Ofrece tu ayuda como brigadista o apoyo logístico</div>

      <div className="rounded-2xl border p-4 card space-y-3">
        <div>
          <div className="text-xs text-sub mb-1">Nombre completo</div>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm text-main placeholder:text-sub"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <div className="text-xs text-sub mb-1">Teléfono de contacto</div>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm text-main placeholder:text-sub"
            placeholder="+57 300 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <div className="text-xs text-sub mb-1">Área de apoyo</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: "brigada", label: "Brigada" },
              { k: "logistica", label: "Logística" },
              { k: "primeros_auxilios", label: "Primeros auxilios" },
            ].map(opt => (
              <button
                key={opt.k}
                onClick={() => setArea(opt.k as any)}
                className={`rounded-xl py-2 text-sm border hover:bg-slate-50 transition ${area === opt.k ? "shadow-inner" : ""}`}
                style={area === opt.k ? { background: accent + "55" } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-sub mb-1">Días disponibles</div>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map(d => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-2 rounded-full border text-sm hover:bg-slate-50 transition ${active ? "shadow-inner" : ""}`}
                  style={active ? { background: accent + "55" } : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-sub mb-1">Horario</div>
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm text-main"
            value={hours}
            onChange={(e) => setHours(e.target.value as any)}
          >
            <option value="manana">Mañana (6–12)</option>
            <option value="tarde">Tarde (12–18)</option>
            <option value="noche">Noche (18–22)</option>
            <option value="indiferente">Indiferente</option>
          </select>
        </div>

        <div>
          <div className="text-xs text-sub mb-1">Comentario (opcional)</div>
          <textarea
            className="w-full h-20 rounded-xl border px-3 py-2 text-sm text-main placeholder:text-sub"
            placeholder="Ej: tengo experiencia en senderismo y primeros auxilios."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {err && <div className="text-xs text-red-600">{err}</div>}
        {ok && <div className="text-xs text-green-600">Enviado ✓</div>}

        <button
          onClick={submit}
          className="w-full rounded-xl py-3 text-white font-semibold hover:opacity-90 transition"
          style={{ background: "#2f7a49" }}
        >
          Ofrecerme como voluntaria/o
        </button>
        <div className="text-[11px] text-sub text-center">
          Tus datos se comparten solo con autoridades y coordinadores de brigada.
        </div>
      </div>
    </div>
  );
}


// ---- Tabs por rol ----
const baseTabs = {
  ciudadano: [
    { key: "home", label: "Inicio", icon: <Home size={18} /> },
    { key: "report", label: "Reportar", icon: <Flame size={18} /> },
    { key: "learn", label: "Educar", icon: <BookOpen size={18} /> },
    { key: "community", label: "Comunidad", icon: <Users size={18} /> },
    { key: "profile", label: "Perfil", icon: <User size={18} /> },
  ],
  academia: [
    { key: "home", label: "Inicio", icon: <Home size={18} /> },
    { key: "datalab", label: "Datos", icon: <BarChart3 size={18} /> },
    { key: "report", label: "Reportar", icon: <Flame size={18} /> },
    { key: "learn", label: "Educar", icon: <BookOpen size={18} /> },
    { key: "profile", label: "Perfil", icon: <User size={18} /> },
  ],
  autoridad: [
    { key: "alerts", label: "Alertas", icon: <Bell size={18} /> },
    { key: "home", label: "Mapa", icon: <Home size={18} /> },
    { key: "report", label: "Reportes", icon: <Flame size={18} /> },
    { key: "learn", label: "Protocolos", icon: <BookOpen size={18} /> },
    { key: "profile", label: "Perfil", icon: <User size={18} /> },
  ],
} as const;

type TabKey = typeof baseTabs[Role][number]["key"];

const defaultTabFor = (role: Role): TabKey => {
  switch (role) {
    case "autoridad": return "alerts" as TabKey;
    case "academia": return "datalab" as TabKey;
    default: return "home" as TabKey;
  }
};

// ---- DEV TESTS (smoke tests) ----
function DevTests({ tab, role }: { tab: string; role: Role }) {
  useEffect(() => {
    const tabs = baseTabs[role];
    const results: Array<{ test: string; pass: boolean; details?: string }> = [];
    results.push({ test: "role has 5 tabs", pass: tabs.length === 5, details: role });
    results.push({ test: "tab valid for role", pass: tabs.some(t => t.key === tab), details: tab });
    results.push({ test: "alerts not empty", pass: alerts.length > 0, details: String(alerts.length) });
    results.push({ test: "series has points", pass: series.length >= 3, details: String(series.length) });
    console.table(results);
  }, [tab, role]);
  return null;
}

// ---- Login (usuario + contraseña, sin localStorage) ----
function LoginScreen({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const tryLogin = () => {
    if (!username || !password) { setErr("Ingresa usuario y contraseña"); return; }
    if (password.length < 4) { setErr("Contraseña muy corta"); return; }
    onLogin(username);
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 px-6 pt-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full border chip">
            <Compass size={14} /> Guardadianes del fuego
          </div>
          <h1 className="text-2xl font-semibold mt-4 text-main">Bienvenida</h1>
          <p className="text-sub text-sm mt-1">Inicia sesión para continuar</p>
        </div>
        <input value={username} onChange={e => { setUsername(e.target.value); setErr(null); }} placeholder="Usuario" className="w-full rounded-xl border px-4 py-3 text-sm mb-2 text-main placeholder:text-sub" />
        <input value={password} onChange={e => { setPassword(e.target.value); setErr(null); }} placeholder="Contraseña" type="password" className="w-full rounded-xl border px-4 py-3 text-sm text-main placeholder:text-sub" />
        {err && <div className="text-xs text-red-600 mt-2">{err}</div>}
        <button onClick={tryLogin} className={`mt-4 w-full rounded-xl py-3 text-white hover:opacity-90 ${btnBase}`} style={{ background: primary }}>Entrar</button>
      </div>
      <div className="p-5 border-t card">
        <div className="text-xs text-sub text-center">¿Olvidaste tu contraseña? <a className="underline" href="#">Recuperar</a></div>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<Role>("ciudadano");
  const [tab, setTab] = useState<TabKey>("home" as TabKey);
  const [overlay, setOverlay] = useState<null | { type: "alert"; a: AlertItem } | { type: "lesson" } | { type: "course" } | { type: "volunteer" }>(null);
  const [dark, setDark] = useState(false);

  const tabs = baseTabs[role];

  const handleLogin = (user: string) => {
    setLoggedIn(true);
    setUsername(user);
    console.log("Usuario:", username);
    setRole("ciudadano"); // rol por defecto; se edita en Perfil
    setTab(defaultTabFor("ciudadano"));
  };

  const renderTab = () => {
    switch (tab) {
      case "home":
        return <HomeScreen role={role} dark={dark} onToggleTheme={() => setDark(d => !d)} onOpenAlert={(a) => setOverlay({ type: "alert", a })} />;
      case "report":
        return role === "autoridad" ? <DispatchScreen /> : <ReportScreen />;
      case "learn":
        return <LearnScreen dark={dark} onToggleTheme={() => setDark(d => !d)} onStartLesson={() => setOverlay({ type: "lesson" })} onOpenCourse={() => setOverlay({ type: "course" })} />;
      case "community":
        return <CommunityScreen dark={dark} onToggleTheme={() => setDark(d => !d)} />;
      case "datalab":
        return <DataLabScreen dark={dark} onToggleTheme={() => setDark(d => !d)} />;
      case "alerts":
        return <AlertsScreen dark={dark} onToggleTheme={() => setDark(d => !d)} onOpenAlert={(a) => setOverlay({ type: "alert", a })} />;
      case "profile":
        return <ProfileScreen
          dark={dark}
          onToggleTheme={() => setDark(d => !d)}
          role={role}
          setRole={(r) => { setRole(r); setTab(defaultTabFor(r)); }}
          onLogout={() => { setLoggedIn(false); setUsername(""); setRole("ciudadano"); setTab("home" as TabKey); }}
          onOpenVolunteer={() => setOverlay({ type: "volunteer" })}      // <--- NUEVO
        />
      default:
        return null;
    }
  };

  if (!loggedIn) {
    return (
      <MobileFrame dark={dark}>
        <LoginScreen onLogin={handleLogin} />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame dark={dark}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {renderTab()}
        </div>
        {/* Bottom Navigation */}
        <nav className="h-20 bg-white/90 backdrop-blur border-t flex items-center justify-around px-2 sticky bottom-0 bar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabKey)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl hover:bg-slate-50 ${btnBase} ${tab === t.key ? "shadow-inner" : ""}`}
              style={tab === t.key ? { background: accent + "40" } : undefined}
            >
              <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: tab === t.key ? accent : "#f1f5f9", color: tab === t.key ? ink : "#334155" }}>{t.icon}</div>
              <span className="text-[11px] text-main">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* App brand chip */}
      <div className="absolute top-8 left-5 text-xs px-2 py-1 rounded-full border chip">Guardianes del fuego</div>
      {/* Overlays */}
      {overlay?.type === "alert" && (
        <Overlay onClose={() => setOverlay(null)}>
          <AlertDetail a={overlay.a} />
        </Overlay>
      )}
      {overlay?.type === "lesson" && (
        <Overlay onClose={() => setOverlay(null)}>
          <LessonOverlay />
        </Overlay>
      )}
      {overlay?.type === "course" && (
        <Overlay onClose={() => setOverlay(null)}>
          <CourseDetail />
        </Overlay>
      )}
      {overlay?.type === "volunteer" && (
        <Overlay onClose={() => setOverlay(null)}>
          <VolunteerOverlay onSubmitted={() => setOverlay(null)} />
        </Overlay>
      )}

      {/* Run smoke tests */}
      <DevTests tab={tab} role={role} />
    </MobileFrame>
  );
}
