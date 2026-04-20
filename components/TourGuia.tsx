"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Usuario } from "@/lib/types"

interface Paso {
  icono: string
  titulo: string
  desc: string
  ilustracion: React.ReactNode
}

function Manito({ x, y, clickAnim }: { x: number; y: number; clickAnim: boolean }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, fontSize: "28px", zIndex: 10,
      animation: clickAnim ? "manitoClick 0.5s ease infinite" : "manitoFloat 2s ease-in-out infinite",
      transformOrigin: "center bottom", pointerEvents: "none",
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
    }}>☝️</div>
  )
}

// Ilustración: Dashboard
function IlustracionDashboard() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
        {[
          { label: "Pedidos hoy", val: "12", color: "#D72638" },
          { label: "Ventas mes", val: "$4.2M", color: "#22c55e" },
          { label: "Clientes", val: "87", color: "#3b82f6" },
          { label: "Stock bajo", val: "3", color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>{c.label}</p>
            <p style={{ fontSize: "16px", fontWeight: 800, color: c.color, margin: 0 }}>{c.val}</p>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>PEDIDOS ÚLTIMOS 30 DÍAS</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "36px" }}>
          {[14, 8, 20, 12, 18, 22, 16, 10, 24, 18].map((h, i) => (
            <div key={i} style={{ flex: 1, background: `rgba(215,38,56,${0.4 + i * 0.06})`, borderRadius: "3px 3px 0 0", height: `${(h / 24) * 100}%` }} />
          ))}
        </div>
      </div>
      <Manito x={30} y={10} clickAnim={false} />
    </div>
  )
}

// Ilustración: Nuevo pedido
function IlustracionPedido() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>CLIENTE</p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "5px", padding: "5px 8px", fontSize: "10px", color: "white" }}>Tienda El Progreso</div>
          <div style={{ background: "#D72638", borderRadius: "5px", padding: "4px 6px", fontSize: "16px", fontWeight: 800, color: "white" }}>C-042</div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>PRODUCTOS</p>
        {[{ n: "Arroz Diana 5kg", q: 3, p: "$18.000" }, { n: "Aceite 3L", q: 2, p: "$22.000" }].map(item => (
          <div key={item.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)" }}>{item.n}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ background: "rgba(215,38,56,0.3)", borderRadius: "4px", padding: "1px 5px", fontSize: "10px", color: "white" }}>-</div>
              <span style={{ fontSize: "10px", color: "white", fontWeight: 700 }}>{item.q}</span>
              <div style={{ background: "rgba(215,38,56,0.3)", borderRadius: "4px", padding: "1px 5px", fontSize: "10px", color: "white" }}>+</div>
              <span style={{ fontSize: "9px", color: "#22c55e", marginLeft: "2px" }}>{item.p}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "#D72638", borderRadius: "8px", padding: "7px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "white" }}>
        ✓ Confirmar pedido
      </div>
      <Manito x={120} y={115} clickAnim={true} />
    </div>
  )
}

// Ilustración: Lista de pedidos con filtro fecha
function IlustracionListaPedidos() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        {["Hoy", "Esta semana", "Este mes"].map((btn, i) => (
          <div key={btn} style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "9px", fontWeight: 600, background: i === 0 ? "#D72638" : "rgba(255,255,255,0.08)", color: i === 0 ? "white" : "rgba(255,255,255,0.6)" }}>{btn}</div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { cliente: "Tienda La Esperanza", total: "$320.000", estado: "confirmado", color: "#3b82f6" },
          { cliente: "Distribuidora Norte", total: "$185.000", estado: "entregado", color: "#22c55e" },
          { cliente: "Supermercado El Rey", total: "$540.000", estado: "borrador", color: "#6B7280" },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)" }}>{p.cliente}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "white" }}>{p.total}</span>
              <span style={{ padding: "2px 6px", borderRadius: "99px", fontSize: "8px", fontWeight: 600, background: `${p.color}22`, color: p.color }}>{p.estado}</span>
            </div>
          </div>
        ))}
      </div>
      <Manito x={10} y={2} clickAnim={false} />
    </div>
  )
}

