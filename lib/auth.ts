import { supabase } from './supabase'
import { Usuario, AccionesModulo } from './types'

export async function login(usuario: string, password: string): Promise<{ data: Usuario | null, error: string | null }> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, perfil:perfiles(*)')
    .eq('usuario', usuario)
    .eq('activo', true)
    .single()

  if (error || !data) return { data: null, error: 'Usuario o contrasena incorrectos' }
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

export function hasPermission(usuario: Usuario, modulo: string, accion: keyof AccionesModulo = 'ver'): boolean {
  if (usuario.perfil?.nombre === 'Administrador') return true
  const permisos = usuario.perfil?.permisos
  if (!permisos) return false
  const modPermisos = permisos[modulo as keyof typeof permisos]
  if (!modPermisos) return false
  return modPermisos[accion] === true
}
