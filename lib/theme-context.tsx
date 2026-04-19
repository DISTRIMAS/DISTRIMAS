"use client"
import { createContext, useContext } from "react"

export interface Theme {
  dark: boolean
  bg: string
  card: string
  cardAlt: string
  border: string
  text: string
  muted: string
}

export const DARK: Theme = {
  dark: true,
  bg: "#0F1117",
  card: "#171B25",
  cardAlt: "#1E2330",
  border: "rgba(255,255,255,0.07)",
  text: "#F0F2F7",
  muted: "#8B91A8",
}

export const LIGHT: Theme = {
  dark: false,
  bg: "#F4F5F8",
  card: "#FFFFFF",
  cardAlt: "#ECEEF4",
  border: "rgba(0,0,0,0.08)",
  text: "#141720",
  muted: "#6B7280",
}

export const ThemeContext = createContext<Theme>(DARK)
export const useTheme = () => useContext(ThemeContext)
