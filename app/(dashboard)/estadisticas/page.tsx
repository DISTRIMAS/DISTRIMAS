"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface TopItem { nombre: string; total: number; cantidad: number }

export default function EstadisticasPage() {
  const [topVendedores, setTopVendedores] = useState<TopItem[]>([])
  const [topClientes, setTopClientes] = useState<TopItem[]>([])
  const [topProductos, setTopProductos] = useState<TopItem[]>([])
  const [resumen, setResumen] = useState({ totalMes: 0, pedidosMes: 0, ticketPromedio: 0, entregados: 0 })
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { load() }, [mes])

  async function load() {
    setLoading(true)
    const inicio = mes + "-01"
    const fin = new Date(mes + "-01")
    fin.setMonth(fin.getMonth() + 1)
    const finStr = fin.toISOString().split("T")[0]

    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, total, estado, usuario:usuarios(nombre), cliente:clientes(nombre), items:pedido_items(cantidad, precio_unitario, producto:productos(nombre))")
      .gte("created_at", inicio).lt("created_at", finStr)
      .neq("estado", "cancelado")

    if (!pedidos) { setLoading(false); return }

    const totalMes = pedidos.reduce((a, p) => a + (p.total || 0), 0)
    const entregados = pedidos.filter(p => p.estado === "entregado").length

    // Top vendedores
    const vendMap: Record<string, TopItem> = {}
    pedidos.forEach(p => {
      const u = p.usuario as unknown as { nombre: string } | null
      const nombre = u?.nombre || "Desconocido"
      if (!vendMap[nombre]) vendMap[nombre] = { nombre, total: 0, cantidad: 0 }
      vendMap[nombre].total += p.total || 0
      vendMap[nombre].cantidad += 1
    })

    // Top clientes
    const cliMap: Record<string, TopItem> = {}
    pedidos.forEach(p => {
      const c = p.cliente as unknown as { nombre: string } | null
      const nombre = c?.nombre || "Desconocido"
      if (!cliMap[nombre]) cliMap[nombre] = { nombre, total: 0, cantidad: 0 }
      cliMap[nombre].total += p.total || 0
      cliMap[nombre].cantidad += 1
    })

    // Top productos
    const prodMap: Record<string, TopItem> = {}
    pedidos.forEach(p => {
      const items = p.items as unknown as { cantidad: number; precio_unitario: number; producto: { nombre: string } | null }[]
      items?.forEach(item => {
        const nombre = item.producto?.nombre || "Desconocido"
        if (!prodMap[nombre]) prodMap[nombre] = { nombre, total: 0, cantidad: 0 }
        prodMap[nombre].total += item.cantidad * item.precio_unitario
        prodMap[nombre].cantidad += item.cantidad
      })
    })

    const sort = (m: Record<string, TopItem>) => Object.values(m).sort((a, b) => b.total - a.total).slice(0, 5)
    setTopVendedores(sort(vendMap))
    setTopClientes(sort(cliMap))
    setTopProductos(sort(prodMap))
    setResumen({ totalMes, pedidosMes: pedidos.length, ticketPromedio: pedidos.length ? Math.round(totalMes / pedidos.length) : 0, entregados })
    setLoading(false)
  }

  const maxVend = topVendedores[0]?.total || 1
  const maxCli = topClientes[0]?.total || 1
  const maxProd = topProductos[0]?.total || 1

  const Card = ({ label, value }: { label: string; value: string }) => (
    <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "20px" }}>
      <p style={{ color: "#8B91A8", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</p>
      <p style={{ fontSize: "26px", fontWeight: "bold", margin: 0 }}>{value}</p>
    </div>
  )

  const TopList = ({ titulo, items, max, unit }: { titulo: string; items: TopItem[]; max: number; unit: string }) => (
    <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "24px" }}>
      <p style={{ fontWeight: "bold", fontSize: "15px", margin: "0 0 20px" }}>{titulo}</p>
      {loading ? <p style={{ color: "#555C74", fontSize: "13px" }}>Cargando...</p> : items.length === 0 ? <p style={{ color: "#555C74", fontSize: "13px" }}>Sin datos</p> : (
        <div style={{ display: "grid", gap: "14px" }}>
          {items.map((item, i) => (
            <div key={item.nombre}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: i === 0 ? "#D72638" : "#1E2330", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", color: i === 0 ? "white" : "#8B91A8", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{item.nombre}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>${item.total.toLocaleString("es-CO")}</span>
                  <span style={{ fontSize: "11px", color: "#8B91A8", marginLeft: "6px" }}>{item.cantidad} {unit}</span>
                </div>
              </div>
              <div style={{ height: "4px", background: "#1E2330", borderRadius: "99px" }}>
                <div style={{ height: "100%", width: `${(item.total / max) * 100}%`, background: i === 0 ? "#D72638" : "#2A3044", borderRadius: "99px", transition: "width 0.5s" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>Estadísticas</h2>
          <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>Resumen de ventas y desempeño</p>
        </div>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)}
          style={{ background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "white", fontSize: "14px", padding: "9px 12px", outline: "none" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        <Card label="Total del mes" value={loading ? "..." : "$" + resumen.totalMes.toLocaleString("es-CO")} />
        <Card label="Pedidos" value={loading ? "..." : String(resumen.pedidosMes)} />
        <Card label="Ticket promedio" value={loading ? "..." : "$" + resumen.ticketPromedio.toLocaleString("es-CO")} />
        <Card label="Entregados" value={loading ? "..." : String(resumen.entregados)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <TopList titulo="Top vendedores" items={topVendedores} max={maxVend} unit="pedidos" />
        <TopList titulo="Top clientes" items={topClientes} max={maxCli} unit="pedidos" />
        <TopList titulo="Top productos" items={topProductos} max={maxProd} unit="und" />
      </div>
    </div>
  )
}
