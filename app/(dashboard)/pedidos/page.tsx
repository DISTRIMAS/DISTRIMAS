"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Pedido } from "@/lib/types"
import { getSession } from "@/lib/auth"

const ESTADOS = ["todos", "borrador", "confirmado", "entregado", "cancelado"] as const
const COLOR_ESTADO: Record<string, { bg: string; color: string }> = {
  borrador:   { bg: "rgba(255,255,255,0.06)", color: "#8B91A8" },
  confirmado: { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  entregado:  { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  cancelado:  { bg: "rgba(215,38,56,0.12)",   color: "#F04455" },
}

export default function PedidosPage() {
  const router = useRouter()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<typeof ESTADOS[number]>("todos")
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const isAdmin = getSession()?.perfil?.nombre === "Administrador"
  const userId = getSession()?.id

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    let q = supabase.from("pedidos").select("*, cliente:clientes(*), usuario:usuarios(nombre), items:pedido_items(*, producto:productos(nombre,unidad))").order("created_at", { ascending: false })
    if (!isAdmin) q = q.eq("usuario_id", userId)
    const { data } = await q
    setPedidos(data || [])
    setLoading(false)
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from("pedidos").update({ estado }).eq("id", id)
    load()
    if (detalle?.id === id) setDetalle(d => d ? { ...d, estado: estado as Pedido["estado"] } : d)
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este pedido?")) return
    await supabase.from("pedido_items").delete().eq("pedido_id", id)
    await supabase.from("pedidos").delete().eq("id", id)
    setDetalle(null); load()
  }

  const filtrados = pedidos.filter(p => {
    const q = buscar.toLowerCase()
    const coincide = p.cliente?.nombre?.toLowerCase().includes(q) || p.id.includes(q)
    return coincide && (filtroEstado === "todos" || p.estado === filtroEstado)
  })

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>Pedidos</h2>
          <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>{pedidos.length} pedidos {!isAdmin ? "propios" : "en total"}</p>
        </div>
        <button onClick={() => router.push("/pedidos/nuevo")} style={{ padding: "10px 20px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          + Nuevo pedido
        </button>
      </div>

      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por cliente o ID..." style={{ background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "white", fontSize: "14px", padding: "9px 12px", outline: "none", width: "260px" }} />
        <div style={{ display: "flex", gap: "6px" }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{ padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, background: filtroEstado === e ? "#D72638" : "rgba(255,255,255,0.06)", color: filtroEstado === e ? "white" : "#8B91A8", textTransform: "capitalize" }}>
              {e === "todos" ? "Todos" : e}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Cliente", "Vendedor", "Estado", "Total", "Fecha", "Acciones"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "bold", color: "#8B91A8", textTransform: "uppercase", letterSpacing: "0.7px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#555C74" }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#555C74" }}>No hay pedidos</td></tr>
            ) : filtrados.map(p => {
              const col = COLOR_ESTADO[p.estado] || COLOR_ESTADO.borrador
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onClick={() => setDetalle(p)}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500 }}>{p.cliente?.nombre || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{(p.usuario as unknown as { nombre: string })?.nombre || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, ...col }}>{p.estado}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600 }}>${p.total.toLocaleString("es-CO")}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{new Date(p.created_at).toLocaleDateString("es-CO")}</td>
                  <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {/* Editar: vendedor en borrador, admin en borrador o confirmado */}
                      {(p.estado === "borrador" || (isAdmin && p.estado === "confirmado")) &&
                        <button onClick={() => router.push(`/pedidos/nuevo?id=${p.id}`)} style={{ padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "#F0F2F7", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Editar</button>}
                      {p.estado === "borrador" && <button onClick={() => cambiarEstado(p.id, "confirmado")} style={{ padding: "5px 10px", background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Confirmar</button>}
                      {p.estado === "confirmado" && isAdmin && <button onClick={() => cambiarEstado(p.id, "entregado")} style={{ padding: "5px 10px", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Entregar</button>}
                      {p.estado === "confirmado" && !isAdmin && <button onClick={() => cambiarEstado(p.id, "entregado")} style={{ padding: "5px 10px", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Entregar</button>}
                      {(p.estado === "borrador" || p.estado === "confirmado") && <button onClick={() => cambiarEstado(p.id, "cancelado")} style={{ padding: "5px 10px", background: "rgba(215,38,56,0.1)", color: "#F04455", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Cancelar</button>}
                      {/* Eliminar: vendedor solo borradores propios, admin cualquiera */}
                      {(p.estado === "borrador" || isAdmin) && <button onClick={() => eliminar(p.id)} style={{ padding: "5px 10px", background: "rgba(255,255,255,0.05)", color: "#555C74", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Eliminar</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDetalle(null)}>
          <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "560px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px" }}>Detalle del pedido</h3>
                <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>{detalle.cliente?.nombre}</p>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, ...(COLOR_ESTADO[detalle.estado] || COLOR_ESTADO.borrador) }}>{detalle.estado}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", padding: "16px", background: "#1E2330", borderRadius: "10px" }}>
              <div><p style={{ color: "#8B91A8", fontSize: "11px", margin: "0 0 2px" }}>MUNICIPIO</p><p style={{ fontSize: "13px", margin: 0 }}>{detalle.cliente?.municipio || "-"}</p></div>
              <div><p style={{ color: "#8B91A8", fontSize: "11px", margin: "0 0 2px" }}>TELÉFONO</p><p style={{ fontSize: "13px", margin: 0 }}>{detalle.cliente?.telefono || "-"}</p></div>
              <div><p style={{ color: "#8B91A8", fontSize: "11px", margin: "0 0 2px" }}>FECHA</p><p style={{ fontSize: "13px", margin: 0 }}>{new Date(detalle.created_at).toLocaleDateString("es-CO")}</p></div>
              <div><p style={{ color: "#8B91A8", fontSize: "11px", margin: "0 0 2px" }}>VENDEDOR</p><p style={{ fontSize: "13px", margin: 0 }}>{(detalle.usuario as unknown as { nombre: string })?.nombre || "-"}</p></div>
            </div>
            {detalle.observaciones && <p style={{ color: "#8B91A8", fontSize: "13px", marginBottom: "16px", fontStyle: "italic" }}>"{detalle.observaciones}"</p>}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Producto", "Und", "Cant.", "Precio", "Subtotal"].map(h => (
                    <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: "11px", color: "#8B91A8", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detalle.items?.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 0", fontSize: "13px" }}>{item.producto?.nombre || "-"}</td>
                    <td style={{ padding: "8px 0", fontSize: "13px", color: "#8B91A8" }}>{item.producto?.unidad}</td>
                    <td style={{ padding: "8px 0", fontSize: "13px" }}>{item.cantidad}</td>
                    <td style={{ padding: "8px 0", fontSize: "13px" }}>${item.precio_unitario.toLocaleString("es-CO")}</td>
                    <td style={{ padding: "8px 0", fontSize: "13px", fontWeight: 600 }}>${item.subtotal.toLocaleString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "18px", fontWeight: "bold" }}>
              Total: ${detalle.total.toLocaleString("es-CO")}
            </div>
            <button onClick={() => setDetalle(null)} style={{ marginTop: "20px", width: "100%", padding: "11px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
