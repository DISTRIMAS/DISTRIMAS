"use client"
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Usuario } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"

export default function DashboardPage() {
  const theme = useTheme()
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
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 6px", color: theme.text }}>Hola, {user?.nombre?.split(" ")[0]}</h2>
        <p style={{ color: theme.muted, fontSize: "14px", margin: 0 }}>{isAdmin ? "Aqui tienes el resumen del sistema" : "Aqui tienes tu actividad del dia"}</p>
      </div>
      <div className="cards-grid" style={{ marginBottom: "32px" }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "22px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: card.bg, marginBottom: "14px" }} />
            <div style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "4px", color: theme.text }}>{loading ? "-" : card.value}</div>
            <div style={{ fontSize: "13px", color: theme.muted }}>{card.label}</div>
            {"delta" in card && card.delta && <div style={{ fontSize: "12px", color: card.dc, marginTop: "6px" }}>{card.delta}</div>}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: theme.text }}>{isAdmin ? "Resumen del sistema" : "Mi actividad"}</p>
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "56px", textAlign: "center", color: theme.muted }}>
        <p style={{ fontSize: "14px", margin: 0 }}>{isAdmin ? "Aqui iran las graficas y estadisticas completas" : "Aqui veras tus pedidos recientes"}</p>
      </div>
    </div>
  )
}
