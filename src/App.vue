<script setup>
import { onMounted, ref } from 'vue'
import { s, setView, login, logout, refreshMenu } from './store'
import FloorView from './components/FloorView.vue'
import OrderView from './components/OrderView.vue'
import KitchenView from './components/KitchenView.vue'
import CashierView from './components/CashierView.vue'
import InventoryView from './components/InventoryView.vue'

const tabs = [
  { id: 'floor', label: 'Floor', comp: FloorView },
  { id: 'order', label: 'Order', comp: OrderView },
  { id: 'kitchen', label: 'Kitchen', comp: KitchenView },
  { id: 'cashier', label: 'Cashier', comp: CashierView },
  { id: 'inventory', label: 'Inventory', comp: InventoryView },
]

const loginForm = ref({ username: '', password: '' })
onMounted(refreshMenu)

const handleLogin = () => {
  const username = loginForm.value.username.trim() || 'Staff'
  login(username)
}
</script>

<template>
  <div v-if="!s.authenticated" class="auth-shell">
    <div class="panel auth-card">
      <div class="brand-wrap">
        <div class="brand-mark">K</div>
        <div>
          <div class="brand-kicker">Lutong Pinoy · Restaurant</div>
          <h1>Kainan</h1>
          <div class="brand-tagline">Tatak pinoy, tatak masarap.</div>
        </div>
      </div>

      <p class="empty">Sign in as any staff member to manage orders, kitchen flow, and checkout.</p>

      <label class="field">
        <span>Username</span>
        <input v-model="loginForm.username" placeholder="cashier, server, host" />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="loginForm.password" type="password" placeholder="Enter password" />
      </label>

      <button class="primary login-btn" @click="handleLogin">Login</button>
      <button class="ghost-btn" @click="login('Staff')">Use demo access</button>
    </div>
  </div>

  <div v-else class="app-shell">
    <header>
      <div class="brand-wrap">
        <div class="brand-mark">K</div>
        <div>
          <div class="brand-kicker">Lutong Pinoy · Restaurant</div>
          <h1>Kainan</h1>
          <div class="brand-tagline">Tatak pinoy, tatak masarap.</div>
        </div>
      </div>

      <div class="header-meta">
        <span class="status-pill">Open · 10:00 AM–11:30 PM</span>
        <span class="mini-meta">{{ s.orders.length }} live tickets</span>
      </div>

      <div class="header-actions">
        <span class="user-pill">{{ s.userName }}</span>
        <button class="logout-btn" @click="logout">Log out</button>
      </div>

      <nav class="tabs" aria-label="Main views">
        <button v-for="t in tabs" :key="t.id" :class="{ on: s.view === t.id }" @click="setView(t.id, $event)">
          {{ t.label }}
        </button>
      </nav>
    </header>

    <main :class="{ split: s.view === 'order' }">
      <component :is="tabs.find((t) => t.id === s.view).comp" />
    </main>

    <div v-if="s.toast" class="toast" role="status">{{ s.toast }}</div>
  </div>
</template>
