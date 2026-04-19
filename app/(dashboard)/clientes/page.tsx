"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Cliente } from "@/lib/types"
import * as XLSX from "xlsx"

const EMPTY: Partial<Cliente> = { codigo: "", nombre: "", municipio: "", barrio: "", direccion: "", telefono: "", activo: true }

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [buscar, setBuscar] = useState("")
  const [importando, setImportando] = useState(false)
  const [msgImport, setMsgImport] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("clientes").select("*").order("nombre")
    setClientes(data || [])
    setLoading(false)
  }

  function abrir(c?: Cliente) {
    setError("")
    setEditando(c ? c.id : null)
    setForm(c ? { codigo: c.codigo, nombre: c.nombre, municipio: c.municipio, barrio: c.barrio, direccion: c.direccion, telefono: c.telefono, activo: c.activo } : { ...EMPTY })
    setModal(true)
  }

  function cerrar() { setModal(false); setEditando(null); setError("") }

  async function guardar() {
    if (!form.nombre?.trim()) return setError("El nombre es requerido")
    if (!form.codigo?.trim()) return setError("El código es requerido")
    setSaving(true); setError("")
    const { error: err } = editando
      ? await supabase.from("clientes").update(form).eq("id", editando)
      : await supabase.from("clientes").insert(form)
    setSaving(false)
    if (err) return setError(err.message)
    cerrar(); load()
  }

  async function toggleActivo(c: Cliente) {
    await supabase.from("clientes").update({ activo: !c.activo }).eq("id", c.id)
    load()
  }

  async function importarExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true); setMsgImport("")
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)
    const registros = rows.map(r => ({
      codigo: String(r["codigo"] || r["Codigo"] || r["CODIGO"] || "").trim(),
      nombre: String(r["nombre"] || r["Nombre"] || r["NOMBRE"] || "").trim(),
      municipio: String(r["municipio"] || r["Municipio"] || r["MUNICIPIO"] || "").trim(),
      barrio: String(r["barrio"] || r["Barrio"] || r["BARRIO"] || "").trim(),
      direccion: String(r["direccion"] || r["Direccion"] || r["DIRECCION"] || "").trim(),
      telefono: String(r["telefono"] || r["Telefono"] || r["TELEFONO"] || "").trim(),
      activo: true,
    })).filter(r => r.nombre)
    if (registros.length === 0) { setMsgImport("No se encontraron registros válidos."); setImportando(false); return }
    const { error: err } = await supabase.from("clientes").upsert(registros, { onConflict: "codigo" })
    setImportando(false)
    if (err) { setMsgImport("Error: " + err.message); return }
    setMsgImport(`✓ ${registros.length} clientes importados`)
    load()
    if (fileRef.current) fileRef.current.value = ""
  }

  function exportarExcel() {
    const datos = clientes.map(c => ({ Codigo: c.codigo, Nombre: c.nombre, Municipio: c.municipio, Barrio: c.barrio, Direccion: c.direccion, Telefono: c.telefono, Activo: c.activo ? "Sí" : "No" }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clientes")
    XLSX.writeFile(wb, "clientes_distrimas.xlsx")
  }

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    c.codigo.toLowerCase().includes(buscar.toLowerCase()) ||
    c.municipio.toLowerCase().includes(buscar.toLowerCase())
  )

  const f = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const inp = { background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "white", fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const lbl = { display: "block", fontSize: "11px", fontWeight: "bold" as const, color: "#8B91A8", textTransform: "uppercase" as const, letterSpacing: "0.7px", marginBottom: "6px" }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>Clientes</h2>
          <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>{clientes.filter(c => c.activo).length} activos de {clientes.length} total</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportarExcel} style={{ padding: "10px 16px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "13px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            Exportar Excel
          </button>
          <label style={{ padding: "10px 16px", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600, fontSize: "13px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            {importando ? "Importando..." : "Importar Excel"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importarExcel} style={{ display: "none" }} />
          </label>
          <button onClick={() => abrir()} style={{ padding: "10px 20px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {msgImport && (
        <div style={{ background: msgImport.startsWith("✓") ? "rgba(34,197,94,0.1)" : "rgba(215,38,56,0.1)", border: `1px solid ${msgImport.startsWith("✓") ? "rgba(34,197,94,0.25)" : "rgba(215,38,56,0.25)"}`, color: msgImport.startsWith("✓") ? "#22c55e" : "#F04455", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", marginBottom: "16px" }}>
          {msgImport}
        </div>
      )}

      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre, código o municipio..." style={{ ...inp, width: "340px" }} />
      </div>

      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Código", "Nombre", "Municipio", "Barrio", "Teléfono", "Estado", "Acciones"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "bold", color: "#8B91A8", textTransform: "uppercase", letterSpacing: "0.7px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#555C74" }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#555C74" }}>No hay clientes</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8", fontFamily: "monospace" }}>{c.codigo}</td>
                <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500 }}>{c.nombre}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{c.municipio}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{c.barrio}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{c.telefono}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, background: c.activo ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: c.activo ? "#22c55e" : "#8B91A8" }}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => abrir(c)} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Editar</button>
                    <button onClick={() => toggleActivo(c)} style={{ padding: "6px 12px", background: c.activo ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)", color: c.activo ? "#f59e0b" : "#22c55e", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
                      {c.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 24px" }}>{editando ? "Editar cliente" : "Nuevo cliente"}</h3>
            {error && <div style={{ background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#F04455", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div><label style={lbl}>Código</label><input style={inp} value={form.codigo} onChange={e => f("codigo", e.target.value)} placeholder="CLI-001" /></div>
                <div><label style={lbl}>Nombre</label><input style={inp} value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Tienda El Paisa" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><label style={lbl}>Municipio</label><input style={inp} value={form.municipio} onChange={e => f("municipio", e.target.value)} placeholder="Bucaramanga" /></div>
                <div><label style={lbl}>Barrio</label><input style={inp} value={form.barrio} onChange={e => f("barrio", e.target.value)} placeholder="La Concordia" /></div>
              </div>
              <div><label style={lbl}>Dirección</label><input style={inp} value={form.direccion} onChange={e => f("direccion", e.target.value)} placeholder="Cra 15 # 23-10" /></div>
              <div><label style={lbl}>Teléfono</label><input style={inp} value={form.telefono} onChange={e => f("telefono", e.target.value)} placeholder="315..." /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.activo} onChange={e => f("activo", e.target.checked)} /> Activo
              </label>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={cerrar} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ flex: 1, padding: "11px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
