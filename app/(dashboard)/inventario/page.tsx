"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Producto } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import * as XLSX from "xlsx"

const EMPTY: Partial<Producto> = { codigo: "", nombre: "", descripcion: "", unidad: "Und", precio: 0, stock: 0, stock_minimo: 10, activo: true }

export default function InventarioPage() {
  const theme = useTheme()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [buscar, setBuscar] = useState("")
  const [filtro, setFiltro] = useState<"todos" | "bajo" | "ok">("todos")
  const [importando, setImportando] = useState(false)
  const [msgImport, setMsgImport] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
    const canal = supabase.channel("inventario-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, load)
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("productos").select("*").order("nombre")
    setProductos(data || [])
    setLoading(false)
  }

  function abrir(p?: Producto) {
    setError("")
    setEditando(p ? p.id : null)
    setForm(p ? { ...p } : { ...EMPTY })
    setModal(true)
  }

  function cerrar() { setModal(false); setEditando(null); setError("") }

  async function guardar() {
    if (!form.nombre?.trim()) return setError("El nombre es requerido")
    if (!form.codigo?.trim()) return setError("El código es requerido")
    setSaving(true); setError("")
    const payload = { ...form, precio: Number(form.precio), stock: Number(form.stock), stock_minimo: Number(form.stock_minimo) }
    const { error: err } = editando
      ? await supabase.from("productos").update(payload).eq("id", editando)
      : await supabase.from("productos").insert(payload)
    setSaving(false)
    if (err) return setError(err.message)
    cerrar()
  }

  async function toggleActivo(p: Producto) {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id)
  }

  async function importarExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true); setMsgImport("")
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
    const registros = rows.map(r => ({
      codigo: String(r["codigo"] || r["Codigo"] || r["CODIGO"] || "").trim(),
      nombre: String(r["nombre"] || r["Nombre"] || r["NOMBRE"] || "").trim(),
      descripcion: String(r["descripcion"] || r["Descripcion"] || "").trim(),
      unidad: String(r["unidad"] || r["Unidad"] || "Und").trim(),
      precio: Number(r["precio"] || r["Precio"] || 0),
      stock: Number(r["stock"] || r["Stock"] || 0),
      stock_minimo: Number(r["stock_minimo"] || r["StockMinimo"] || 10),
      activo: true,
    })).filter(r => r.nombre && r.codigo)
    if (registros.length === 0) { setMsgImport("No se encontraron registros válidos."); setImportando(false); return }
    const { error: err } = await supabase.from("productos").upsert(registros, { onConflict: "codigo" })
    setImportando(false)
    if (err) { setMsgImport("Error: " + err.message); return }
    setMsgImport(`✓ ${registros.length} productos importados`)
    if (fileRef.current) fileRef.current.value = ""
  }

  function exportarExcel() {
    const datos = productos.map(p => ({ Codigo: p.codigo, Nombre: p.nombre, Descripcion: p.descripcion, Unidad: p.unidad, Precio: p.precio, Stock: p.stock, StockMinimo: p.stock_minimo, Activo: p.activo ? "Sí" : "No" }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inventario")
    XLSX.writeFile(wb, "inventario_distrimas.xlsx")
  }

  const stockBajo = productos.filter(p => p.activo && p.stock < p.stock_minimo).length

  const filtrados = productos.filter(p => {
    const q = buscar.toLowerCase()
    const coincide = p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    if (filtro === "bajo") return coincide && p.stock < p.stock_minimo && p.activo
    if (filtro === "ok") return coincide && p.stock >= p.stock_minimo
    return coincide
  })

  const f = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const inp = { background: theme.cardAlt, border: `1.5px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const lbl = { display: "block", fontSize: "11px", fontWeight: "bold" as const, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.7px", marginBottom: "6px" }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px", color: theme.text }}>Inventario</h2>
          <p style={{ color: theme.muted, fontSize: "13px", margin: 0 }}>{productos.length} productos · <span style={{ color: stockBajo > 0 ? "#f59e0b" : "#22c55e" }}>{stockBajo} con stock bajo</span> · Tiempo real</p>
        </div>
        <div className="page-header-btns">
          <button onClick={exportarExcel} style={{ padding: "10px 16px", background: theme.cardAlt, color: theme.text, fontWeight: 600, fontSize: "13px", borderRadius: "8px", border: `1px solid ${theme.border}`, cursor: "pointer" }}>Exportar Excel</button>
          <label style={{ padding: "10px 16px", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600, fontSize: "13px", borderRadius: "8px", border: "none", cursor: "pointer", display: "inline-block" }}>
            {importando ? "Importando..." : "Cargar Excel"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importarExcel} style={{ display: "none" }} />
          </label>
          <button onClick={() => abrir()} style={{ padding: "10px 20px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>+ Producto</button>
        </div>
      </div>

      {msgImport && (
        <div style={{ background: msgImport.startsWith("✓") ? "rgba(34,197,94,0.1)" : "rgba(215,38,56,0.1)", border: `1px solid ${msgImport.startsWith("✓") ? "rgba(34,197,94,0.25)" : "rgba(215,38,56,0.25)"}`, color: msgImport.startsWith("✓") ? "#22c55e" : "#F04455", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", marginBottom: "16px" }}>
          {msgImport}
        </div>
      )}

      <div className="filtros-wrap" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar producto o código..." style={{ ...inp, maxWidth: "280px" }} />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["todos", "bajo", "ok"] as const).map(f2 => (
            <button key={f2} onClick={() => setFiltro(f2)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, background: filtro === f2 ? "#D72638" : theme.cardAlt, color: filtro === f2 ? "white" : theme.muted }}>
              {f2 === "todos" ? "Todos" : f2 === "bajo" ? "Stock bajo" : "Stock OK"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", overflow: "hidden" }}>
        <div className="tabla-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {["Código", "Nombre", "Unidad", "Precio", "Stock", "Mín.", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "bold", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.muted }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.muted }}>No hay productos</td></tr>
              ) : filtrados.map(p => {
                const bajo = p.activo && p.stock < p.stock_minimo
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}`, background: bajo ? "rgba(245,158,11,0.04)" : "transparent" }}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: theme.muted, fontFamily: "monospace" }}>{p.codigo}</td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500, color: theme.text }}>{p.nombre}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: theme.muted }}>{p.unidad}</td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, color: theme.text }}>${p.precio.toLocaleString("es-CO")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "15px", color: bajo ? "#f59e0b" : "#22c55e" }}>{p.stock}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: theme.muted }}>{p.stock_minimo}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, background: bajo ? "rgba(245,158,11,0.12)" : p.activo ? "rgba(34,197,94,0.12)" : theme.cardAlt, color: bajo ? "#f59e0b" : p.activo ? "#22c55e" : theme.muted }}>
                        {bajo ? "Stock bajo" : p.activo ? "OK" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="acciones-wrap">
                        <button onClick={() => abrir(p)} style={{ padding: "6px 12px", background: theme.cardAlt, color: theme.text, fontSize: "12px", borderRadius: "6px", border: `1px solid ${theme.border}`, cursor: "pointer" }}>Editar</button>
                        <button onClick={() => toggleActivo(p)} style={{ padding: "6px 12px", background: p.activo ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)", color: p.activo ? "#f59e0b" : "#22c55e", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
                          {p.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ background: theme.card, border: `1px solid ${theme.border}`, padding: "24px", maxWidth: "480px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "bold", margin: "0 0 20px", color: theme.text }}>{editando ? "Editar producto" : "Nuevo producto"}</h3>
            {error && <div style={{ background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#D72638", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
            <div style={{ display: "grid", gap: "14px" }}>
              <div className="form-grid-1-2">
                <div><label style={lbl}>Código</label><input style={inp} value={form.codigo} onChange={e => f("codigo", e.target.value)} placeholder="PRD-001" /></div>
                <div><label style={lbl}>Nombre</label><input style={inp} value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Arroz Diana 5kg" /></div>
              </div>
              <div><label style={lbl}>Descripción</label><input style={inp} value={form.descripcion} onChange={e => f("descripcion", e.target.value)} placeholder="Descripción del producto" /></div>
              <div className="form-grid-3">
                <div><label style={lbl}>Unidad</label>
                  <select style={inp} value={form.unidad} onChange={e => f("unidad", e.target.value)}>
                    {["Und", "Cja", "Blt", "Kg", "Lt", "Par"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Precio</label><input style={inp} type="number" value={form.precio} onChange={e => f("precio", e.target.value)} min={0} /></div>
                <div><label style={lbl}>Stock actual</label><input style={inp} type="number" value={form.stock} onChange={e => f("stock", e.target.value)} min={0} /></div>
              </div>
              <div><label style={lbl}>Stock mínimo</label><input style={inp} type="number" value={form.stock_minimo} onChange={e => f("stock_minimo", e.target.value)} min={0} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer", color: theme.text }}>
                <input type="checkbox" checked={form.activo} onChange={e => f("activo", e.target.checked)} /> Activo
              </label>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button onClick={cerrar} style={{ flex: 1, padding: "11px", background: theme.cardAlt, color: theme.text, fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: `1px solid ${theme.border}`, cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ flex: 1, padding: "11px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
