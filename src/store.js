import { reactive, computed, watch } from 'vue'
import { MENU, DISCOUNTS } from './data'

const KEY = 'kainan-vue'
const fresh = () => ({ orders: [], seq: 100, stock: {} })

let saved = fresh()
try {
  const raw = localStorage.getItem(KEY)
  if (raw) saved = JSON.parse(raw)
} catch {}

export const s = reactive({
  ...saved,
  view: 'floor', type: 'Dine-in', table: 1, cart: [], discount: 'None', sending: false,
  now: Date.now(), toast: '', last: null, log: [],
  authenticated: false, userName: 'Guest',
})

// ---------- derived state ----------
s.calc = computed(() => {
  const sub = s.cart.reduce((t, l) => t + l.qty * l.price, 0)
  const disc = sub * DISCOUNTS[s.discount]
  const net = sub - disc
  const service = s.type === 'Dine-in' ? net * 0.1 : 0
  const total = net + service
  return { sub, disc, service, total, vat: (total * 12) / 112 } // VAT is included in prices
})
s.kitchen = computed(() => s.orders.filter((o) => ['New', 'Preparing', 'Ready'].includes(o.status)))
s.unpaid = computed(() => s.orders.filter((o) => !o.paid && o.status !== 'Cancelled'))
s.paid = computed(() => s.orders.filter((o) => o.paid))
s.sales = computed(() => s.paid.reduce((t, o) => t + o.total, 0))
s.topItems = computed(() => {
  const t = {}
  s.paid.forEach((o) => o.lines.forEach((l) => (t[l.name] = (t[l.name] || 0) + l.qty)))
  return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 4)
})
s.lowStock = computed(() => MENU.filter((m) => (s.stock[m.id] ?? m.stock) <= 5))

// ---------- persistence + timer ----------
watch(
  () => ({ orders: s.orders, seq: s.seq }),
  (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} },
  { deep: true }
)
setInterval(() => (s.now = Date.now()), 20000)

// ---------- helpers ----------
export const money = (n) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function say(text) {
  s.toast = text
  setTimeout(() => (s.toast = ''), 2200)
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${response.status}).`)
  }
  return response.status === 204 ? null : response.json()
}

function syncMenu(rows) {
  const items = rows.map((row) => ({ ...row, cat: row.category ?? row.cat }))
  MENU.splice(0, MENU.length, ...items)
  s.stock = Object.fromEntries(items.map((item) => [item.id, item.stock]))
}

export async function refreshMenu() {
  try {
    syncMenu(await api('/api/menu'))
  } catch (error) {
    say(`Menu API unavailable: ${error.message}`)
  }
}

export async function createMenuItem(values) {
  const item = await api('/api/menu', { method: 'POST', body: JSON.stringify(values) })
  syncMenu([...MENU, item])
  return item
}

export async function updateMenuItem(id, values) {
  const item = await api(`/api/menu/${id}`, { method: 'PUT', body: JSON.stringify(values) })
  syncMenu(MENU.map((existing) => existing.id === item.id ? item : existing))
  return item
}

export async function deleteMenuItem(id) {
  await api(`/api/menu/${id}`, { method: 'DELETE' })
  syncMenu(MENU.filter((item) => item.id !== Number(id)))
  s.cart = s.cart.filter((line) => line.id !== Number(id))
}

function syncStockItem(row) {
  const item = { ...row, cat: row.category ?? row.cat }
  const index = MENU.findIndex((entry) => entry.id === item.id)
  if (index !== -1) MENU.splice(index, 1, item)
  s.stock[item.id] = item.stock
}

export function login(name = 'Staff') {
  s.authenticated = true
  s.userName = name || 'Staff'
  say('Welcome back')
}

export function logout() {
  s.authenticated = false
  s.userName = 'Guest'
  s.view = 'floor'
  say('Logged out')
}

/** Reads details from the DOM Event object and records them for the inspector. */
export function capture(event, label) {
  const t = event.target
  s.last = {
    action: label,
    type: event.type,
    target: t.tagName + (t.dataset?.id ? ` [data-id=${t.dataset.id}]` : ''),
    currentTarget: event.currentTarget ? event.currentTarget.tagName : null,
    text: (t.innerText || t.value || '').toString().slice(0, 30),
    position: event.clientX !== undefined ? { x: event.clientX, y: event.clientY } : undefined,
    key: event.key,
    defaultPrevented: event.defaultPrevented,
    timeStamp: Math.round(event.timeStamp),
  }
  s.log = [`${event.type} → ${label} @ ${Math.round(event.timeStamp)}ms`, ...s.log].slice(0, 40)
}

// ---------- actions ----------
export const setView = (v, e) => { s.view = v; capture(e, 'Open ' + v) }

export function left(item) {
  const inCart = s.cart.find((l) => l.id === item.id)
  return (s.stock[item.id] ?? item.stock) - (inCart ? inCart.qty : 0)
}

export function tableState(t) {
  const open = s.unpaid.filter((o) => o.type === 'Dine-in' && o.table === t)
  if (!open.length) return { cls: '', label: 'Free' }
  return open.every((o) => o.status === 'Served')
    ? { cls: 'bill', label: 'Ready to pay' }
    : { cls: 'busy', label: 'Occupied' }
}

export function pickTable(t, e) {
  s.table = t; s.type = 'Dine-in'; s.view = 'order'
  capture(e, 'Pick table ' + t)
}

export const setType = (t, e) => { s.type = t; capture(e, 'Order type ' + t) }

export function addItem(m, e) {
  const line = s.cart.find((l) => l.id === m.id)
  line ? line.qty++ : s.cart.push({ id: m.id, name: m.name, price: m.price, qty: 1, note: '' })
  capture(e, 'Add ' + m.name)
}

export function changeQty(line, d, e) {
  line.qty += d
  if (line.qty <= 0) s.cart = s.cart.filter((l) => l !== line)
  capture(e, (d > 0 ? '+ ' : '− ') + line.name)
}

export async function sendOrder(e) {
  if (!s.cart.length) return
  if (s.sending) return
  s.sending = true
  const lines = s.cart.map((line) => ({ ...line }))
  const totals = { ...s.calc }
  try {
    syncMenu(await api('/api/stock/consume', { method: 'POST', body: JSON.stringify({ lines }) }))
    s.orders.unshift({
      id: ++s.seq, type: s.type, table: s.type === 'Dine-in' ? s.table : null,
      lines, discount: s.discount, ...totals,
      status: 'New', paid: false, createdAt: Date.now(),
    })
    s.cart = []; s.discount = 'None'
    capture(e, 'Send to kitchen (default prevented)')
    say(`Order #${s.seq} sent to kitchen`)
  } catch (error) {
    say(error.message)
  } finally {
    s.sending = false
  }
}

