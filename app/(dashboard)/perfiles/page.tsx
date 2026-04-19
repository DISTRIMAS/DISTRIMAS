"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Perfil, Permisos, AccionesModulo } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"

const MODULOS: { key: keyof Permisos; label: string; acciones: (keyof AccionesModulo)[] }[] = [
  { key: "dashboard",   label: "Dashboard",    acciones: ["ver"] },
  { key: "pedidos",     label: "Pedidos",      acciones: ["ver", "insertar", "actualizar", "eliminar"] },
  { key: "clientes",    label: "Clientes",     acciones: ["ver", "insertar", "actualizar", "eliminar", "cargar", "exportar"] },
  { key: "inventario",  label: "Inventario",   acciones: ["ver", "insertar", "actualizar", "eliminar", "cargar", "exportar"] },
  { key: "estadisticas",label: "Estadísticas", acciones: ["ver"] },
  { key: "usuarios",    label: "Usuarios",     acciones: ["ver", "insertar", "actualizar", "eliminar"] },
  { key: "perfiles",    label: "Perfiles",     acciones: ["ver", "insertar", "actualizar", "eliminar"] },
]

const ACCIONES_LABELS: Record<keyof AccionesModulo, string> = {
  ver: "Ver", insertar: "Crear", actualizar: "Editar", eliminar: "Eliminar", cargar: "Importar", exportar: "Exportar"
}

const PERMISOS_VACIO = (): Permisos => ({
  dashboard: {}, pedidos: {}, clientes: {}, inventario: {},
  usuarios: {}, perfiles: {}, estadisticas: {}
})

const PERMISOS_ADMIN = (): Permisos => Object.fromEntries(
  MODULOS.map(m => [m.key, Object.fromEntries(m.acciones.map(a => [a, true]))])
) as unknown as Permisos

