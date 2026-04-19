"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Usuario, Perfil } from "@/lib/types"

const EMPTY: Partial<Usuario> & { password_hash: string } = {
  nombre: "", documento: "", telefono: "", usuario: "", password_hash: "", perfil_id: "", activo: true, primer_ingreso: true
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [buscar, setBuscar] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase.from("usuarios").select("*, perfil:perfiles(*)").order("nombre"),
      supabase.from("perfiles").select("*").order("nombre"),
    ])
    setUsuarios(u || [])
    setPerfiles(p || [])
    setLoading(false)
  }

  function abrir(u?: Usuario) {
    setError("")
    if (u) {
      setEditando(u.id)
      setForm({ nombre: u.nombre, documento: u.documento, telefono: u.telefono, usuario: u.usuario, password_hash: "", perfil_id: u.perfil_id, activo: u.activo, primer_ingreso: u.primer_ingreso })
    } else {
      setEditando(null)
      setForm({ ...EMPTY })
    }
    setModal(true)
  }

  function cerrar() { setModal(false); setEditando(null); setForm({ ...EMPTY }); setError("") }

  async function guardar() {
    if (!form.nombre?.trim()) return setError("El nombre es requerido")
    if (!form.documento?.trim()) return setError("El documento es requerido")
    if (!form.usuario?.trim()) return setError("El usuario es requerido")
    if (!form.perfil_id) return setError("Selecciona un perfil")
    if (!editando && !form.password_hash?.trim()) return setError("La contrasena es requerida")
    setSaving(true)
    setError("")
    const payload: Record<string, unknown> = {
      nombre: form.nombre, documento: form.documento, telefono: form.telefono,
      usuario: form.usuario, perfil_id: form.perfil_id, activo: form.activo, primer_ingreso: form.primer_ingreso
    }
    if (form.password_hash?.trim()) payload.password_hash = form.password_hash
    let err
    if (editando) {
      const r = await supabase.from("usuarios").update(payload).eq("id", editando)
      err = r.error
    } else {
      const r = await supabase.from("usuarios").insert(payload)
      err = r.error
    }
    setSaving(false)
    if (err) return setError(err.message)
    cerrar(); load()
  }

  async function toggleActivo(u: Usuario) {
    await supabase.from("usuarios").update({ activo: !u.activo }).eq("id", u.id)
    load()
  }

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    u.usuario.toLowerCase().includes(buscar.toLowerCase()) ||
    u.documento.includes(buscar)
  )

  const f = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const inp = { background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "white", fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const lbl = { display: "block", fontSize: "11px", fontWeight: "bold" as const, color: "#8B91A8", textTransform: "uppercase" as const, letterSpacing: "0.7px", marginBottom: "6px" }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px" }}>Usuarios</h2>
          <p style={{ color: "#8B91A8", fontSize: "13px", margin: 0 }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={() => abrir()} style={{ padding: "10px 20px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          + Nuevo usuario
        </button>
      </div>

      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre, usuario o documento..." style={{ ...inp, width: "320px" }} />
      </div>

      <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Nombre", "Usuario", "Documento", "Teléfono", "Perfil", "Estado", "Acciones"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "bold", color: "#8B91A8", textTransform: "uppercase", letterSpacing: "0.7px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#555C74", fontSize: "14px" }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#555C74", fontSize: "14px" }}>No hay usuarios</td></tr>
            ) : filtrados.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#D72638", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "13px", flexShrink: 0 }}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    {u.nombre}
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{u.usuario}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{u.documento}</td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#8B91A8" }}>{u.telefono}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, background: "rgba(215,38,56,0.12)", color: "#D72638" }}>
                    {u.perfil?.nombre || "-"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, background: u.activo ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: u.activo ? "#22c55e" : "#8B91A8" }}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => abrir(u)} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Editar</button>
                    <button onClick={() => toggleActivo(u)} style={{ padding: "6px 12px", background: u.activo ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)", color: u.activo ? "#f59e0b" : "#22c55e", fontSize: "12px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
                      {u.activo ? "Desactivar" : "Activar"}
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
          <div style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 24px" }}>{editando ? "Editar usuario" : "Nuevo usuario"}</h3>
            {error && <div style={{ background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#F04455", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
            <div style={{ display: "grid", gap: "16px" }}>
              <div><label style={lbl}>Nombre completo</label><input style={inp} value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Ej: Juan Perez" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><label style={lbl}>Documento</label><input style={inp} value={form.documento} onChange={e => f("documento", e.target.value)} placeholder="CC / NIT" /></div>
                <div><label style={lbl}>Teléfono</label><input style={inp} value={form.telefono} onChange={e => f("telefono", e.target.value)} placeholder="300..." /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><label style={lbl}>Usuario</label><input style={inp} value={form.usuario} onChange={e => f("usuario", e.target.value)} placeholder="usuario123" /></div>
                <div><label style={lbl}>{editando ? "Nueva contrasena (opcional)" : "Contrasena"}</label><input style={inp} type="password" value={form.password_hash} onChange={e => f("password_hash", e.target.value)} placeholder="••••••••" /></div>
              </div>
              <div>
                <label style={lbl}>Perfil</label>
                <select style={{ ...inp }} value={form.perfil_id} onChange={e => f("perfil_id", e.target.value)}>
                  <option value="">Seleccionar perfil...</option>
                  {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.activo} onChange={e => f("activo", e.target.checked)} />
                  Activo
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.primer_ingreso} onChange={e => f("primer_ingreso", e.target.checked)} />
                  Primer ingreso
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={cerrar} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ flex: 1, padding: "11px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
