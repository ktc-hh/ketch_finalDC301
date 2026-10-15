<script setup>
import { tableState, pickTable } from '../store'
import { TABLE_COUNT } from '../data'
</script>

<template>
  <section class="panel">
    <h2>Floor plan</h2>
    <div class="tables">
      <button v-for="t in TABLE_COUNT" :key="t" class="tbl" :class="tableState(t).cls" @click="pickTable(t, $event)">
        <b>Table {{ t }}</b>
        <small>{{ t % 3 === 0 ? 6 : t % 2 ? 4 : 2 }} seats</small>
        <small>{{ tableState(t).label }}</small>
      </button>
    </div>
    <p class="empty">Tap a table to start or add to its order.</p>
  </section>
</template>
