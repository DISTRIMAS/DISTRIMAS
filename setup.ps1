# ═══════════════════════════════════════════════
# DISTRIMAS SC - Script de configuracion completa
# Ejecutar desde la carpeta raiz del proyecto:
# PS C:\Users\USUARIO\distrimas-sc> .\setup.ps1
# ═══════════════════════════════════════════════

Write-Host "Creando archivos del proyecto Distrimas SC..." -ForegroundColor Cyan

# ── app/page.tsx ────────────────────────────────
@'
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/login')
}
'@ | Set-Content -Encoding UTF8 "app/page.tsx"

# ── app/layout.tsx ──────────────────────────────
@'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Distrimas SC',
  description: 'Sistema de Gestion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
'@ | Set-Content -Encoding UTF8 "app/layout.tsx"

# ── lib/supabase.ts ─────────────────────────────
@'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
'@ | Set-Content -Encoding UTF8 "lib/supabase.ts"

# ── lib/types.ts ────────────────────────────────
@'
export interface Permisos {
  dashboard: boolean
  pedidos: boolean
  clientes: boolean
  inventario: boolean
  usuarios: boolean
  perfiles: boolean
  estadisticas: boolean
}
export interface Perfil {
  id: string
  nombre: string
  descripcion: string
  permisos: Permisos
}
export interface Usuario {
  id: string
  nombre: string
  documento: string
  telefono: string
  usuario: string
  perfil_id: string
  activo: boolean
  primer_ingreso: boolean
  created_at: string
  perfil?: Perfil
}
export interface Cliente {
  id: string
  codigo: string
  nombre: string
  municipio: string
  barrio: string
  direccion: string
  telefono: string
  activo: boolean
  created_at: string
}
export interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  unidad: string
  precio: number
  stock: number
  stock_minimo: number
  activo: boolean
}
export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto?: Producto
}
export interface Pedido {
  id: string
  cliente_id: string
  usuario_id: string
  estado: 'borrador' | 'confirmado' | 'entregado' | 'cancelado'
  observaciones: string
  total: number
  created_at: string
  cliente?: Cliente
  usuario?: Usuario
  items?: PedidoItem[]
}
'@ | Set-Content -Encoding UTF8 "lib/types.ts"

# ── lib/auth.ts ─────────────────────────────────
@'
import { supabase } from './supabase'
import { Usuario } from './types'

export async function login(usuario: string, password: string): Promise<{ data: Usuario | null, error: string | null }> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, perfil:perfiles(*)')
    .eq('usuario', usuario)
    .eq('activo', true)
    .single()

  if (error || !data) return { data: null, error: 'Usuario o contrasena incorrectos' }
  if (data.password_hash !== password) return { data: null, error: 'Usuario o contrasena incorrectos' }

  localStorage.setItem('distrimas_user', JSON.stringify(data))
  return { data, error: null }
}

export function getSession(): Usuario | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('distrimas_user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function logout() {
  localStorage.removeItem('distrimas_user')
}

export function hasPermission(usuario: Usuario, modulo: string): boolean {
  const permisos = usuario.perfil?.permisos
  if (!permisos) return false
  return permisos[modulo as keyof typeof permisos] === true
}
'@ | Set-Content -Encoding UTF8 "lib/auth.ts"

