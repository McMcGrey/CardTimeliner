<template>
  <div class="card-manager">
    <h2>Card Management</h2>
    <p class="description">Manage your cards and add URLs to them</p>

    <div v-if="store.allCards.length === 0" class="empty-state">
      <p>No cards yet. Cards will appear here as you create them in greetings.</p>
    </div>

    <div v-else class="cards-grid">
      <div
        v-for="card in store.allCards"
        :key="card.id"
        class="card-item"
      >
        <div class="card-item-header">
          <h3>{{ card.name }}</h3>
          <div class="card-actions">
            <button class="btn-edit" @click="startEdit(card)">
              Edit
            </button>
            <button class="btn-delete" @click="handleDelete(card.id)">
              Delete
            </button>
          </div>
        </div>
        <div class="card-item-body">
          <div v-if="card.url" class="card-url">
            <strong>URL:</strong>
            <a :href="card.url" target="_blank" rel="noopener noreferrer">
              {{ card.url }}
            </a>
          </div>
          <div v-else class="no-url">
            <em>No URL set</em>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingCard" class="modal-overlay" @click="cancelEdit">
      <div class="modal" @click.stop>
        <h3>Edit Card</h3>
        <form @submit.prevent="saveEdit">
          <div class="form-group">
            <label for="edit-name">Name:</label>
            <input
              id="edit-name"
              v-model="editForm.name"
              type="text"
              required
            />
          </div>

          <div class="form-group">
            <label for="edit-url">URL:</label>
            <input
              id="edit-url"
              v-model="editForm.url"
              type="url"
              placeholder="https://example.com"
            />
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-primary">Save</button>
            <button type="button" class="btn-secondary" @click="cancelEdit">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGreetingsStore } from '../stores/greetings'

const store = useGreetingsStore()

const editingCard = ref(null)
const editForm = ref({
  name: '',
  url: ''
})

function startEdit(card) {
  editingCard.value = card
  editForm.value = {
    name: card.name,
    url: card.url || ''
  }
}

function saveEdit() {
  if (editingCard.value) {
    store.updateCard(editingCard.value.id, editForm.value)
    cancelEdit()
  }
}

function cancelEdit() {
  editingCard.value = null
  editForm.value = {
    name: '',
    url: ''
  }
}

function handleDelete(id) {
  if (confirm('Are you sure you want to delete this card? It will be removed from all greetings.')) {
    store.deleteCard(id)
  }
}
</script>

<style scoped>
.card-manager {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

h2 {
  margin-top: 0;
  color: #333;
}

.description {
  color: #666;
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
  background: white;
  border-radius: 4px;
}

.cards-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.card-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.card-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-item-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit,
.btn-delete {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-edit {
  background: #4a90e2;
  color: white;
}

.btn-edit:hover {
  background: #357abd;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background: #c0392b;
}

.card-item-body {
  font-size: 0.875rem;
}

.card-url {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-url strong {
  color: #555;
}

.card-url a {
  color: #4a90e2;
  text-decoration: none;
  word-break: break-all;
}

.card-url a:hover {
  text-decoration: underline;
}

.no-url {
  color: #999;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
  background: #359268;
}

.btn-secondary {
  background: #ccc;
  color: #333;
}

.btn-secondary:hover {
  background: #bbb;
}
</style>
