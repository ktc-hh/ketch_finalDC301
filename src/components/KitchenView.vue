<script setup>
import { s, mins, nextStatus, advance, cancel } from '../store'
const columns = ['New', 'Preparing', 'Ready']
</script>

<template>
  <section class="panel">
    <h2>Kitchen board</h2>
    <p v-if="!s.kitchen.length" class="empty">No active orders. New tickets show up here.</p>
    <div class="cols">
      <div v-for="col in columns" :key="col">
        <b>{{ col }} ({{ s.kitchen.filter((o) => o.status === col).length }})</b>
        <div
          v-for="o in s.kitchen.filter((o) => o.status === col)"
          :key="o.id"
          class="order"
          :class="{ late: mins(o) >= 15 && o.status !== 'Ready' }"
          style="margin-top: 8px"
        >
          <div class="row nb">
            <b>#{{ o.id }} · {{ o.type === 'Dine-in' ? 'Table ' + o.table : 'Takeaway' }}</b>
            <span class="tag" :class="o.status">{{ mins(o) }} min</span>
          </div>
          <div v-for="l in o.lines" :key="l.id">
            {{ l.qty }} × {{ l.name }}<br />
            <small v-if="l.note">↳ {{ l.note }}</small>
          </div>
          <div class="bar" style="margin: 8px 0 0">
            <button @click="advance(o, $event)">Mark {{ nextStatus(o.status) }}</button>
            <button v-if="o.status === 'New'" @click="cancel(o, $event)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
