"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSession, logout } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Usuario } from "@/lib/types"

const PASOS_TUTORIAL = [
  { titulo: "Bienvenido a Distrimas SC", desc: "Este es tu panel de gestión. Desde aquí podrás tomar pedidos, consultar clientes y revisar el inventario." },
  { titulo: "Tus clientes", desc: "En la sección Clientes encuentras todas las tiendas asignadas. Puedes buscar por nombre, municipio o código." },
  { titulo: "Crear un pedido", desc: "Ve a Pedidos → Nuevo pedido. Busca la tienda, agrega los productos y confirma. Así de fácil." },
  { titulo: "Consultar inventario", desc: "En Inventario ves el stock actual de cada producto. Los que aparecen en amarillo tienen stock bajo." },
  { titulo: "¡Listo para empezar!", desc: "Ya conoces lo básico. Si tienes dudas, consulta con tu administrador. ¡Mucho éxito!" },
]

function Tutorial({ user, onClose }: { user: Usuario; onClose: () => void }) {
  const [paso, setPaso] = useState(0)
  const p = PASOS_TUTORIAL[paso]
  const ultimo = paso === PASOS_TUTORIAL.length - 1

  async function finalizar() {
    await supabase.from("usuarios").update({ primer_ingreso: false }).eq("id", user.id)
    const raw = localStorage.getItem("distrimas_user")
    if (raw) {
      const u = JSON.parse(raw)
      localStorage.setItem("distrimas_user", JSON.stringify({ ...u, primer_ingreso: false }))
    }
    onClose()
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "40px", width: "100%", maxWidth: "460px", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#D72638", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "24px" }}>👋</div>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 10px" }}>{p.titulo}</h3>
        <p style={{ color: "#8B91A8", fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px" }}>{p.desc}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "28px" }}>
          {PASOS_TUTORIAL.map((_, i) => (
            <div key={i} style={{ width: i === paso ? "20px" : "8px", height: "8px", borderRadius: "99px", background: i === paso ? "#D72638" : "#2A3044", transition: "width 0.3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {paso > 0 && <button onClick={() => setPaso(p2 => p2 - 1)} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Anterior</button>}
          <button onClick={ultimo ? finalizar : () => setPaso(p2 => p2 + 1)} style={{ flex: 1, padding: "11px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            {ultimo ? "¡Comenzar!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  )
}

const MENUS_ADMIN = [
  { section: "Principal" },
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "pedidos", label: "Pedidos", href: "/pedidos" },
  { id: "estadisticas", label: "Estadisticas", href: "/estadisticas" },
  { section: "Gestion" },
  { id: "clientes", label: "Clientes", href: "/clientes" },
  { id: "inventario", label: "Inventario", href: "/inventario" },
  { section: "Administracion" },
  { id: "usuarios", label: "Usuarios", href: "/usuarios" },
  { id: "perfiles", label: "Perfiles", href: "/perfiles" },
]

const MENUS_VENDEDOR = [
  { section: "Principal" },
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "nuevo-pedido", label: "Nuevo pedido", href: "/pedidos/nuevo" },
  { id: "mis-pedidos", label: "Mis pedidos", href: "/pedidos" },
  { section: "Clientes" },
  { id: "clientes", label: "Clientes", href: "/clientes" },
  { section: "Consulta" },
  { id: "inventario", label: "Inventario", href: "/inventario" },
]

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/pedidos": "Pedidos",
  "/pedidos/nuevo": "Nuevo pedido",
  "/clientes": "Clientes",
  "/inventario": "Inventario",
  "/usuarios": "Usuarios",
  "/perfiles": "Perfiles y permisos",
  "/estadisticas": "Estadisticas",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<Usuario | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fecha, setFecha] = useState("")
  const [tutorial, setTutorial] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) { router.push("/login"); return }
    setUser(session)
    if (session.primer_ingreso && session.perfil?.nombre !== "Administrador") setTutorial(true)
    const fmt = () => new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    setFecha(fmt())
    const interval = setInterval(() => setFecha(fmt()), 60000)
    return () => clearInterval(interval)
  }, [router])

  if (!user) return null
  if (tutorial) return <Tutorial user={user} onClose={() => setTutorial(false)} />

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
