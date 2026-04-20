"use client"
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Usuario } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts"

const COLORS = ["#D72638", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"]

interface TopItem  { nombre: string; total: number; cantidad: number }
interface DiaItem  { dia: string; pedidos: number }

interface Stats {
  pedidosHoy: number
  pedidosAyer: number
  ventasMes: number
  tiendasActivas: number
  stockBajo: number
}

export default function DashboardPage() {
  const theme = useTheme()
  const [user, setUser]                   = useState<Usuario | null>(null)
  const [stats, setStats]                 = useState<Stats>({ pedidosHoy: 0, pedidosAyer: 0, ventasMes: 0, tiendasActivas: 0, stockBajo: 0 })
  const [topVendedores, setTopVendedores] = useState<TopItem[]>([])
  const [topProductos, setTopProductos]   = useState<TopItem[]>([])
  const [topTiendas, setTopTiendas]       = useState<(TopItem & { municipio: string })[]>([])
  const [diasData, setDiasData]           = useState<DiaItem[]>([])
  const [recientes, setRecientes]         = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [alertaStock, setAlertaStock]     = useState<{ agotados: any[]; bajos: any[] }>({ agotados: [], bajos: [] })
  const [alertaCerrada, setAlertaCerrada] = useState(false)

  useEffect(() => {
    const session = getSession()
    setUser(session)
    loadAll(session)
  }, [])

  async function loadAll(session: Usuario | null) {
    setLoading(true)
    const col = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
    const hoy       = col(new Date()) + "T00:00:00-05:00"
    const manana    = col(new Date(Date.now() + 86400000)) + "T00:00:00-05:00"
    const ayer      = col(new Date(Date.now() - 86400000)) + "T00:00:00-05:00"
    const inicioMes = col(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) + "T00:00:00-05:00"
    const hace30    = col(new Date(Date.now() - 30 * 86400000)) + "T00:00:00-05:00"

    const isAdmin = session?.perfil?.nombre === "Administrador"

    const [
      { count: pedidosHoy },
      { count: pedidosAyer },
      { data: pedidosMes },
      { count: tiendas },
      { data: bajo },
      { data: pedidos30 },
      { data: recientesRaw },
    ] = await Promise.all([
      supabase.from("pedidos").select("id", { count: "exact", head: true }).gte("created_at", hoy).lt("created_at", manana),
      supabase.from("pedidos").select("id", { count: "exact", head: true }).gte("created_at", ayer).lt("created_at", hoy),
      supabase.from("pedidos").select("total, usuario:usuarios(nombre), cliente:clientes(nombre, municipio), items:pedido_items(cantidad, precio_unitario, producto:productos(nombre))").gte("created_at", inicioMes).neq("estado", "cancelado"),
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("activo", true),
      supabase.from("productos").select("id,nombre,stock,stock_minimo").eq("activo", true),
      supabase.from("pedidos").select("created_at").gte("created_at", hace30).neq("estado", "cancelado"),
      supabase.from("pedidos").select("id, total, estado, created_at, cliente:clientes(nombre), usuario:usuarios(nombre)").order("created_at", { ascending: false }).limit(5),
    ])

    // Alertas de stock
    const todosProductos = bajo || []
    const agotados = todosProductos.filter((p: any) => p.stock <= 0)
    const bajos    = todosProductos.filter((p: any) => p.stock > 0 && p.stock < p.stock_minimo)
    setAlertaStock({ agotados, bajos })
    setAlertaCerrada(false)

    // Ventas del mes
    const ventasMes = (pedidosMes || []).reduce((a: number, p: any) => a + (p.total || 0), 0)

    // Top vendedores
    const vendMap: Record<string, TopItem> = {}
    ;(pedidosMes || []).forEach((p: any) => {
      const nombre = (p.usuario as any)?.nombre || "Desconocido"
      if (!vendMap[nombre]) vendMap[nombre] = { nombre, total: 0, cantidad: 0 }
      vendMap[nombre].total    += p.total || 0
      vendMap[nombre].cantidad += 1
    })

    // Top tiendas
    const tiendaMap: Record<string, TopItem & { municipio: string }> = {}
    ;(pedidosMes || []).forEach((p: any) => {
      const c      = p.cliente as any
      const nombre = c?.nombre || "Desconocida"
      if (!tiendaMap[nombre]) tiendaMap[nombre] = { nombre, municipio: c?.municipio || "", total: 0, cantidad: 0 }
      tiendaMap[nombre].total    += p.total || 0
      tiendaMap[nombre].cantidad += 1
    })

    // Top productos
    const prodMap: Record<string, TopItem> = {}
    ;(pedidosMes || []).forEach((p: any) => {
      ;(p.items || []).forEach((item: any) => {
        const nombre = item.producto?.nombre || "Desconocido"
        if (!prodMap[nombre]) prodMap[nombre] = { nombre, total: 0, cantidad: 0 }
        prodMap[nombre].total    += item.cantidad * item.precio_unitario
        prodMap[nombre].cantidad += item.cantidad
      })
    })

    // Pedidos por día (últimos 30 días)
    const diaMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
      diaMap[d] = 0
    }
    ;(pedidos30 || []).forEach((p: any) => {
      const d = new Date(p.created_at).toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
      if (d in diaMap) diaMap[d]++
    })

    const sort = <T extends TopItem>(m: Record<string, T>) =>
      Object.values(m).sort((a, b) => b.total - a.total).slice(0, 5)

    setStats({ pedidosHoy: pedidosHoy || 0, pedidosAyer: pedidosAyer || 0, ventasMes, tiendasActivas: tiendas || 0, stockBajo: agotados.length + bajos.length })
    setTopVendedores(sort(vendMap))
    setTopTiendas(sort(tiendaMap as any) as any)
    setTopProductos(sort(prodMap))
    setDiasData(Object.entries(diaMap).map(([dia, pedidos]) => ({ dia: dia.slice(5), pedidos })))
    setRecientes(recientesRaw || [])
    setLoading(false)
  }

  const isAdmin = user?.perfil?.nombre === "Administrador"
  const pctVsAyer = stats.pedidosAyer === 0
    ? null
    : Math.round(((stats.pedidosHoy - stats.pedidosAyer) / stats.pedidosAyer) * 100)

  const COLOR_ESTADO: Record<string, { bg: string; color: string }> = {
    borrador:   { bg: "rgba(107,114,128,0.15)", color: "#6B7280" },
    confirmado: { bg: "rgba(59,130,246,0.15)",  color: "#3b82f6" },
    entregado:  { bg: "rgba(34,197,94,0.15)",   color: "#16a34a" },
    cancelado:  { bg: "rgba(215,38,56,0.15)",   color: "#D72638" },
  }

  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "14px",
    padding: "20px",
    boxShadow: theme.dark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
  }

  const sectionTitle = { fontSize: "14px", fontWeight: "bold" as const, color: theme.text, margin: "0 0 16px" }

  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: theme.text, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        <p style={{ margin: 0, color: "#D72638" }}>{payload[0].value} pedidos</p>
      </div>
    )
  }

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: theme.text, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
        <p style={{ margin: 0, color: "#D72638" }}>${payload[0].value.toLocaleString("es-CO")}</p>
      </div>
    )
  }

  const totalProd = topProductos.reduce((a, p) => a + p.total, 0) || 1

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${theme.border}`, borderTopColor: "#D72638", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: theme.muted, fontSize: "14px" }}>Cargando dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Banner de alertas de stock — persistente hasta reponer */}
      {!alertaCerrada && (alertaStock.agotados.length > 0 || alertaStock.bajos.length > 0) && (
        <div style={{
          background: alertaStock.agotados.length > 0 ? "rgba(215,38,56,0.08)" : "rgba(245,158,11,0.08)",
          border: `1px solid ${alertaStock.agotados.length > 0 ? "rgba(215,38,56,0.3)" : "rgba(245,158,11,0.3)"}`,
          borderRadius: "12px", padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px", color: alertaStock.agotados.length > 0 ? "#D72638" : "#d97706" }}>
                {alertaStock.agotados.length > 0 ? "🚨 Productos agotados y con stock bajo" : "⚠️ Productos con stock bajo"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {alertaStock.agotados.map((p: any) => (
                  <span key={p.id} style={{ padding: "4px 10px", background: "rgba(215,38,56,0.12)", color: "#D72638", borderRadius: "99px", fontSize: "12px", fontWeight: 600 }}>
                    🔴 {p.nombre} — AGOTADO
                  </span>
                ))}
                {alertaStock.bajos.map((p: any) => (
                  <span key={p.id} style={{ padding: "4px 10px", background: "rgba(245,158,11,0.12)", color: "#d97706", borderRadius: "99px", fontSize: "12px", fontWeight: 600 }}>
                    🟡 {p.nombre} — {p.stock} uds.
                  </span>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: theme.muted, margin: "10px 0 0" }}>
                Esta alerta se mantendrá visible hasta que el inventario sea actualizado.
              </p>
            </div>
            <button onClick={() => setAlertaCerrada(true)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.muted, fontSize: "18px", padding: "0", flexShrink: 0, lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}

      {/* Saludo */}
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 4px", color: theme.text }}>
          Hola, {user?.nombre?.split(" ")[0]} 👋
        </h2>
        <p style={{ color: theme.muted, fontSize: "13px", margin: 0 }}>
          {isAdmin ? "Resumen general del sistema" : "Tu actividad de hoy"}
        </p>
      </div>

      {/* ── TARJETAS SUPERIORES ── */}
      <div className="cards-grid">
        {/* Pedidos hoy */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>Pedidos hoy</p>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(215,38,56,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📦</div>
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 6px", color: theme.text }}>{stats.pedidosHoy}</p>
          {pctVsAyer !== null && (
            <p style={{ fontSize: "12px", margin: 0, color: pctVsAyer >= 0 ? "#16a34a" : "#D72638", fontWeight: 600 }}>
              {pctVsAyer >= 0 ? "▲" : "▼"} {Math.abs(pctVsAyer)}% vs ayer
            </p>
          )}
        </div>

        {/* Ventas del mes */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>Ventas del mes</p>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>💰</div>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 6px", color: theme.text }}>${stats.ventasMes.toLocaleString("es-CO")}</p>
          <p style={{ fontSize: "12px", margin: 0, color: theme.muted }}>Mes actual · sin cancelados</p>
        </div>

        {/* Tiendas activas */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>Tiendas activas</p>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏪</div>
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 6px", color: theme.text }}>{stats.tiendasActivas}</p>
          <p style={{ fontSize: "12px", margin: 0, color: theme.muted }}>Clientes habilitados</p>
        </div>

        {/* Stock bajo */}
        <div style={{ ...card, border: stats.stockBajo > 0 ? "1px solid rgba(215,38,56,0.4)" : `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>Stock bajo</p>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: stats.stockBajo > 0 ? "rgba(215,38,56,0.12)" : "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⚠️</div>
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 6px", color: stats.stockBajo > 0 ? "#D72638" : theme.text }}>{stats.stockBajo}</p>
          <p style={{ fontSize: "12px", margin: 0, color: stats.stockBajo > 0 ? "#D72638" : theme.muted, fontWeight: stats.stockBajo > 0 ? 600 : 400 }}>
            {stats.stockBajo > 0 ? "¡Requiere atención!" : "Todo en orden"}
          </p>
        </div>
      </div>

      {/* ── FILA MEDIA ── */}
      <div className="dash-mid">

        {/* Top vendedores */}
        <div style={card}>
          <p style={sectionTitle}>🏆 Top vendedores del mes</p>
          {topVendedores.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: "13px" }}>Sin datos este mes</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {topVendedores.map((v, i) => (
                <div key={v.nombre} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: i === 0 ? "#D72638" : i === 1 ? "#f59e0b" : i === 2 ? "#3b82f6" : theme.cardAlt, color: i < 3 ? "white" : theme.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.nombre}</span>
                      <span style={{ fontSize: "12px", color: theme.muted, flexShrink: 0, marginLeft: "8px" }}>{v.cantidad} ped.</span>
                    </div>
                    <div style={{ height: "4px", background: theme.cardAlt, borderRadius: "99px" }}>
                      <div style={{ height: "100%", width: `${(v.total / (topVendedores[0]?.total || 1)) * 100}%`, background: i === 0 ? "#D72638" : COLORS[i], borderRadius: "99px" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: theme.muted }}>${v.total.toLocaleString("es-CO")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos — dona */}
        <div style={card}>
          <p style={sectionTitle}>🥧 Top productos del mes</p>
          {topProductos.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: "13px" }}>Sin datos este mes</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={topProductos} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                    {topProductos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gap: "6px" }}>
                {topProductos.map((p, i) => (
                  <div key={p.nombre} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: theme.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
                    <span style={{ fontSize: "12px", color: theme.muted, flexShrink: 0 }}>{Math.round((p.total / totalProd) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── FILA INFERIOR ── */}
      <div className="dash-bot">

        {/* Pedidos por día — barras */}
        <div style={card}>
          <p style={sectionTitle}>📊 Pedidos — últimos 30 días</p>
          {diasData.every(d => d.pedidos === 0) ? (
            <p style={{ color: theme.muted, fontSize: "13px" }}>Sin pedidos en este período</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={diasData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: theme.muted }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: theme.muted }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: theme.cardAlt }} />
                <Bar dataKey="pedidos" fill="#D72638" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top tiendas */}
        <div style={card}>
          <p style={sectionTitle}>🏪 Top tiendas del mes</p>
          {topTiendas.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: "13px" }}>Sin datos</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {topTiendas.map((t, i) => (
                <div key={t.nombre} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "6px", background: i === 0 ? "#D72638" : theme.cardAlt, color: i === 0 ? "white" : theme.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 1px", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nombre}</p>
                    <p style={{ fontSize: "11px", color: theme.muted, margin: 0 }}>{t.municipio} · {t.cantidad} ped. · ${t.total.toLocaleString("es-CO")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos pedidos */}
        <div style={card}>
          <p style={sectionTitle}>🕐 Últimos pedidos</p>
          {recientes.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: "13px" }}>Sin pedidos recientes</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {recientes.map((p: any) => {
                const col = { borrador: "#6B7280", confirmado: "#3b82f6", entregado: "#16a34a", cancelado: "#D72638" }[p.estado as string] || "#6B7280"
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 1px", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.cliente as any)?.nombre || "-"}</p>
                      <p style={{ fontSize: "11px", color: theme.muted, margin: 0 }}>${p.total.toLocaleString("es-CO")} · {p.estado}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
