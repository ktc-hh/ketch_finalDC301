import { reactive, computed, watch } from 'vue'
import { MENU, DISCOUNTS } from './data'

const KEY = 'kainan-vue'
const fresh = () => ({
  orders: [],
  seq: 100,
  stock: Object.fromEntries(MENU.map((m) => [m.id, m.stock])),
})

let saved = fresh()
try {
  const raw = localStorage.getItem(KEY)
  if (raw) saved = JSON.parse(raw)
} catch {}

export const s = reactive({
  ...saved,
  view: 'floor', type: 'Dine-in', table: 1, cart: [], discount: 'None',
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
s.lowStock = computed(() => MENU.filter((m) => s.stock[m.id] <= 5))

// ---------- persistence + timer ----------
watch(
  () => ({ orders: s.orders, seq: s.seq, stock: s.stock }),
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
  return s.stock[item.id] - (inCart ? inCart.qty : 0)
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

export function sendOrder(e) {
  if (!s.cart.length) return
  s.cart.forEach((l) => (s.stock[l.id] -= l.qty))
  s.orders.unshift({
    id: ++s.seq, type: s.type, table: s.type === 'Dine-in' ? s.table : null,
    lines: s.cart.map((l) => ({ ...l })), discount: s.discount, ...s.calc,
    status: 'New', paid: false, createdAt: Date.now(),
  })
  s.cart = []; s.discount = 'None'
  capture(e, 'Send to kitchen (default prevented)')
  say(`Order #${s.seq} sent to kitchen`)
}

export const mins = (o) => Math.floor((s.now - o.createdAt) / 60000)
export const nextStatus = (st) => ({ New: 'Preparing', Preparing: 'Ready', Ready: 'Served' })[st]
export function advance(o, e) { o.status = nextStatus(o.status); capture(e, `Order #${o.id} ${o.status}`) }

export function cancel(o, e) {
  o.lines.forEach((l) => (s.stock[l.id] += l.qty))
  o.status = 'Cancelled'
  capture(e, 'Cancel #' + o.id)
  say('Order cancelled, stock restored')
}

export function restock(m, e) { s.stock[m.id] += 20; capture(e, 'Restock ' + m.name) }
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
  const f = fresh()
  s.orders = f.orders; s.seq = f.seq; s.stock = f.stock; s.cart = []
  capture(e, 'Reset demo'); say('Demo data reset')
}