# ── app/(auth)/login/page.tsx ───────────────────
New-Item -ItemType Directory -Force -Path "app/(auth)/login" | Out-Null
@'
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError("")
    if (!usuario.trim()) { setError("Por favor ingresa tu usuario"); return }
    if (!password.trim()) { setError("Por favor ingresa tu contrasena"); return }
    setLoading(true)
    const { data, error: err } = await login(usuario.trim(), password)
    setLoading(false)
    if (err || !data) { setError(err || "Error al iniciar sesion"); return }
    router.push("/dashboard")
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F1117",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"44px 44px"}} />
      <div style={{position:"absolute",top:"-200px",right:"-100px",width:"600px",height:"600px",borderRadius:"50%",background:"radial-gradient(circle,rgba(215,38,56,0.15) 0%,transparent 65%)"}} />
      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:"420px",margin:"0 16px",background:"#171B25",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"20px",padding:"40px 44px",boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"36px"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"#D72638",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"bold",fontSize:"20px",flexShrink:0}}>D</div>
          <div>
            <p style={{fontWeight:"bold",color:"white",fontSize:"18px",margin:0}}>Distrimas SC</p>
            <p style={{color:"#8B91A8",fontSize:"12px",margin:0}}>Sistema de Gestion</p>
          </div>
        </div>
        <h1 style={{fontSize:"26px",fontWeight:"bold",color:"white",margin:"0 0 6px"}}>Bienvenido</h1>
        <p style={{color:"#8B91A8",fontSize:"14px",margin:"0 0 32px"}}>Ingresa tus credenciales para continuar</p>
        {error && <div style={{background:"rgba(215,38,56,0.1)",border:"1px solid rgba(215,38,56,0.25)",color:"#F04455",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",marginBottom:"16px"}}>{error}</div>}
        <div style={{marginBottom:"20px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"bold",color:"#8B91A8",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:"8px"}}>Usuario</label>
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} onKeyDown={e => e.key==="Enter" && document.getElementById("inp-pass")?.focus()} placeholder="Tu usuario"
            style={{width:"100%",padding:"13px 14px",background:"#1E2330",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:"8px",color:"white",fontSize:"15px",outline:"none",boxSizing:"border-box"}} />
        </div>
        <div style={{marginBottom:"24px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"bold",color:"#8B91A8",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:"8px"}}>Contrasena</label>
          <input id="inp-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="********"
            style={{width:"100%",padding:"13px 14px",background:"#1E2330",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:"8px",color:"white",fontSize:"15px",outline:"none",boxSizing:"border-box"}} />
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"14px",background:"#D72638",color:"white",fontWeight:"600",fontSize:"15px",borderRadius:"8px",border:"none",cursor:"pointer",opacity:loading?0.6:1}}>
          {loading ? "Iniciando sesion..." : "Iniciar sesion"}
        </button>
      </div>
    </div>
  )
}
'@ | Set-Content -Encoding UTF8 "app/(auth)/login/page.tsx"

# ── app/(dashboard)/layout.tsx ──────────────────
New-Item -ItemType Directory -Force -Path "app/(dashboard)" | Out-Null
@'
"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSession, logout } from "@/lib/auth"
import { Usuario } from "@/lib/types"

const MENUS_ADMIN = [
  { section: "Principal" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "pedidos", label: "Pedidos", href: "/dashboard/pedidos" },
  { id: "estadisticas", label: "Estadisticas", href: "/dashboard/estadisticas" },
  { section: "Gestion" },
  { id: "clientes", label: "Clientes", href: "/dashboard/clientes" },
  { id: "inventario", label: "Inventario", href: "/dashboard/inventario" },
  { section: "Administracion" },
  { id: "usuarios", label: "Usuarios", href: "/dashboard/usuarios" },
  { id: "perfiles", label: "Perfiles", href: "/dashboard/perfiles" },
]

const MENUS_VENDEDOR = [
  { section: "Principal" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "nuevo-pedido", label: "Nuevo pedido", href: "/dashboard/pedidos/nuevo" },
  { id: "mis-pedidos", label: "Mis pedidos", href: "/dashboard/pedidos" },
  { section: "Clientes" },
  { id: "clientes", label: "Clientes", href: "/dashboard/clientes" },
  { section: "Consulta" },
  { id: "inventario", label: "Inventario", href: "/dashboard/inventario" },
]

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/pedidos": "Pedidos",
  "/dashboard/pedidos/nuevo": "Nuevo pedido",
  "/dashboard/clientes": "Clientes",
  "/dashboard/inventario": "Inventario",
  "/dashboard/usuarios": "Usuarios",
  "/dashboard/perfiles": "Perfiles y permisos",
  "/dashboard/estadisticas": "Estadisticas",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<Usuario | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fecha, setFecha] = useState("")

  useEffect(() => {
    const session = getSession()
    if (!session) { router.push("/login"); return }
    setUser(session)
    const fmt = () => new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    setFecha(fmt())
    const interval = setInterval(() => setFecha(fmt()), 60000)
    return () => clearInterval(interval)
  }, [router])

  if (!user) return null

  const isAdmin = user.perfil?.nombre === "Administrador"
  const menus = isAdmin ? MENUS_ADMIN : MENUS_VENDEDOR
  const bg = darkMode ? "#0F1117" : "#F4F5F8"
  const sbBg = darkMode ? "#171B25" : "#FFFFFF"
  const border = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const itemBg = darkMode ? "#1E2330" : "#ECEEF4"

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bg, color: darkMode ? "#F0F2F7" : "#141720", fontFamily: "system-ui, sans-serif" }}>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 99 }} />}

      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "260px", background: sbBg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px 16px", borderBottom: `1px solid ${border}` }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#D72638", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>D</div>
          <div>
            <p style={{ fontWeight: "bold", fontSize: "14px", margin: 0 }}>Distrimas SC</p>
            <p style={{ color: "#8B91A8", fontSize: "11px", margin: 0 }}>Panel de gestion</p>
          </div>
        </div>

        <div style={{ margin: "12px", padding: "10px 12px", borderRadius: "8px", background: itemBg, border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#D72638", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "13px", flexShrink: 0 }}>
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: "600", fontSize: "13px", margin: 0 }}>{user.nombre}</p>
            <p style={{ color: "#8B91A8", fontSize: "11px", margin: 0 }}>{isAdmin ? "Administrador" : "Vendedor"}</p>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {menus.map((item, i) => {
            if ("section" in item) return <p key={i} style={{ padding: "16px 18px 6px", fontSize: "10px", fontWeight: "bold", color: "#555C74", textTransform: "uppercase", letterSpacing: "1.2px", margin: 0 }}>{item.section}</p>
            const active = pathname === item.href
            return (
              <div key={item.id} onClick={() => { router.push(item.href!); setSidebarOpen(false) }}
                style={{ position: "relative", display: "flex", alignItems: "center", gap: "10px", margin: "2px 8px", padding: "9px 12px", borderRadius: "8px", fontSize: "13.5px", fontWeight: active ? 600 : 500, color: active ? "#D72638" : "#8B91A8", background: active ? "rgba(215,38,56,0.12)" : "transparent", cursor: "pointer" }}>
                {active && <span style={{ position: "absolute", left: "-8px", top: "50%", transform: "translateY(-50%)", width: "3px", height: "60%", background: "#D72638", borderRadius: "99px" }} />}
                {item.label}
              </div>
            )
          })}
        </nav>

        <div style={{ padding: "12px", borderTop: `1px solid ${border}` }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", fontSize: "13.5px", color: "#8B91A8", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
            {darkMode ? "Modo claro" : "Modo oscuro"}
            <div style={{ marginLeft: "auto", width: "36px", height: "20px", borderRadius: "99px", background: darkMode ? "#1E2330" : "#D72638", border: `1px solid ${border}`, position: "relative" }}>
              <span style={{ position: "absolute", width: "14px", height: "14px", borderRadius: "50%", top: "2px", left: darkMode ? "2px" : "18px", background: darkMode ? "#555C74" : "#fff", transition: "left 0.2s" }} />
            </div>
          </button>
          <button onClick={() => { logout(); router.push("/login") }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", fontSize: "13.5px", color: "#8B91A8", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: "260px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{ height: "64px", background: sbBg, borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: "16px", position: "sticky", top: 0, zIndex: 50 }}>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>{PAGE_TITLES[pathname] || "Dashboard"}</span>
          <span style={{ marginLeft: "auto", fontSize: "12px", color: "#8B91A8", textTransform: "capitalize" }}>{fecha}</span>
        </header>
        <div style={{ padding: "28px", flex: 1 }}>{children}</div>
      </main>
    </div>
  )
}
'@ | Set-Content -Encoding UTF8 "app/(dashboard)/layout.tsx"

