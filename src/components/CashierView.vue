<script setup>
import { ref } from 'vue'
import { MENU } from '../data'
import { s, money, byMethod, restock, pay, capture } from '../store'

const paying = ref(null)
const method = ref('Cash')
const tendered = ref(0)
const receipt = ref('')

function openPay(o, e) {
  paying.value = o; method.value = 'Cash'; tendered.value = 0; receipt.value = ''
  capture(e, 'Pay #' + o.id)
}
function confirm(e) {
  receipt.value = pay(paying.value, method.value, tendered.value, e)
  paying.value = null
}
</script>

<template>
  <section class="panel">
    <h2>Today's summary</h2>
    <div class="stats">
      <div class="stat"><small>Sales</small><b>{{ money(s.sales) }}</b></div>
      <div class="stat"><small>Paid orders</small><b>{{ s.paid.length }}</b></div>
      <div class="stat"><small>Avg ticket</small><b>{{ money(s.paid.length ? s.sales / s.paid.length : 0) }}</b></div>
      <div class="stat">
        <small>Cash / Card / GCash</small>
        <b style="font-size: 14px">{{ ['Cash', 'Card', 'GCash'].map((m) => money(byMethod(m))).join(' / ') }}</b>
      </div>
    </div>
    <div class="cols">
      <div>
        <b>Best sellers</b>
        <div v-for="t in s.topItems" :key="t[0]" class="row"><span>{{ t[0] }}</span><span>{{ t[1] }}</span></div>
        <p v-if="!s.topItems.length" class="empty">No sales yet.</p>
      </div>
      <div>
        <b>Low stock (5 or less)</b>
        <div v-for="m in s.lowStock" :key="m.id" class="row">
          <span>{{ m.name }}</span>
          <button @click="restock(m, $event)">Restock +20 ({{ s.stock[m.id] }})</button>
        </div>
        <p v-if="!s.lowStock.length" class="empty">All items are well stocked.</p>
      </div>
    </div>
  </section>

  <section class="panel">
    <h2>Unpaid orders</h2>
    <p v-if="!s.unpaid.length" class="empty">Nothing to collect right now.</p>
    <div v-for="o in s.unpaid" :key="o.id" class="order">
      <div class="row nb">
        <b>#{{ o.id }} · {{ o.type === 'Dine-in' ? 'Table ' + o.table : 'Takeaway' }}</b>
        <span class="tag" :class="o.status">{{ o.status }}</span>
      </div>
      <div class="row nb">
        <span>{{ o.lines.reduce((t, l) => t + l.qty, 0) }} items</span><b>{{ money(o.total) }}</b>
      </div>
      <button class="primary" :disabled="o.status === 'New'" @click="openPay(o, $event)">
        {{ o.status === 'New' ? 'Waiting for kitchen' : 'Take payment' }}
      </button>
    </div>

    <div v-if="paying" class="order" style="border-color: var(--ink)">
      <h2>Pay order #{{ paying.id }} · {{ money(paying.total) }}</h2>
      <div class="bar">
        <button v-for="m in ['Cash', 'Card', 'GCash']" :key="m" :class="{ on: method === m }" @click="method = m; capture($event, 'Method ' + m)">{{ m }}</button>
      </div>
      <div v-if="method === 'Cash'">
        <label>Cash received <input v-model.number="tendered" type="number" min="0" step="0.01" @input="capture($event, 'Cash entered')" /></label>
        <p>Change: <b>{{ money(Math.max(0, tendered - paying.total)) }}</b></p>
      </div>
      <button class="primary" :disabled="method === 'Cash' && tendered < paying.total" @click="confirm($event)">Confirm payment</button>
      <button @click="paying = null">Close</button>
    </div>
    <pre v-if="receipt" style="margin-top: 10px">{{ receipt }}</pre>
  </section>
</template>
