<template>
  <div class="greeting-form">
    <h2>{{ editingId ? 'Edit Greeting' : 'Add New Greeting' }}</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Greeting name"
          required
        />
      </div>

      <SearchableSelect
        v-model="form.cardArray"
        label="Card:"
        placeholder="Search or create a card..."
        :options="store.allCards"
        :allow-create="true"
        :multiple="false"
        @create="handleCreateCard"
      />

      <div class="form-flags">
        <div class="form-group checkbox">
          <label>
            <input v-model="form.canon" type="checkbox" />
            Canon
          </label>
        </div>

        <div class="form-group checkbox">
          <label>
            <input v-model="form.au" type="checkbox" />
            Fan-fiction
          </label>
        </div>
      </div>

      <SearchableSelect
        v-model="form.characters"
        label="Characters:"
        placeholder="Search or create new characters..."
        :options="store.allCharacters"
        :allow-create="true"
        @create="handleCreateCharacter"
      />

      <div class="timeline-links">
        <SearchableSelect
          v-model="form.predecessors"
          label="Predecessors (comes before):"
          placeholder="Search for greetings that come before this one..."
          :options="availableGreetings"
        />

        <SearchableSelect
          v-model="form.successors"
          label="Successors (comes after):"
          placeholder="Search for greetings that come after this one..."
          :options="availableGreetings"
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">
          {{ editingId ? 'Update' : 'Add' }} Greeting
        </button>
        <button v-if="editingId" type="button" class="btn-secondary" @click="cancelEdit">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGreetingsStore } from '../stores/greetings'
import SearchableSelect from './SearchableSelect.vue'

const store = useGreetingsStore()

const props = defineProps({
  editingId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['saved', 'cancelled'])

const form = ref({
  name: '',
  card: null,
  cardArray: [], // For SearchableSelect (array format)
  canon: false,
  au: false,
  characters: [],
  predecessors: [],
  successors: []
})

// Available greetings (all greetings except the one being edited)
const availableGreetings = computed(() => {
  return store.allGreetings.filter(g => g.id !== props.editingId)
})

// Watch cardArray and sync with card
watch(() => form.value.cardArray, (newCardArray) => {
  form.value.card = newCardArray.length > 0 ? newCardArray[0] : null
})

// Watch for editing changes
watch(() => props.editingId, (newId) => {
  if (newId) {
    const greeting = store.getGreetingById(newId)
    if (greeting) {
      form.value = {
        name: greeting.name,
        card: greeting.card || null,
        cardArray: greeting.card ? [greeting.card] : [],
        canon: greeting.canon || false,
        au: greeting.au || false,
        characters: [...(greeting.characters || [])],
        predecessors: [...(greeting.predecessors || [])],
        successors: [...(greeting.successors || [])]
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function handleCreateCharacter(characterName) {
  const newCharacter = store.addCharacter(characterName)
  // Add the new character to the form
  form.value.characters = [...form.value.characters, newCharacter.id]
}

function handleCreateCard(cardName) {
  const newCard = store.addCard(cardName)
  // Set the new card in the form
  form.value.cardArray = [newCard.id]
}

function handleSubmit() {
  if (props.editingId) {
    store.updateGreeting(props.editingId, form.value)
  } else {
    store.addGreeting(form.value)
  }

  emit('saved')
  resetForm()
}

function cancelEdit() {
  emit('cancelled')
  resetForm()
}

function resetForm() {
  form.value = {
    name: '',
    card: null,
    cardArray: [],
    canon: false,
    au: false,
    characters: [],
    predecessors: [],
    successors: []
  }
}
</script>

<style scoped>
.greeting-form {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

h2 {
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

.form-group input[type="text"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  cursor: pointer;
}

.form-group.checkbox input {
  width: auto;
  margin-right: 0.5rem;
}

.form-flags {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.form-flags .form-group {
  margin-bottom: 0;
}

.timeline-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .timeline-links {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

button {
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