// Ilustración: Clientes
function IlustracionClientes() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 10px", marginBottom: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "12px" }}>🔍</span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Buscar por nombre, código...</span>
      </div>
      {[
        { cod: "C-001", nombre: "Tienda El Progreso", municipio: "Montería" },
        { cod: "C-042", nombre: "Distribuidora Norte", municipio: "Cereté" },
        { cod: "C-078", nombre: "Supermercado El Rey", municipio: "Lorica" },
      ].map(c => (
        <div key={c.cod} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "7px", marginBottom: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(215,38,56,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#D72638", flexShrink: 0 }}>{c.cod.split("-")[1]}</div>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 600, color: "white", margin: 0 }}>{c.nombre}</p>
            <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", margin: 0 }}>{c.municipio}</p>
          </div>
        </div>
      ))}
      <Manito x={140} y={28} clickAnim={false} />
    </div>
  )
}

// Ilustración: Inventario
function IlustracionInventario() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "6px 10px", marginBottom: "8px" }}>
        <p style={{ fontSize: "9px", color: "#f59e0b", fontWeight: 700, margin: 0 }}>⚠️ 2 productos con stock bajo</p>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { nombre: "Arroz Diana 5kg", stock: 45, min: 20, ok: true },
          { nombre: "Aceite Palma 3L", stock: 8, min: 15, ok: false },
          { nombre: "Sal Refisal 500g", stock: 2, min: 10, ok: false },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: p.ok ? "transparent" : "rgba(245,158,11,0.04)" }}>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)" }}>{p.nombre}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: p.ok ? "#22c55e" : "#f59e0b" }}>{p.stock}</span>
              <span style={{ padding: "2px 6px", borderRadius: "99px", fontSize: "8px", fontWeight: 600, background: p.ok ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", color: p.ok ? "#22c55e" : "#f59e0b" }}>
                {p.ok ? "OK" : "Bajo"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Manito x={60} y={50} clickAnim={false} />
    </div>
  )
}

// Ilustración: WhatsApp
function IlustracionWhatsApp() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "10px", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "18px" }}>💬</span>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#25D366", margin: 0 }}>WhatsApp</p>
            <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", margin: 0 }}>+57 301 653 7553</p>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px", fontFamily: "monospace", fontSize: "8px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>🏪 <b>PEDIDO - Distrimas SC</b></p>
          <p style={{ margin: 0 }}>📋 Cliente: Tienda El Progreso</p>
          <p style={{ margin: 0 }}>📍 Municipio: Montería</p>
          <p style={{ margin: 0 }}>👤 Vendedor: Carlos</p>
          <p style={{ margin: 0 }}>📅 Fecha: 19 abr · 10:24 a.m.</p>
          <p style={{ margin: 0 }}>─────────────────</p>
          <p style={{ margin: 0 }}>• Arroz Diana x3 = $54.000</p>
          <p style={{ margin: 0 }}>• Aceite Palma x2 = $44.000</p>
          <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#25D366" }}>💰 TOTAL: $98.000</p>
        </div>
      </div>
      <Manito x={110} y={100} clickAnim={true} />
    </div>
  )
}

// Ilustración: Configuraciones
function IlustracionConfig() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {[
        { label: "Nombre empresa", val: "Distrimas SC" },
        { label: "WhatsApp pedidos", val: "+57 301 653 7553" },
        { label: "Logo URL", val: "supabase.co/..." },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: "8px" }}>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3px" }}>{f.label}</p>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>{f.val}</div>
        </div>
      ))}
      <div style={{ background: "#D72638", borderRadius: "8px", padding: "7px", textAlign: "center", fontSize: "10px", fontWeight: 700, color: "white", marginTop: "4px" }}>
        💾 Guardar configuración
      </div>
      <Manito x={90} y={108} clickAnim={true} />
    </div>
  )
}