export const mins = (o) => Math.floor((s.now - o.createdAt) / 60000)
export const nextStatus = (st) => ({ New: 'Preparing', Preparing: 'Ready', Ready: 'Served' })[st]
export function advance(o, e) { o.status = nextStatus(o.status); capture(e, `Order #${o.id} ${o.status}`) }

export async function cancel(o, e) {
  try {
    syncMenu(await api('/api/stock/restore', { method: 'POST', body: JSON.stringify({ lines: o.lines }) }))
    o.status = 'Cancelled'
    capture(e, 'Cancel #' + o.id)
    say('Order cancelled, stock restored')
  } catch (error) {
    say(error.message)
  }
}

export async function adjustStock(m, amount, e) {
  try {
    const item = await api(`/api/menu/${m.id}/stock`, { method: 'PATCH', body: JSON.stringify({ adjustment: amount }) })
    syncStockItem(item)
    capture(e, `${amount >= 0 ? 'Add' : 'Remove'} stock · ${m.name}`)
    say(amount >= 0 ? `${m.name}: ${amount} added` : `${m.name}: ${Math.abs(amount)} removed`)
  } catch (error) {
    say(error.message)
  }
}

export function restock(m, e) { adjustStock(m, 20, e) }
export const byMethod = (m) => s.paid.filter((o) => o.method === m).reduce((t, o) => t + o.total, 0)

export function pay(o, method, tendered, e) {
  o.paid = true; o.method = method; o.paidAt = Date.now()
  const change = method === 'Cash' ? tendered - o.total : 0
  capture(e, 'Payment confirmed')
  say('Payment received')
  return [
    `KAINAN — Receipt #${o.id}`,
    o.type === 'Dine-in' ? `Table ${o.table}` : 'Takeaway',
    '-'.repeat(28),
    ...o.lines.map((l) => `${l.qty} x ${l.name}  ${money(l.qty * l.price)}`),
    '-'.repeat(28),
    `Total ${money(o.total)}`,
    `VAT incl. ${money(o.vat)}`,
    `Paid by ${method}` + (method === 'Cash' ? ` · change ${money(change)}` : ''),
  ].join('\n')
}

export function resetDemo(e) {
  s.orders = []; s.seq = 100; s.cart = []
  refreshMenu()
  capture(e, 'Reset demo'); say('Demo orders reset')
}
