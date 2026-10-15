<script setup>
import { ref, computed } from 'vue'
import { MENU, DISCOUNTS, TABLE_COUNT } from '../data'
import { s, money, left, addItem, changeQty, setType, sendOrder, capture } from '../store'

const search = ref('')
const cat = ref('All')
const cats = ['All', ...new Set(MENU.map((m) => m.cat))]
const filtered = computed(() =>
  MENU.filter((m) => (cat.value === 'All' || m.cat === cat.value) && m.name.toLowerCase().includes(search.value.toLowerCase()))
)
</script>

<template>
  <section class="panel">
    <div class="bar">
      <input v-model="search" placeholder="Search menu" aria-label="Search menu" @keydown="capture($event, 'Search key')" />
      <select v-model="cat" aria-label="Category" @change="capture($event, 'Category changed')">
        <option v-for="c in cats" :key="c">{{ c }}</option>
      </select>
    </div>
    <div class="grid">
      <div v-for="m in filtered" :key="m.id" class="item" :class="{ out: left(m) <= 0 }">
        <img class="menu-image" :src="m.image" :alt="m.name" />
        <div>
          <b>{{ m.name }}</b><br />
          <small>{{ m.cat }} · {{ left(m) > 0 ? left(m) + ' left' : 'Sold out' }}</small>
        </div>
        <div class="row nb">
          <span>{{ money(m.price) }}</span>
          <button class="primary" :data-id="m.id" :disabled="left(m) <= 0" @click="addItem(m, $event)">Add</button>
        </div>
      </div>
    </div>
    <p v-if="!filtered.length" class="empty">No dishes match. Clear the search or pick another category.</p>
  </section>

  <aside class="panel">
    <h2>New ticket</h2>
    <div class="bar">
      <button v-for="t in ['Dine-in', 'Takeaway']" :key="t" :class="{ on: s.type === t }" @click="setType(t, $event)">{{ t }}</button>
      <select v-if="s.type === 'Dine-in'" v-model.number="s.table" aria-label="Table" @change="capture($event, 'Table changed')">
        <option v-for="t in TABLE_COUNT" :key="t" :value="t">Table {{ t }}</option>
      </select>
    </div>

    <form @submit.prevent="sendOrder($event)">
      <p v-if="!s.cart.length" class="empty">Ticket is empty. Add a dish to start.</p>
      <div v-for="l in s.cart" :key="l.id" style="margin-bottom: 8px">
        <div class="row nb">
          <span>{{ l.name }}</span>
          <span>
            <button type="button" :aria-label="'Remove one ' + l.name" @click="changeQty(l, -1, $event)">−</button>
            {{ l.qty }}
            <button type="button" :aria-label="'Add one ' + l.name" :disabled="left(l) <= 0" @click="changeQty(l, 1, $event)">+</button>
          </span>
        </div>
        <input v-model="l.note" class="note" placeholder="Note, e.g. no onions" :aria-label="'Note for ' + l.name" />
      </div>

      <label>
        Discount
        <select v-model="s.discount" @change="capture($event, 'Discount changed')">
          <option v-for="d in Object.keys(DISCOUNTS)" :key="d">{{ d }}</option>
        </select>
      </label>
      <div class="row"><span>Subtotal</span><span>{{ money(s.calc.sub) }}</span></div>
      <div v-if="s.calc.disc" class="row"><span>Discount</span><span>−{{ money(s.calc.disc) }}</span></div>
      <div v-if="s.calc.service" class="row"><span>Service charge 10%</span><span>{{ money(s.calc.service) }}</span></div>
      <div class="row"><span class="muted">VAT 12% (included)</span><span class="muted">{{ money(s.calc.vat) }}</span></div>
      <div class="total"><span>Total</span><span>{{ money(s.calc.total) }}</span></div>
      <button class="primary" type="submit" :disabled="!s.cart.length" style="width: 100%">Send to kitchen</button>
    </form>
  </aside>
</template>
