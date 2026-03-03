"use client"

import React, {createContext, useContext, useEffect, useMemo, useState} from "react"

export type CartItem = {
  key: string
  productId: string
  title: string
  slug: string
  price: number | null
  image: any | null
  qty: number
}

type CartCtx = {
  items: CartItem[]
  add: (x: Omit<CartItem, "key" | "qty"> & {qty?: number}) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  subtotal: number
}

const Ctx = createContext<CartCtx | null>(null)

const LS_KEY = "c2r_cart_v1"

function safeParse(s: string | null) {
  if (!s) return []
  try {
    const j = JSON.parse(s)
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export function CartProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const fromLS = safeParse(typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null)
    setItems(fromLS)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(LS_KEY, JSON.stringify(items))
  }, [items])

  const api = useMemo<CartCtx>(() => {
    return {
      items,

      add(x) {
        const qty = Math.max(1, Math.floor(Number(x.qty ?? 1)))
        const key = `${x.productId}`

        setItems((prev) => {
          const idx = prev.findIndex((p) => p.key === key)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = {...copy[idx], qty: copy[idx].qty + qty}
            return copy
          }
          return [
            ...prev,
            {
              key,
              productId: x.productId,
              title: x.title,
              slug: x.slug,
              price: typeof x.price === "number" ? x.price : null,
              image: x.image ?? null,
              qty,
            },
          ]
        })
      },

      setQty(key, qty) {
        const q = Math.max(1, Math.floor(Number(qty || 1)))
        setItems((prev) => prev.map((p) => (p.key === key ? {...p, qty: q} : p)))
      },

      remove(key) {
        setItems((prev) => prev.filter((p) => p.key !== key))
      },

      clear() {
        setItems([])
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LS_KEY)
        }
      },

      subtotal: prevSubtotal(items),
    }
  }, [items])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

function prevSubtotal(items: CartItem[]) {
  let sum = 0
  for (const x of items) {
    if (typeof x.price === "number") sum += x.price * x.qty
  }
  return Math.round(sum * 100) / 100
}

export function useCart() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useCart must be used inside <CartProvider>")
  return v
}