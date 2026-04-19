"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario]   = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [verPass, setVerPass]   = useState(false)

  async function handleLogin() {
    setError("")
    if (!usuario.trim()) { setError("Por favor ingresa tu usuario"); return }
    if (!password.trim()) { setError("Por favor ingresa tu contraseña"); return }
    setLoading(true)
    const { data, error: err } = await login(usuario.trim(), password)
    setLoading(false)
    if (err || !data) { setError(err || "Error al iniciar sesión"); return }
    router.push("/")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F4F5F8", position: "relative", overflow: "hidden" }}>

      {/* Panel izquierdo — decorativo (solo desktop) */}
      <div className="login-left" style={{ flex: 1, background: "linear-gradient(135deg, #D72638 0%, #a01c29 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", position: "relative", overflow: "hidden" }}>
        {/* Círculos decorativos */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: "40%", right: "-30px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "32px", margin: "0 auto 24px" }}>D</div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "white", margin: "0 0 12px" }}>Distrimas SC</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", margin: "0 0 40px", lineHeight: 1.6 }}>Sistema de gestión de pedidos,<br />clientes e inventario</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
            {["Pedidos en tiempo real", "Control de inventario", "Estadísticas de ventas", "Gestión de clientes"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "11px", fontWeight: "bold" }}>✓</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: "white" }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>

          {/* Logo móvil (solo en mobile, el panel izq está oculto) */}
          <div className="login-mobile-logo" style={{ display: "none", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#D72638", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px" }}>D</div>
            <div>
              <p style={{ fontWeight: "bold", color: "#141720", fontSize: "16px", margin: 0 }}>Distrimas SC</p>
              <p style={{ color: "#6B7280", fontSize: "11px", margin: 0 }}>Sistema de gestión</p>
            </div>
          </div>

          <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "#141720", margin: "0 0 6px" }}>Iniciar sesión</h2>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 32px" }}>Ingresa tus credenciales para continuar</p>

          {error && (
            <div style={{ background: "rgba(215,38,56,0.08)", border: "1px solid rgba(215,38,56,0.25)", color: "#D72638", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "20px", fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Usuario */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              onKeyDown={e => e.key === "Enter" && document.getElementById("inp-pass")?.focus()}
              placeholder="Tu nombre de usuario"
              style={{ width: "100%", padding: "12px 14px", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: "8px", color: "#141720", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "#D72638"; e.target.style.background = "#fff" }}
              onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.background = "#F9FAFB" }}
            />
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                id="inp-pass"
                type={verPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                style={{ width: "100%", padding: "12px 44px 12px 14px", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: "8px", color: "#141720", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = "#D72638"; e.target.style.background = "#fff" }}
                onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.background = "#F9FAFB" }}
              />
              <button type="button" onClick={() => setVerPass(v => !v)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "18px", padding: 0 }}>
                {verPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width: "100%", padding: "13px", background: "#D72638", color: "white", fontWeight: 700, fontSize: "15px", borderRadius: "8px", border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "12px", marginTop: "24px" }}>
            © {new Date().getFullYear()} Distrimas SC — Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
