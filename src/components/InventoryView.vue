<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { MENU } from '../data'
import { s, createMenuItem, updateMenuItem, deleteMenuItem, say } from '../store'

const categories = ['Rice Meals', 'Silog', 'Snacks', 'Drinks', 'Desserts']
const search = ref('')
const categoryFilter = ref('All categories')
const editingId = ref(null)
const viewingItem = ref(null)
const errors = reactive({})
const emptyForm = () => ({ name: '', category: 'Rice Meals', price: '', stock: 0, description: '', image: '' })
const form = reactive(emptyForm())

const inventory = computed(() => MENU.filter((item) => {
  const matchesText = `${item.name} ${item.description || ''}`.toLowerCase().includes(search.value.trim().toLowerCase())
  const matchesCategory = categoryFilter.value === 'All categories' || item.cat === categoryFilter.value
  return matchesText && matchesCategory
}))
const totalUnits = computed(() => MENU.reduce((total, item) => total + (s.stock[item.id] ?? item.stock), 0))

function clearForm() {
  Object.assign(form, emptyForm())
  Object.keys(errors).forEach((key) => delete errors[key])
  editingId.value = null
}

function openAddForm() {
  clearForm()
  nextTick(() => document.querySelector('.inventory-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key])
  if (!form.name.trim()) errors.name = 'Enter a food name.'
  if (!categories.includes(form.category)) errors.category = 'Choose a valid category.'
  if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) errors.price = 'Enter a price of zero or more.'
  if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) errors.stock = 'Stock must be a whole number of zero or more.'
  if (!form.description.trim()) errors.description = 'Enter a short description.'
  if (!form.image.trim() || !/^https?:\/\//i.test(form.image.trim())) errors.image = 'Enter a valid HTTP or HTTPS image URL.'
  return Object.keys(errors).length === 0
}

function editFood(item) {
  editingId.value = item.id
  viewingItem.value = null
  Object.assign(form, {
    name: item.name,
    category: item.cat,
    price: item.price,
    stock: s.stock[item.id] ?? item.stock,
    description: item.description || '',
    image: item.image,
  })
  Object.keys(errors).forEach((key) => delete errors[key])
  document.querySelector('.inventory-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function saveFood(event) {
  if (!validate()) {
    say('Please correct the highlighted menu details.')
    return
  }
  const payload = {
    ...form,
    name: form.name.trim(),
    description: form.description.trim(),
    image: form.image.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    category: form.category,
  }
  try {
    if (editingId.value !== null) {
      await updateMenuItem(editingId.value, payload)
      say(`${payload.name} updated successfully.`)
    } else {
      await createMenuItem(payload)
      say(`${payload.name} added to the menu.`)
    }
    clearForm()
  } catch (error) {
    say(error.message || 'Unable to save the menu item.')
  }
  if (event?.type) event.currentTarget?.blur()
}

async function removeFood(item) {
  if (!window.confirm(`Delete ${item.name} from the menu? This cannot be undone.`)) return
  try {
    await deleteMenuItem(item.id)
    if (viewingItem.value?.id === item.id) viewingItem.value = null
    if (editingId.value === item.id) clearForm()
    say(`${item.name} deleted.`)
  } catch (error) {
    say(error.message || 'Unable to delete the menu item.')
  }
}
</script>

<template>
  <section class="panel inventory-panel">
    <div class="inventory-heading">
      <div>
        <span class="brand-kicker inventory-kicker">Kainan · Menu control</span>
        <h2>Food Menu &amp; Inventory</h2>
        <p class="muted">Create dishes, keep menu details current, and manage available portions.</p>
      </div>
      <button class="primary add-food-btn" @click="openAddForm">＋ Add Food</button>
    </div>

    <div class="stats">
      <div class="stat"><small>Menu items</small><b>{{ MENU.length }}</b></div>
      <div class="stat"><small>Total portions in stock</small><b>{{ totalUnits }}</b></div>
      <div class="stat"><small>Low stock · 5 or less</small><b>{{ s.lowStock.length }}</b></div>
    </div>

    <div class="inventory-toolbar">
      <label class="search-field"><span>Search food</span><input v-model="search" type="search" placeholder="Find by food name" @input="viewingItem = null" /></label>
      <label class="filter-field"><span>Category</span><select v-model="categoryFilter"><option>All categories</option><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
      <span class="result-count">{{ inventory.length }} item{{ inventory.length === 1 ? '' : 's' }}</span>
    </div>

    <div class="crud-menu-grid">
      <article v-for="item in inventory" :key="item.id" class="crud-menu-card">
        <div class="crud-image-wrap">
          <img :src="item.image" :alt="item.name" />
          <span class="crud-stock-badge" :class="{ low: (s.stock[item.id] ?? item.stock) <= 5 }">{{ s.stock[item.id] ?? item.stock }} in stock</span>
        </div>
        <div class="crud-card-body">
          <div class="crud-card-title"><div><span class="crud-category">{{ item.cat }}</span><h3>{{ item.name }}</h3></div><b class="crud-price">₱{{ Number(item.price).toFixed(2) }}</b></div>
          <p>{{ item.description || 'A delicious Filipino favorite from the Kainan kitchen.' }}</p>
          <div class="crud-card-actions">
            <button @click="viewingItem = item">View</button>
            <button @click="editFood(item)">Edit</button>
            <button class="danger-btn" @click="removeFood(item)">Delete</button>
          </div>
        </div>
      </article>
      <p v-if="!inventory.length" class="empty menu-empty">No food items match your search or category.</p>
    </div>

    <section v-if="viewingItem" class="panel menu-detail-panel" aria-live="polite">
      <button class="detail-close" aria-label="Close food details" @click="viewingItem = null">×</button>
      <img :src="viewingItem.image" :alt="viewingItem.name" />
      <div><span class="crud-category">{{ viewingItem.cat }}</span><h2>{{ viewingItem.name }}</h2><p>{{ viewingItem.description || 'No description provided.' }}</p><b>₱{{ Number(viewingItem.price).toFixed(2) }}</b><span> · {{ s.stock[viewingItem.id] ?? viewingItem.stock }} portions available</span></div>
    </section>

    <section class="panel inventory-form" aria-live="polite">
      <div class="inventory-form-heading"><div><span class="crud-category">{{ editingId !== null ? 'UPDATE MENU ITEM' : 'MENU MANAGEMENT' }}</span><h2>{{ editingId !== null ? 'Edit food details' : 'Add a new Filipino favorite' }}</h2></div><button v-if="editingId !== null" @click="clearForm">Cancel edit</button></div>
      <form class="food-form-grid" @submit.prevent="saveFood($event)">
        <label class="field"><span>Food name *</span><input v-model="form.name" required maxlength="100" placeholder="e.g. Tapsilog" @input="delete errors.name" /><small v-if="errors.name" class="field-error">{{ errors.name }}</small></label>
        <label class="field"><span>Category *</span><select v-model="form.category" required @input="delete errors.category"><option v-for="category in categories" :key="category">{{ category }}</option></select><small v-if="errors.category" class="field-error">{{ errors.category }}</small></label>
        <label class="field"><span>Price (₱) *</span><input v-model="form.price" type="number" min="0" step="0.01" required placeholder="0.00" @input="delete errors.price" /><small v-if="errors.price" class="field-error">{{ errors.price }}</small></label>
        <label class="field"><span>Stock quantity *</span><input v-model="form.stock" type="number" min="0" step="1" required placeholder="0" @input="delete errors.stock" /><small v-if="errors.stock" class="field-error">{{ errors.stock }}</small></label>
        <label class="field food-description"><span>Description *</span><textarea v-model="form.description" required rows="3" maxlength="400" placeholder="Tell customers what makes this dish special." @input="delete errors.description"></textarea><small v-if="errors.description" class="field-error">{{ errors.description }}</small></label>
        <label class="field food-image"><span>Image URL *</span><input v-model="form.image" type="url" required placeholder="https://example.com/filipino-dish.jpg" @input="delete errors.image" /><small v-if="errors.image" class="field-error">{{ errors.image }}</small></label>
        <div class="food-form-actions"><button class="primary" type="submit">{{ editingId !== null ? 'Save changes' : 'Add Food' }}</button><button type="button" @click="clearForm">Clear</button></div>
      </form>
    </section>
  </section>
</template>