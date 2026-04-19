"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/lib/theme-context"

interface Config {
  id: string
  nombre_empresa: string
  logo_url: string
  whatsapp_numero: string
}

export default function ConfiguracionesPage() {
  const theme = useTheme()
  const [config, setConfig] = useState<Config | null>(null)
  const [form, setForm]     = useState({ nombre_empresa: "", logo_url: "", whatsapp_numero: "" })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from("configuraciones").select("*").limit(1).single()
    if (data) {
      setConfig(data)
      setForm({ nombre_empresa: data.nombre_empresa, logo_url: data.logo_url, whatsapp_numero: data.whatsapp_numero })
    }
    setLoading(false)
  }

  async function guardar() {
    setSaving(true); setMsg(null)
    const payload = { ...form, updated_at: new Date().toISOString() }
    const { error } = config
      ? await supabase.from("configuraciones").update(payload).eq("id", config.id)
      : await supabase.from("configuraciones").insert(payload)
    setSaving(false)
    if (error) { setMsg({ ok: false, text: "Error: " + error.message }); return }
    setMsg({ ok: true, text: "Configuración guardada correctamente" })
    load()
  }

  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "14px",
    padding: "24px",
    boxShadow: theme.dark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
    marginBottom: "20px",
  }

  const inp = {
    background: theme.cardAlt,
    border: `1.5px solid ${theme.border}`,
    borderRadius: "8px",
    color: theme.text,
    fontSize: "14px",
    padding: "10px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  }

  const lbl = {
    display: "block",
    fontSize: "11px",
    fontWeight: "bold" as const,
    color: theme.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    marginBottom: "6px",
  }

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: theme.muted }}>Cargando...</div>

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px", color: theme.text }}>Configuraciones</h2>
        <p style={{ color: theme.muted, fontSize: "13px", margin: 0 }}>Ajustes generales del sistema</p>
      </div>

      {msg && (
        <div style={{
          background: msg.ok ? "rgba(34,197,94,0.1)" : "rgba(215,38,56,0.1)",
          border: `1px solid ${msg.ok ? "rgba(34,197,94,0.3)" : "rgba(215,38,56,0.3)"}`,
          color: msg.ok ? "#16a34a" : "#D72638",
          borderRadius: "8px", padding: "10px 16px", fontSize: "13px", marginBottom: "20px", fontWeight: 600,
        }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* ── EMPRESA ── */}
      <div style={card}>
        <p style={{ fontSize: "14px", fontWeight: "bold", color: theme.text, margin: "0 0 20px" }}>🏢 Datos de la empresa</p>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={lbl}>Nombre de la empresa</label>
            <input style={inp} value={form.nombre_empresa} onChange={e => setForm(f => ({ ...f, nombre_empresa: e.target.value }))} placeholder="Distrimas SC" />
          </div>
          <div>
            <label style={lbl}>URL del logo</label>
            <input style={inp} value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
            <p style={{ fontSize: "12px", color: theme.muted, margin: "6px 0 0" }}>Pega el enlace público de tu logo (Supabase Storage, Imgur, etc.)</p>
          </div>
          {form.logo_url && (
            <div style={{ padding: "16px", background: theme.cardAlt, borderRadius: "10px", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={form.logo_url} alt="Logo preview" style={{ height: "60px", maxWidth: "160px", objectFit: "contain", borderRadius: "6px" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: "0 0 2px" }}>Vista previa del logo</p>
                <p style={{ fontSize: "12px", color: theme.muted, margin: 0 }}>Así se verá en el sistema</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── WHATSAPP ── */}
      <div style={card}>
        <p style={{ fontSize: "14px", fontWeight: "bold", color: theme.text, margin: "0 0 6px" }}>📱 WhatsApp para pedidos</p>
        <p style={{ fontSize: "12px", color: theme.muted, margin: "0 0 20px" }}>
          Al confirmar un pedido, el vendedor podrá enviarlo por WhatsApp a este número.
        </p>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={lbl}>Número de WhatsApp</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: theme.muted }}>+</span>
              <input
                style={{ ...inp, paddingLeft: "26px" }}
                value={form.whatsapp_numero}
                onChange={e => setForm(f => ({ ...f, whatsapp_numero: e.target.value.replace(/\D/g, "") }))}
                placeholder="573001234567"
                maxLength={15}
              />
            </div>
            <p style={{ fontSize: "12px", color: theme.muted, margin: "6px 0 0" }}>
              Código de país + número, sin espacios ni guiones. Ej: <strong>573001234567</strong>
            </p>
          </div>

          {form.whatsapp_numero && (
            <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a", margin: "0 0 4px" }}>✓ Número configurado</p>
              <p style={{ fontSize: "12px", color: theme.muted, margin: 0 }}>
                Los pedidos se enviarán a: <strong>+{form.whatsapp_numero}</strong>
              </p>
            </div>
          )}

          {/* Formato del mensaje */}
          <div style={{ padding: "14px 16px", background: theme.cardAlt, borderRadius: "10px", border: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: theme.muted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Formato del mensaje que se enviará</p>
            <pre style={{ fontSize: "12px", color: theme.muted, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "monospace" }}>{`🏪 PEDIDO - ${form.nombre_empresa || "Empresa"}

📋 Cliente: [Nombre tienda]
📍 Municipio: [Ciudad]
👤 Vendedor: [Nombre]
📅 Fecha: [Fecha]

PRODUCTOS:
• [Producto] x[cant] - $[precio] = $[subtotal]
...

💰 TOTAL: $[total]`}</pre>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <button
        onClick={guardar}
        disabled={saving}
        style={{ width: "100%", padding: "13px", background: "#D72638", color: "white", fontWeight: 700, fontSize: "15px", borderRadius: "10px", border: "none", cursor: "pointer", opacity: saving ? 0.7 : 1 }}
      >
        {saving ? "Guardando..." : "Guardar configuración"}
      </button>
    </div>
  )
}
