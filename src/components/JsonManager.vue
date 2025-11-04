<template>
  <div class="json-manager">
    <h2>Import/Export</h2>

    <div class="actions">
      <button class="btn-export" @click="handleExport">
        Export to JSON
      </button>
      <button class="btn-download" @click="handleDownload">
        Download JSON File
      </button>
      <label class="btn-import">
        Import from File
        <input
          type="file"
          accept=".json"
          @change="handleFileImport"
          style="display: none"
        />
      </label>
      <button class="btn-clear" @click="handleClear">
        Clear All
      </button>
    </div>

    <div v-if="exportedJson" class="json-display">
      <div class="json-header">
        <h3>Exported JSON</h3>
        <button class="btn-copy" @click="copyToClipboard">
          Copy to Clipboard
        </button>
      </div>
      <pre><code>{{ exportedJson }}</code></pre>
    </div>

    <div v-if="importMessage" class="import-message" :class="importStatus">
      {{ importMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGreetingsStore } from '../stores/greetings'

const store = useGreetingsStore()

const exportedJson = ref('')
const importMessage = ref('')
const importStatus = ref('')

function handleExport() {
  exportedJson.value = store.exportToJSON()
  importMessage.value = ''
}

function handleDownload() {
  const jsonData = store.exportToJSON()
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `greetings-timeline-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  importMessage.value = 'File downloaded successfully!'
  importStatus.value = 'success'
  setTimeout(() => {
    importMessage.value = ''
  }, 3000)
}

function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const jsonString = e.target.result
    const success = store.importFromJSON(jsonString)

    if (success) {
      importMessage.value = 'Successfully imported greetings!'
      importStatus.value = 'success'
      exportedJson.value = ''
    } else {
      importMessage.value = 'Failed to import. Invalid JSON format.'
      importStatus.value = 'error'
    }

    setTimeout(() => {
      importMessage.value = ''
    }, 3000)
  }

  reader.readAsText(file)
  event.target.value = '' // Reset input
}

function handleClear() {
  if (confirm('Are you sure you want to clear all greetings? This cannot be undone.')) {
    store.clearAll()
    exportedJson.value = ''
    importMessage.value = 'All greetings cleared.'
    importStatus.value = 'success'
    setTimeout(() => {
      importMessage.value = ''
    }, 3000)
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(exportedJson.value)
  importMessage.value = 'Copied to clipboard!'
  importStatus.value = 'success'
  setTimeout(() => {
    importMessage.value = ''
  }, 2000)
}
</script>

<style scoped>
.json-manager {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

h2 {
  margin-top: 0;
  color: #333;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

button,
.btn-import {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-export {
  background: #4a90e2;
  color: white;
}

.btn-export:hover {
  background: #357abd;
}

.btn-download {
  background: #42b883;
  color: white;
}

.btn-download:hover {
  background: #359268;
}

.btn-import {
  background: #9b59b6;
  color: white;
  display: inline-block;
}

.btn-import:hover {
  background: #8e44ad;
}

.btn-clear {
  background: #e74c3c;
  color: white;
}

.btn-clear:hover {
  background: #c0392b;
}

.btn-copy {
  background: #34495e;
  color: white;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.btn-copy:hover {
  background: #2c3e50;
}

.json-display {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.json-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #555;
}

pre {
  margin: 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #333;
}

.import-message {
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-weight: 600;
}

.import-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.import-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
