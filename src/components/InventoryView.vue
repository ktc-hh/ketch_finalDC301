<script setup>
import { computed, reactive, ref } from 'vue'
import { MENU } from '../data'
import { s, adjustStock } from '../store'

const search = ref('')
const quantities = reactive(Object.fromEntries(MENU.map((item) => [item.id, 10])))
const inventory = computed(() =>
  MENU.filter((item) => item.name.toLowerCase().includes(search.value.trim().toLowerCase()))
)
const totalUnits = computed(() => MENU.reduce((total, item) => total + s.stock[item.id], 0))
</script>

<template>
  <section class="panel inventory-panel">
    <div class="inventory-heading">
      <div>
        <h2>Inventory</h2>
        <p class="muted">Track menu stock and update quantities as supplies arrive or are counted.</p>
      </div>
      <input v-model="search" placeholder="Search inventory" aria-label="Search inventory" />
    </div>

    <div class="stats">
      <div class="stat"><small>Menu items</small><b>{{ MENU.length }}</b></div>
      <div class="stat"><small>Total portions in stock</small><b>{{ totalUnits }}</b></div>
      <div class="stat"><small>Low stock · 5 or less</small><b>{{ s.lowStock.length }}</b></div>
    </div>

    <div class="inventory-list">
      <div v-for="item in inventory" :key="item.id" class="inventory-row">
        <img :src="item.image" :alt="item.name" />
        <div class="inventory-name">
          <b>{{ item.name }}</b>
          <small>{{ item.cat }} · {{ item.stock }} starting portions</small>
        </div>
        <span class="inventory-count" :class="{ low: s.stock[item.id] <= 5 }">
          {{ s.stock[item.id] }} <small>in stock</small>
        </span>
        <label class="inventory-quantity">
          <span class="sr-only">Quantity to adjust for {{ item.name }}</span>
          <input v-model.number="quantities[item.id]" type="number" min="1" :aria-label="'Adjustment quantity for ' + item.name" />
        </label>
        <div class="inventory-actions">
          <button class="primary" @click="adjustStock(item, Math.max(1, quantities[item.id] || 1), $event)">Add stock</button>
          <button :disabled="s.stock[item.id] <= 0" @click="adjustStock(item, -Math.max(1, quantities[item.id] || 1), $event)">Remove</button>
        </div>
      </div>
      <p v-if="!inventory.length" class="empty">No inventory items match that search.</p>
    </div>
  </section>
</template>