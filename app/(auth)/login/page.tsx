"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError("")
    if (!usuario.trim()) { setError("Por favor ingresa tu usuario"); return }
    if (!password.trim()) { setError("Por favor ingresa tu contrasena"); return }
    setLoading(true)
    const { data, error: err } = await login(usuario.trim(), password)
    setLoading(false)
    if (err || !data) { setError(err || "Error al iniciar sesion"); return }
    router.push("/")
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F1117",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"44px 44px"}} />
      <div style={{position:"absolute",top:"-200px",right:"-100px",width:"600px",height:"600px",borderRadius:"50%",background:"radial-gradient(circle,rgba(215,38,56,0.15) 0%,transparent 65%)"}} />
      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:"420px",margin:"0 16px",background:"#171B25",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"20px",padding:"40px 44px",boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"36px"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"#D72638",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"bold",fontSize:"20px",flexShrink:0}}>D</div>
          <div>
            <p style={{fontWeight:"bold",color:"white",fontSize:"18px",margin:0}}>Distrimas SC</p>
            <p style={{color:"#8B91A8",fontSize:"12px",margin:0}}>Sistema de Gestion</p>
          </div>
        </div>
        <h1 style={{fontSize:"26px",fontWeight:"bold",color:"white",margin:"0 0 6px"}}>Bienvenido</h1>
        <p style={{color:"#8B91A8",fontSize:"14px",margin:"0 0 32px"}}>Ingresa tus credenciales para continuar</p>
        {error && <div style={{background:"rgba(215,38,56,0.1)",border:"1px solid rgba(215,38,56,0.25)",color:"#F04455",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",marginBottom:"16px"}}>{error}</div>}
        <div style={{marginBottom:"20px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"bold",color:"#8B91A8",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:"8px"}}>Usuario</label>
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} onKeyDown={e => e.key==="Enter" && document.getElementById("inp-pass")?.focus()} placeholder="Tu usuario"
            style={{width:"100%",padding:"13px 14px",background:"#1E2330",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:"8px",color:"white",fontSize:"15px",outline:"none",boxSizing:"border-box"}} />
        </div>
        <div style={{marginBottom:"24px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"bold",color:"#8B91A8",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:"8px"}}>Contrasena</label>
          <input id="inp-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="********"
            style={{width:"100%",padding:"13px 14px",background:"#1E2330",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:"8px",color:"white",fontSize:"15px",outline:"none",boxSizing:"border-box"}} />
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"14px",background:"#D72638",color:"white",fontWeight:"600",fontSize:"15px",borderRadius:"8px",border:"none",cursor:"pointer",opacity:loading?0.6:1}}>
          {loading ? "Iniciando sesion..." : "Iniciar sesion"}
        </button>
      </div>
    </div>
  )
}
