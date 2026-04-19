"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Perfil, Permisos } from "@/lib/types"

const MODULOS: { key: keyof Permisos; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pedidos", label: "Pedidos" },
  { key: "clientes", label: "Clientes" },
  { key: "inventario", label: "Inventario" },
  { key: "estadisticas", label: "Estadísticas" },
  { key: "usuarios", label: "Usuarios" },
  { key: "perfiles", label: "Perfiles" },
]

const PERMISOS_VACIO: Permisos = { dashboard: false, pedidos: false, clientes: false, inventario: false, usuarios: false, perfiles: false, estadisticas: false }

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: "", descripcion: "", permisos: { ...PERMISOS_VACIO } })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("perfiles").select("*").order("nombre")
    setPerfiles(data || [])
    setLoading(false)
  }

  function abrir(p?: Perfil) {
    setError("")
    if (p) {
      setEditando(p.id)
      setForm({ nombre: p.nombre, descripcion: p.descripcion, permisos: { ...PERMISOS_VACIO, ...p.permisos } })
    } else {
      setEditando(null)
      setForm({ nombre: "", descripcion: "", permisos: { ...PERMISOS_VACIO } })
    }
    setModal(true)
  }

  function cerrar() { setModal(false); setEditando(null); setError("") }

  async function guardar() {
    if (!form.nombre.trim()) return setError("El nombre es requerido")
    setSaving(true); setError("")
    const payload = { nombre: form.nombre, descripcion: form.descripcion, permisos: form.permisos }
    const { error: err } = editando
      ? await supabase.from("perfiles").update(payload).eq("id", editando)
      : await supabase.from("perfiles").insert(payload)
    setSaving(false)
    if (err) return setError(err.message)
    cerrar(); load()
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este perfil? Asegúrate de que no tenga usuarios asignados.")) return
    await supabase.from("perfiles").delete().eq("id", id)
    load()
  }

  const togglePermiso = (k: keyof Permisos) =>
    setForm(f => ({ ...f, permisos: { ...f.permisos, [k]: !f.permisos[k] } }))

  const inp = { background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "white", fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const lbl = { display: "block", fontSize: "11px", fontWeight: "bold" as const, color: "#8B91A8", textTransform: "uppercase" as const, letterSpacing: "0.7px", marginBottom: "6px" }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>Perfiles y permisos</h2>
          <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>{perfiles.length} perfiles configurados</p>
        </div>
        <button onClick={() => abrir()} style={{ padding: "10px 20px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          + Nuevo perfil
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#555C74" }}>Cargando...</div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {perfiles.map(p => (
            <div key={p.id} style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontWeight: "bold", fontSize: "16px", margin: "0 0 4px" }}>{p.nombre}</p>
                  <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>{p.descripcion || "Sin descripción"}</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => abrir(p)} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Editar</button>
                  <button onClick={() => eliminar(p.id)} style={{ padding: "7px 14px", background: "rgba(215,38,56,0.1)", color: "#F04455", fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Eliminar</button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {MODULOS.map(m => {
                  const tiene = p.permisos?.[m.key]
                  return (
                    <span key={m.key} style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, background: tiene ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", color: tiene ? "#22c55e" : "#555C74" }}>
                      {tiene ? "✓" : "✗"} {m.label}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "460px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 24px" }}>{editando ? "Editar perfil" : "Nuevo perfil"}</h3>
            {error && <div style={{ background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#F04455", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
            <div style={{ display: "grid", gap: "16px" }}>
              <div><label style={lbl}>Nombre del perfil</label><input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Supervisor" /></div>
              <div><label style={lbl}>Descripción</label><input style={inp} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción del perfil" /></div>
              <div>
                <label style={lbl}>Permisos de acceso</label>
                <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
                  {MODULOS.map(m => (
                    <label key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#1E2330", borderRadius: "8px", cursor: "pointer" }}>
                      <span style={{ fontSize: "14px" }}>{m.label}</span>
                      <div onClick={() => togglePermiso(m.key)} style={{ width: "40px", height: "22px", borderRadius: "99px", background: form.permisos[m.key] ? "#D72638" : "#2A3044", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                        <span style={{ position: "absolute", width: "16px", height: "16px", borderRadius: "50%", top: "3px", left: form.permisos[m.key] ? "21px" : "3px", background: "white", transition: "left 0.2s" }} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={cerrar} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ flex: 1, padding: "11px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear perfil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
