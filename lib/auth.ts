import { supabase } from './supabase'
import { Usuario } from './types'

export async function login(usuario: string, password: string): Promise<{ data: Usuario | null, error: string | null }> {
  console.log('[login] intentando con usuario:', usuario)

  const { data, error } = await supabase
    .from('usuarios')
    .select('*, perfil:perfiles(*)')
    .eq('usuario', usuario)
    .eq('activo', true)
    .single()

  console.log('[login] respuesta Supabase → data:', data, '| error:', error)

  if (error || !data) return { data: null, error: 'Usuario o contrasena incorrectos' }

  console.log('[login] password_hash en BD:', data.password_hash, '| ingresado:', password, '| coincide:', data.password_hash === password)

  if (data.password_hash !== password) return { data: null, error: 'Usuario o contrasena incorrectos' }

  localStorage.setItem('distrimas_user', JSON.stringify(data))
  return { data, error: null }
}

export function getSession(): Usuario | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('distrimas_user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function logout() {
  localStorage.removeItem('distrimas_user')
}

export function hasPermission(usuario: Usuario, modulo: string): boolean {
  const permisos = usuario.perfil?.permisos
  if (!permisos) return false
  return permisos[modulo as keyof typeof permisos] === true
}