export default function PerfilesPage() {
  const theme = useTheme()
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: "", descripcion: "", permisos: PERMISOS_VACIO() })
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
      const permisos = PERMISOS_VACIO()
      MODULOS.forEach(m => {
        const src = (p.permisos as unknown as Record<string, Record<string, boolean>>)[m.key] || {}
        permisos[m.key] = Object.fromEntries(m.acciones.map(a => [a, !!src[a]]))
      })
      setForm({ nombre: p.nombre, descripcion: p.descripcion, permisos })
    } else {
      setEditando(null)
      setForm({ nombre: "", descripcion: "", permisos: PERMISOS_VACIO() })
    }
    setModal(true)
  }

  function cerrar() { setModal(false); setEditando(null); setError("") }

  async function guardar() {
    if (!form.nombre.trim()) return setError("El nombre es requerido")
    setSaving(true); setError("")
    const { error: err } = editando
      ? await supabase.from("perfiles").update(form).eq("id", editando)
      : await supabase.from("perfiles").insert(form)
    setSaving(false)
    if (err) return setError(err.message)
    cerrar(); load()
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este perfil? Asegúrate de que no tenga usuarios asignados.")) return
    await supabase.from("perfiles").delete().eq("id", id)
    load()
  }

  function toggleAccion(modulo: keyof Permisos, accion: keyof AccionesModulo) {
    setForm(f => ({
      ...f,
      permisos: {
        ...f.permisos,
        [modulo]: { ...f.permisos[modulo], [accion]: !f.permisos[modulo][accion] }
      }
    }))
  }

  function toggleModulo(modulo: keyof Permisos, acciones: (keyof AccionesModulo)[]) {
    setForm(f => {
      const todas = acciones.every(a => f.permisos[modulo][a])
      return {
        ...f,
        permisos: {
          ...f.permisos,
          [modulo]: Object.fromEntries(acciones.map(a => [a, !todas]))
        }
      }
    })
  }

  function aplicarPlantilla(tipo: "admin" | "vendedor" | "ninguno") {
    if (tipo === "admin") {
      setForm(f => ({ ...f, permisos: PERMISOS_ADMIN() }))
    } else if (tipo === "vendedor") {
      setForm(f => ({
        ...f,
        permisos: {
          dashboard: { ver: true },
          pedidos: { ver: true, insertar: true, actualizar: true },
          clientes: { ver: true, exportar: true },
          inventario: { ver: true },
          estadisticas: {},
          usuarios: {},
          perfiles: {},
        }
      }))
    } else {
      setForm(f => ({ ...f, permisos: PERMISOS_VACIO() }))
    }
  }

  const inp = { background: theme.cardAlt, border: `1.5px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: "14px", padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const lbl = { display: "block", fontSize: "11px", fontWeight: "bold" as const, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.7px", marginBottom: "6px" }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px", color: theme.text }}>Perfiles y permisos</h2>
          <p style={{ color: theme.muted, fontSize: "13px", margin: 0 }}>{perfiles.length} perfiles configurados</p>
        </div>
        <button onClick={() => abrir()} style={{ padding: "10px 20px", background: "#D72638", color: "white", fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          + Nuevo perfil
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: theme.muted }}>Cargando...</div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {perfiles.map(p => (
            <div key={p.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ fontWeight: "bold", fontSize: "16px", margin: "0 0 4px", color: theme.text }}>{p.nombre}</p>
                  <p style={{ color: theme.muted, fontSize: "13px", margin: 0 }}>{p.descripcion || "Sin descripción"}</p>
                </div>
                <div className="acciones-wrap">
                  <button onClick={() => abrir(p)} style={{ padding: "7px 14px", background: theme.cardAlt, color: theme.text, fontSize: "13px", borderRadius: "6px", border: `1px solid ${theme.border}`, cursor: "pointer" }}>Editar</button>
                  <button onClick={() => eliminar(p.id)} style={{ padding: "7px 14px", background: "rgba(215,38,56,0.1)", color: "#F04455", fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Eliminar</button>
                </div>
              </div>
              <div className="tabla-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <th style={{ padding: "6px 12px", textAlign: "left", color: theme.muted, fontWeight: 600, width: "130px" }}>Módulo</th>
                      {(["ver","insertar","actualizar","eliminar","cargar","exportar"] as (keyof AccionesModulo)[]).map(a => (
                        <th key={a} style={{ padding: "6px 8px", textAlign: "center", color: theme.muted, fontWeight: 600 }}>{ACCIONES_LABELS[a]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS.map(m => {
                      const mp = (p.permisos as unknown as Record<string, Record<string, boolean>>)[m.key] || {}
                      return (
                        <tr key={m.key} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: "6px 12px", fontWeight: 600, color: theme.text }}>{m.label}</td>
                          {(["ver","insertar","actualizar","eliminar","cargar","exportar"] as (keyof AccionesModulo)[]).map(a => (
                            <td key={a} style={{ padding: "6px 8px", textAlign: "center" }}>
                              {m.acciones.includes(a)
                                ? <span style={{ color: mp[a] ? "#22c55e" : theme.border, fontSize: "16px" }}>{mp[a] ? "✓" : "·"}</span>
                                : <span style={{ color: theme.cardAlt }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ background: theme.card, border: `1px solid ${theme.border}`, padding: "24px", maxWidth: "700px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "bold", margin: "0 0 20px", color: theme.text }}>{editando ? "Editar perfil" : "Nuevo perfil"}</h3>
            {error && <div style={{ background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#D72638", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

            <div className="form-grid-2" style={{ marginBottom: "20px" }}>
              <div><label style={lbl}>Nombre del perfil</label><input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Supervisor" /></div>
              <div><label style={lbl}>Descripción</label><input style={inp} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve" /></div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={lbl}>Plantilla rápida</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { key: "admin", label: "Acceso total", color: "#D72638" },
                  { key: "vendedor", label: "Vendedor estándar", color: "#60a5fa" },
                  { key: "ninguno", label: "Sin permisos", color: theme.muted },
                ].map(t => (
                  <button key={t.key} onClick={() => aplicarPlantilla(t.key as "admin" | "vendedor" | "ninguno")}
                    style={{ padding: "7px 14px", background: theme.cardAlt, color: t.color, fontSize: "13px", fontWeight: 600, borderRadius: "6px", border: `1px solid ${t.color}40`, cursor: "pointer" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <label style={lbl}>Permisos por módulo</label>
            <div style={{ background: theme.cardAlt, borderRadius: "10px", overflow: "hidden", marginBottom: "24px" }}>
              <div className="tabla-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, background: theme.card }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", color: theme.muted, fontWeight: 700, textTransform: "uppercase", width: "140px" }}>Módulo</th>
                      {(["ver","insertar","actualizar","eliminar","cargar","exportar"] as (keyof AccionesModulo)[]).map(a => (
                        <th key={a} style={{ padding: "10px 8px", textAlign: "center", fontSize: "11px", color: theme.muted, fontWeight: 700, textTransform: "uppercase" }}>{ACCIONES_LABELS[a]}</th>
                      ))}
                      <th style={{ padding: "10px 8px", textAlign: "center", fontSize: "11px", color: theme.muted, fontWeight: 700, textTransform: "uppercase" }}>Todo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS.map((m, idx) => {
                      const todasActivas = m.acciones.every(a => form.permisos[m.key][a])
                      return (
                        <tr key={m.key} style={{ borderBottom: `1px solid ${theme.border}`, background: idx % 2 === 0 ? "transparent" : `${theme.border}` }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: "13px", color: theme.text }}>{m.label}</td>
                          {(["ver","insertar","actualizar","eliminar","cargar","exportar"] as (keyof AccionesModulo)[]).map(a => (
                            <td key={a} style={{ padding: "10px 8px", textAlign: "center" }}>
                              {m.acciones.includes(a) ? (
                                <div onClick={() => toggleAccion(m.key, a)}
                                  style={{ width: "22px", height: "22px", borderRadius: "6px", background: form.permisos[m.key][a] ? "#22c55e" : theme.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto", transition: "background 0.15s" }}>
                                  {form.permisos[m.key][a] && <span style={{ color: "white", fontSize: "13px", fontWeight: "bold" }}>✓</span>}
                                </div>
                              ) : (
                                <span style={{ color: theme.border, fontSize: "18px" }}>—</span>
                              )}
                            </td>
                          ))}
                          <td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <div onClick={() => toggleModulo(m.key, m.acciones)}
                              style={{ width: "22px", height: "22px", borderRadius: "6px", background: todasActivas ? "#D72638" : theme.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto", transition: "background 0.15s" }}>
                              {todasActivas && <span style={{ color: "white", fontSize: "13px", fontWeight: "bold" }}>✓</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              <button onClick={cerrar} style={{ flex: 1, padding: "11px", background: theme.cardAlt, color: theme.text, fontWeight: 600, fontSize: "14px", borderRadius: "8px", border: `1px solid ${theme.border}`, cursor: "pointer" }}>Cancelar</button>
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