const PASOS: Paso[] = [
  {
    icono: "👋",
    titulo: "¡Bienvenido a Distrimas SC!",
    desc: "Este instructivo te explicará paso a paso cómo usar el sistema. Gestiona pedidos, clientes e inventario desde un solo lugar.",
    ilustracion: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
        <div style={{ fontSize: "60px", animation: "manitoFloat 2s ease-in-out infinite" }}>🏪</div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", textAlign: "center", lineHeight: 1.6, margin: 0 }}>Sistema de gestión de<br />pedidos, clientes e inventario</p>
      </div>
    ),
  },
  {
    icono: "📊",
    titulo: "Dashboard — Tu panel principal",
    desc: "Al entrar verás las estadísticas del día: pedidos realizados, ventas del mes, clientes activos y alertas de stock bajo. Hay gráficos de barras con los pedidos de los últimos 30 días.",
    ilustracion: <IlustracionDashboard />,
  },
  {
    icono: "🛒",
    titulo: "Crear un pedido nuevo",
    desc: "Ve a 'Nuevo pedido' en el menú. Busca el cliente por nombre o código (el código aparece en rojo y grande). Agrega productos con el botón + y ajusta cantidades. Si un producto supera el stock disponible, aparecerá una advertencia.",
    ilustracion: <IlustracionPedido />,
  },
  {
    icono: "💬",
    titulo: "Confirmar y enviar por WhatsApp",
    desc: "Al hacer clic en 'Confirmar pedido', el sistema guarda el pedido y abre WhatsApp automáticamente con el detalle completo: cliente, productos, cantidades, precios, total, vendedor y hora exacta.",
    ilustracion: <IlustracionWhatsApp />,
  },
  {
    icono: "📋",
    titulo: "Lista de pedidos",
    desc: "En 'Pedidos' ves todos los pedidos del día (por defecto). Usa los botones Hoy / Esta semana / Este mes para filtrar. Haz clic en cualquier pedido para ver el detalle completo, cambiar su estado o editarlo.",
    ilustracion: <IlustracionListaPedidos />,
  },
  {
    icono: "👥",
    titulo: "Clientes",
    desc: "Aquí están todas las tiendas asignadas. Busca por nombre, municipio o código. El código del cliente es el número que aparece en grande para identificarlo rápidamente al hacer pedidos.",
    ilustracion: <IlustracionClientes />,
  },
  {
    icono: "📦",
    titulo: "Inventario",
    desc: "Consulta el stock de cada producto. Los productos en amarillo tienen stock bajo. En el Dashboard aparece una alerta automática cuando un producto se agota o está por agotarse.",
    ilustracion: <IlustracionInventario />,
  },
  {
    icono: "⚙️",
    titulo: "Configuraciones (solo admin)",
    desc: "El administrador puede actualizar el nombre de la empresa, subir el logo y configurar el número de WhatsApp al que llegan todos los pedidos confirmados.",
    ilustracion: <IlustracionConfig />,
  },
  {
    icono: "✅",
    titulo: "¡Ya estás listo para empezar!",
    desc: "Recuerda: si tienes alguna duda o problema técnico, contáctanos por WhatsApp. ¡Mucho éxito en tus ventas!",
    ilustracion: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "14px" }}>
        <div style={{ fontSize: "58px" }}>🚀</div>
        <button
          onClick={() => window.open("https://wa.me/573016537553", "_blank")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "10px", color: "#25D366", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >
          <span>💬</span> Soporte JD — WhatsApp
        </button>
      </div>
    ),
  },
]

