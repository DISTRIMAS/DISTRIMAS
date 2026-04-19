"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Cliente, Producto } from "@/lib/types"
import { getSession } from "@/lib/auth"
import { useTheme } from "@/lib/theme-context"

type ItemForm = { producto: Producto; cantidad: number; precio_unitario: number }

export default function NuevoPedidoPage() {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pedidoId = searchParams.get("id")
  const modoEdicion = !!pedidoId

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clienteId, setClienteId] = useState("")
  const [buscarCliente, setBuscarCliente] = useState("")
  const [buscarProducto, setBuscarProducto] = useState("")
  const [items, setItems] = useState<ItemForm[]>([])
  const [observaciones, setObservaciones] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showClientes, setShowClientes] = useState(false)
  const [showProductos, setShowProductos] = useState(false)

  useEffect(() => {
    supabase.from("clientes").select("*").eq("activo", true).order("nombre").then(r => setClientes(r.data || []))
    supabase.from("productos").select("*").eq("activo", true).order("nombre").then(r => setProductos(r.data || []))
    if (pedidoId) cargarPedido(pedidoId)
  }, [])

  async function cargarPedido(id: string) {
    const { data } = await supabase
      .from("pedidos")
      .select("*, items:pedido_items(*, producto:productos(*))")
      .eq("id", id)
      .single()
    if (!data) return
    setClienteId(data.cliente_id)
    setObservaciones(data.observaciones || "")
    const itemsCargados: ItemForm[] = (data.items || []).map((i: { producto: Producto; cantidad: number; precio_unitario: number }) => ({
      producto: i.producto,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }))
    setItems(itemsCargados)
  }

  const clienteSeleccionado = clientes.find(c => c.id === clienteId)
  const clientesFiltrados = clientes.filter(c => c.nombre.toLowerCase().includes(buscarCliente.toLowerCase()) || c.codigo.toLowerCase().includes(buscarCliente.toLowerCase()))
  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()) || p.codigo.toLowerCase().includes(buscarProducto.toLowerCase()))

  function agregarProducto(p: Producto) {
    const existe = items.find(i => i.producto.id === p.id)
    if (existe) {
      setItems(items.map(i => i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      setItems([...items, { producto: p, cantidad: 1, precio_unitario: p.precio }])
    }
    setBuscarProducto(""); setShowProductos(false)
  }

  function quitarItem(id: string) { setItems(items.filter(i => i.producto.id !== id)) }
  function cambiarCantidad(id: string, cantidad: number) {
    if (cantidad <= 0) return quitarItem(id)
    setItems(items.map(i => i.producto.id === id ? { ...i, cantidad } : i))
  }
  function cambiarPrecio(id: string, precio: number) {
    setItems(items.map(i => i.producto.id === id ? { ...i, precio_unitario: precio } : i))
  }

  const total = items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0)

  async function guardar(estado: "borrador" | "confirmado") {
    if (!clienteId) return setError("Selecciona un cliente")
    if (items.length === 0) return setError("Agrega al menos un producto")
    setSaving(true); setError("")
    const user = getSession()

    if (modoEdicion && pedidoId) {
      const { error: err } = await supabase.from("pedidos")
        .update({ cliente_id: clienteId, estado, observaciones, total })
        .eq("id", pedidoId)
      if (err) { setSaving(false); return setError(err.message) }
      await supabase.from("pedido_items").delete().eq("pedido_id", pedidoId)
      const itemsInsert = items.map(i => ({ pedido_id: pedidoId, producto_id: i.producto.id, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      await supabase.from("pedido_items").insert(itemsInsert)
    } else {
      const { data: pedido, error: err } = await supabase.from("pedidos")
        .insert({ cliente_id: clienteId, usuario_id: user?.id, estado, observaciones, total })
        .select().single()
      if (err || !pedido) { setSaving(false); return setError(err?.message || "Error al crear pedido") }
      const itemsInsert = items.map(i => ({ pedido_id: pedido.id, producto_id: i.producto.id, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      await supabase.from("pedido_items").insert(itemsInsert)
    }

    setSaving(false)
    router.push("/pedidos")
  }

  const inp = { background: theme.cardAlt, border: `1.5px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const dropdownStyle = { position: "absolute" as const, top: "100%", left: 0, right: 0, background: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: "8px", zIndex: 50, maxHeight: "220px", overflowY: "auto" as const, marginTop: "4px" }

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <button onClick={() => router.push("/pedidos")} style={{ padding: "8px 14px", background: theme.cardAlt, color: theme.muted, fontSize: "13px", borderRadius: "8px", border: `1px solid ${theme.border}`, cursor: "pointer" }}>← Volver</button>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: theme.text }}>{modoEdicion ? "Editar pedido" : "Nuevo pedido"}</h2>
      </div>

      {error && <div style={{ background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#F04455", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      {/* Cliente */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: "bold", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.7px", margin: "0 0 12px" }}>Cliente</p>
        {clienteSeleccionado ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: theme.cardAlt, borderRadius: "8px" }}>
            <div>
              <p style={{ fontWeight: 600, margin: "0 0 2px", color: theme.text }}>{clienteSeleccionado.nombre}</p>
              <p style={{ color: theme.muted, fontSize: "12px", margin: 0 }}>{clienteSeleccionado.municipio} · {clienteSeleccionado.barrio} · {clienteSeleccionado.telefono}</p>
            </div>
            <button onClick={() => { setClienteId(""); setBuscarCliente("") }} style={{ padding: "5px 10px", background: "rgba(215,38,56,0.1)", color: "#F04455", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Cambiar</button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <input value={buscarCliente} onChange={e => { setBuscarCliente(e.target.value); setShowClientes(true) }} onFocus={() => setShowClientes(true)} placeholder="Buscar tienda o cliente..." style={inp} />
            {showClientes && buscarCliente && (
              <div style={dropdownStyle}>
                {clientesFiltrados.slice(0, 8).map(c => (
                  <div key={c.id} onClick={() => { setClienteId(c.id); setBuscarCliente(""); setShowClientes(false) }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${theme.border}` }}>
                    <p style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 2px", color: theme.text }}>{c.nombre}</p>
                    <p style={{ color: theme.muted, fontSize: "12px", margin: 0 }}>{c.municipio} · {c.codigo}</p>
                  </div>
                ))}
                {clientesFiltrados.length === 0 && <p style={{ padding: "12px 14px", color: theme.muted, fontSize: "13px", margin: 0 }}>Sin resultados</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Productos */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: "bold", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.7px", margin: "0 0 12px" }}>Productos</p>
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input value={buscarProducto} onChange={e => { setBuscarProducto(e.target.value); setShowProductos(true) }} onFocus={() => setShowProductos(true)} placeholder="Buscar y agregar producto..." style={inp} />
          {showProductos && buscarProducto && (
            <div style={dropdownStyle}>
              {productosFiltrados.slice(0, 8).map(p => (
                <div key={p.id} onClick={() => agregarProducto(p)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 2px", color: theme.text }}>{p.nombre}</p>
                    <p style={{ color: theme.muted, fontSize: "12px", margin: 0 }}>{p.codigo} · Stock: {p.stock} {p.unidad}</p>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "#D72638" }}>${p.precio.toLocaleString("es-CO")}</span>
                </div>
              ))}
              {productosFiltrados.length === 0 && <p style={{ padding: "12px 14px", color: theme.muted, fontSize: "13px", margin: 0 }}>Sin resultados</p>}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p style={{ color: theme.muted, fontSize: "13px", textAlign: "center", padding: "24px 0" }}>Busca y agrega productos al pedido</p>
        ) : (
          <div className="tabla-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {["Producto", "Cant.", "Precio unit.", "Subtotal", ""].map(h => (
                    <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: "11px", color: theme.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.producto.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: "10px 0", fontSize: "14px", color: theme.text }}>{item.producto.nombre}</td>
                    <td style={{ padding: "10px 0" }}>
                      <input type="number" value={item.cantidad} min={1} onChange={e => cambiarCantidad(item.producto.id, Number(e.target.value))}
                        style={{ width: "64px", background: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: "6px", color: theme.text, padding: "5px 8px", fontSize: "14px", outline: "none" }} />
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      <input type="number" value={item.precio_unitario} min={0} onChange={e => cambiarPrecio(item.producto.id, Number(e.target.value))}
                        style={{ width: "100px", background: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: "6px", color: theme.text, padding: "5px 8px", fontSize: "14px", outline: "none" }} />
                    </td>
                    <td style={{ padding: "10px 0", fontWeight: 600, color: theme.text }}>${(item.cantidad * item.precio_unitario).toLocaleString("es-CO")}</td>
                    <td style={{ padding: "10px 0" }}>
                      <button onClick={() => quitarItem(item.producto.id)} style={{ background: "none", border: "none", color: "#F04455", cursor: "pointer", fontSize: "16px" }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Observaciones y Total */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: "bold", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.7px", margin: "0 0 10px" }}>Observaciones</p>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Indicaciones especiales, horario de entrega, etc." rows={3}
          style={{ background: theme.cardAlt, border: `1.5px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ color: theme.muted, fontSize: "13px", margin: "0 0 2px" }}>Total del pedido</p>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: theme.text }}>${total.toLocaleString("es-CO")}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => guardar("borrador")} disabled={saving} style={{ padding: "12px 24px", background: theme.cardAlt, color: theme.text, fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: `1px solid ${theme.border}`, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {modoEdicion ? "Guardar cambios" : "Guardar borrador"}
          </button>
          <button onClick={() => guardar("confirmado")} disabled={saving} style={{ padding: "12px 24px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </div>
  )
}