# ── app/(dashboard)/page.tsx ────────────────────
@'
"use client"
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Usuario } from "@/lib/types"

export default function DashboardPage() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [stats, setStats] = useState({ pedidosHoy: 0, tiendasActivas: 0, productosStockBajo: 0, totalMes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    setUser(session)
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const hoy = new Date().toISOString().split("T")[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const [pedidosHoy, clientes, stockBajo, totalMes] = await Promise.all([
      supabase.from("pedidos").select("id", { count: "exact" }).gte("created_at", hoy),
      supabase.from("clientes").select("id", { count: "exact" }).eq("activo", true),
      supabase.from("productos").select("id", { count: "exact" }).eq("activo", true).lt("stock", 10),
      supabase.from("pedidos").select("total").gte("created_at", inicioMes),
    ])
    const total = totalMes.data?.reduce((acc: number, p: { total: number }) => acc + (p.total || 0), 0) || 0
    setStats({ pedidosHoy: pedidosHoy.count || 0, tiendasActivas: clientes.count || 0, productosStockBajo: stockBajo.count || 0, totalMes: total })
    setLoading(false)
  }

  const isAdmin = user?.perfil?.nombre === "Administrador"
  const cards = [
    { label: "Pedidos hoy", value: stats.pedidosHoy, bg: "rgba(215,38,56,0.12)" },
    { label: "Tiendas activas", value: stats.tiendasActivas, bg: "rgba(59,130,246,0.12)" },
    { label: "Total pedidos mes", value: "$" + stats.totalMes.toLocaleString("es-CO"), bg: "rgba(34,197,94,0.12)" },
    { label: "Productos stock bajo", value: stats.productosStockBajo, bg: "rgba(245,158,11,0.12)", delta: stats.productosStockBajo > 0 ? "Requiere atencion" : "Todo en orden", dc: stats.productosStockBajo > 0 ? "#f87171" : "#22c55e" },
  ]

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 6px" }}>Hola, {user?.nombre?.split(" ")[0]}</h2>
        <p style={{ color: "#8B91A8", fontSize: "14px", margin: 0 }}>{isAdmin ? "Aqui tienes el resumen del sistema" : "Aqui tienes tu actividad del dia"}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px", marginBottom: "32px" }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "22px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: card.bg, marginBottom: "14px" }} />
            <div style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "4px" }}>{loading ? "-" : card.value}</div>
            <div style={{ fontSize: "13px", color: "#8B91A8" }}>{card.label}</div>
            {"delta" in card && card.delta && <div style={{ fontSize: "12px", color: card.dc, marginTop: "6px" }}>{card.delta}</div>}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>{isAdmin ? "Resumen del sistema" : "Mi actividad"}</p>
      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "56px", textAlign: "center", color: "#555C74" }}>
        <p style={{ fontSize: "14px", margin: 0 }}>{isAdmin ? "Aqui iran las graficas y estadisticas completas" : "Aqui veras tus pedidos recientes"}</p>
      </div>
    </div>
  )
}
'@ | Set-Content -Encoding UTF8 "app/(dashboard)/page.tsx"

# ── Modulos placeholder ──────────────────────────
$modulos = @{
  "app/(dashboard)/clientes/page.tsx" = "ClientesPage"
  "app/(dashboard)/inventario/page.tsx" = "InventarioPage"
  "app/(dashboard)/pedidos/page.tsx" = "PedidosPage"
  "app/(dashboard)/pedidos/nuevo/page.tsx" = "NuevoPedidoPage"
  "app/(dashboard)/usuarios/page.tsx" = "UsuariosPage"
  "app/(dashboard)/perfiles/page.tsx" = "PerfilesPage"
  "app/(dashboard)/estadisticas/page.tsx" = "EstadisticasPage"
}

foreach ($path in $modulos.Keys) {
  $name = $modulos[$path]
  $folder = Split-Path $path
  New-Item -ItemType Directory -Force -Path $folder | Out-Null
  $content = "export default function $name() { return <div style={{background:'#171B25',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'56px',textAlign:'center',color:'#555C74'}}><p style={{fontSize:'14px',margin:0}}>Modulo en construccion</p></div> }"
  [System.IO.File]::WriteAllText((Resolve-Path ".").Path + "\" + $path.Replace("/","\"), $content, [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "Listo! Ahora ejecuta: npm run dev" -ForegroundColor Green