export default function TourGuia({ user, onClose }: { user: Usuario; onClose: () => void }) {
  const [paso, setPaso] = useState(0)
  const p = PASOS[paso]
  const ultimo = paso === PASOS.length - 1
  const progreso = ((paso + 1) / PASOS.length) * 100

  async function finalizar() {
    await supabase.from("usuarios").update({ primer_ingreso: false }).eq("id", user.id)
    const raw = localStorage.getItem("distrimas_user")
    if (raw) localStorage.setItem("distrimas_user", JSON.stringify({ ...JSON.parse(raw), primer_ingreso: false }))
    onClose()
  }

  function siguiente() { if (!ultimo) setPaso(p2 => p2 + 1) }
  function anterior()  { if (paso > 0) setPaso(p2 => p2 - 1) }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{
        background: "#171B25", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px", width: "100%", maxWidth: "720px",
        overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Barra de progreso */}
        <div style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: "100%", width: `${progreso}%`, background: "#D72638", borderRadius: "99px", transition: "width 0.4s ease" }} />
        </div>

        <div style={{ display: "flex", minHeight: "380px" }}>
          {/* Panel izquierdo — ilustración */}
          <div style={{
            width: "260px", flexShrink: 0,
            background: "linear-gradient(160deg, #1E2330 0%, #141720 100%)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "24px 20px", position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            {/* Decoración de fondo */}
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(215,38,56,0.06)" }} />
            <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(215,38,56,0.04)" }} />

            <div style={{ position: "relative", flex: 1 }}>
              {p.ilustracion}
            </div>
          </div>

          {/* Panel derecho — contenido */}
          <div style={{ flex: 1, padding: "28px 28px 24px", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(215,38,56,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                  {p.icono}
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#555C74", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Paso {paso + 1} de {PASOS.length}
                  </p>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "white", lineHeight: 1.3 }}>{p.titulo}</h3>
                </div>
              </div>
              <button onClick={finalizar} style={{ background: "none", border: "none", cursor: "pointer", color: "#555C74", fontSize: "18px", padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>

            {/* Descripción */}
            <p style={{ color: "#8B91A8", fontSize: "14px", lineHeight: 1.7, margin: "0 0 auto", flex: 1 }}>{p.desc}</p>

            {/* Indicadores de paso */}
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", margin: "20px 0 16px" }}>
              {PASOS.map((_, i) => (
                <button key={i} onClick={() => setPaso(i)} style={{
                  width: i === paso ? "24px" : "8px", height: "8px",
                  borderRadius: "99px", border: "none", cursor: "pointer",
                  background: i === paso ? "#D72638" : i < paso ? "rgba(215,38,56,0.4)" : "#2A3044",
                  transition: "all 0.3s", padding: 0,
                }} />
              ))}
            </div>

            {/* Botones */}
            <div style={{ display: "flex", gap: "10px" }}>
              {paso > 0 && (
                <button onClick={anterior} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.06)", color: "#F0F2F7", fontWeight: 600, fontSize: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                  ← Anterior
                </button>
              )}
              <button onClick={ultimo ? finalizar : siguiente} style={{
                flex: 1, padding: "11px",
                background: ultimo ? "linear-gradient(135deg, #22c55e, #16a34a)" : "#D72638",
                color: "white", fontWeight: 700, fontSize: "14px",
                borderRadius: "10px", border: "none", cursor: "pointer",
                boxShadow: ultimo ? "0 4px 14px rgba(34,197,94,0.3)" : "0 4px 14px rgba(215,38,56,0.3)",
              }}>
                {ultimo ? "¡Comenzar ahora! 🚀" : "Siguiente →"}
              </button>
            </div>

            {!ultimo && (
              <button onClick={finalizar} style={{ background: "none", border: "none", cursor: "pointer", color: "#555C74", fontSize: "12px", marginTop: "10px", width: "100%", padding: 0 }}>
                Saltar tutorial
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes manitoFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes manitoClick {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(0.75) translateY(4px); }
        }
      `}</style>
    </div>
  )
}
