<script setup>
import { ref } from 'vue'
import GreetingForm from './components/GreetingForm.vue'
import GreetingList from './components/GreetingList.vue'
import JsonManager from './components/JsonManager.vue'
import CardManager from './components/CardManager.vue'
import GraphView from './components/GraphView.vue'

const editingId = ref(null)

function handleEdit(id) {
  editingId.value = id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleSaved() {
  editingId.value = null
}

function handleCancelled() {
  editingId.value = null
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Card Timeliner</h1>
      <p>Create and manage your greeting timeline with chronological connections</p>
    </header>

    <main class="app-main">
      <GreetingForm
        :editing-id="editingId"
        @saved="handleSaved"
        @cancelled="handleCancelled"
      />

      <CardManager />

      <GraphView />

      <JsonManager />

      <GreetingList @edit="handleEdit" />
    </main>

    <footer class="app-footer">
      <p>Built with Vue 3 + Vite</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #42b883;
}

.app-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2.5rem;
}

.app-header p {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 1.1rem;
}

.app-main {
  min-height: 60vh;
}

.app-footer {
  text-align: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
  color: #999;
}

.app-footer p {
  margin: 0;
}
</style>
