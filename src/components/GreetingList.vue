<template>
  <div class="greeting-list">
    <div class="list-header">
      <h2>Greetings Timeline</h2>
    </div>

    <!-- Filters Panel -->
    <div class="filters-panel">
      <div class="filter-group">
        <label>Canon:</label>
        <div class="filter-buttons">
          <button
            :class="{ active: filters.canon === 'all' }"
            @click="filters.canon = 'all'"
          >
            All
          </button>
          <button
            :class="{ active: filters.canon === 'canon' }"
            @click="filters.canon = 'canon'"
          >
            Canon Only
          </button>
        </div>
      </div>

      <div class="filter-group">
        <label>Fan-fiction Status:</label>
        <div class="filter-buttons">
          <button
            :class="{ active: filters.au === 'all' }"
            @click="filters.au = 'all'"
          >
            All
          </button>
          <button
            :class="{ active: filters.au === 'au' }"
            @click="filters.au = 'au'"
          >
            Fan-fiction Only
          </button>
          <button
            :class="{ active: filters.au === 'non-au' }"
            @click="filters.au = 'non-au'"
          >
            Non-Fan-fiction
          </button>
        </div>
      </div>

      <div class="filter-group filter-group-wide">
        <label>Characters:</label>
        <SearchableSelect
          v-model="filters.characters"
          placeholder="Filter by characters..."
          :options="store.allCharacters"
          :allow-create="false"
        />
      </div>

      <div class="filter-group filter-group-wide">
        <label>Exclude Characters:</label>
        <SearchableSelect
          v-model="filters.excludeCharacters"
          placeholder="Exclude greetings with these characters..."
          :options="store.allCharacters"
          :allow-create="false"
        />
      </div>

      <div class="filter-group">
        <label for="card-filter">Card:</label>
        <select id="card-filter" v-model="filters.card">
          <option value="">All Cards</option>
          <option v-for="card in store.allCards" :key="card.id" :value="card.id">
            {{ card.name }}
          </option>
        </select>
      </div>

      <button class="clear-filters" @click="clearFilters">
        Clear All Filters
      </button>
    </div>

    <div class="results-count">
      Showing {{ filteredGreetings.length }} of {{ store.allGreetings.length }} greetings
    </div>

    <div v-if="filteredGreetings.length === 0" class="empty-state">
      <p v-if="store.allGreetings.length === 0">No greetings yet. Add your first greeting above!</p>
      <p v-else>No greetings match the current filters. Try adjusting your filters.</p>
    </div>

    <div v-else class="greetings-container">
      <div
        v-for="greeting in filteredGreetings"
        :key="greeting.id"
        class="greeting-card"
        :class="{ canon: greeting.canon }"
      >
        <div class="card-header">
          <h3>{{ greeting.name }}</h3>
          <div class="badges">
            <span v-if="greeting.canon" class="canon-badge">Canon</span>
            <span v-if="greeting.au" class="au-badge">Fan-fiction</span>
          </div>
        </div>

        <div v-if="greeting.card" class="card-info">
          <strong>Card:</strong>
          <a
            v-if="getCardUrl(greeting.card)"
            :href="getCardUrl(greeting.card)"
            target="_blank"
            rel="noopener noreferrer"
            class="card-link"
          >
            {{ getCardName(greeting.card) }}
          </a>
          <span v-else>{{ getCardName(greeting.card) }}</span>
        </div>

        <div class="card-body">
          <div v-if="greeting.characters && greeting.characters.length > 0" class="card-section">
            <strong>Characters:</strong>
            <div class="characters-list">
              <span
                v-for="characterId in greeting.characters"
                :key="characterId"
                class="character-tag"
              >
                {{ getCharacterName(characterId) }}
              </span>
            </div>
          </div>

          <div class="timeline-section">
            <div v-if="greeting.predecessors && greeting.predecessors.length > 0" class="card-section">
              <strong>⬅️ Predecessors (comes before):</strong>
              <ul class="timeline-list">
                <li v-for="predecessorId in greeting.predecessors" :key="predecessorId">
                  {{ getGreetingName(predecessorId) }}
                </li>
              </ul>
            </div>

            <div v-if="greeting.successors.length > 0" class="card-section">
              <strong>➡️ Successors (comes after):</strong>
              <ul class="timeline-list">
                <li v-for="successorId in greeting.successors" :key="successorId">
                  {{ getGreetingName(successorId) }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-edit" @click="$emit('edit', greeting.id)">
            Edit
          </button>
          <button class="btn-delete" @click="handleDelete(greeting.id)">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGreetingsStore } from '../stores/greetings'
import SearchableSelect from './SearchableSelect.vue'

const store = useGreetingsStore()
const emit = defineEmits(['edit'])

const filters = ref({
  canon: 'all',
  au: 'all',
  characters: [],
  excludeCharacters: [],
  card: ''
})

const filteredGreetings = computed(() => {
  let result = store.allGreetings

  // Filter by canon status
  if (filters.value.canon === 'canon') {
    result = result.filter(g => g.canon)
  }

  // Filter by AU status
  if (filters.value.au === 'au') {
    result = result.filter(g => g.au)
  } else if (filters.value.au === 'non-au') {
    result = result.filter(g => !g.au)
  }

  // Filter by characters (AND logic - greeting must have all selected characters)
  if (filters.value.characters.length > 0) {
    result = result.filter(g =>
      g.characters && filters.value.characters.every(selectedCharId => g.characters.includes(selectedCharId))
    )
  }

  // Exclude characters (greeting must NOT have any of the excluded characters)
  if (filters.value.excludeCharacters.length > 0) {
    result = result.filter(g =>
      !g.characters || !g.characters.some(charId => filters.value.excludeCharacters.includes(charId))
    )
  }

  // Filter by card
  if (filters.value.card) {
    result = result.filter(g => g.card === filters.value.card)
  }

  return result
})

function clearFilters() {
  filters.value = {
    canon: 'all',
    au: 'all',
    characters: [],
    excludeCharacters: [],
    card: ''
  }
}

function getGreetingName(id) {
  const greeting = store.getGreetingById(id)
  return greeting ? greeting.name : 'Unknown'
}

function getCharacterName(id) {
  const character = store.getCharacterById(id)
  return character ? character.name : 'Unknown'
}

function getCardName(id) {
  const card = store.getCardById(id)
  return card ? card.name : 'Unknown'
}

function getCardUrl(id) {
  const card = store.getCardById(id)
  return card && card.url ? card.url : null
}

function handleDelete(id) {
  if (confirm('Are you sure you want to delete this greeting?')) {
    store.deleteGreeting(id)
  }
}
</script>

<style scoped>
.greeting-list {
  margin-top: 2rem;
}

.list-header {
  margin-bottom: 1rem;
}

.list-header h2 {
  margin: 0;
  color: #333;
}

.filters-panel {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.filter-group-wide {
  min-width: 300px;
  flex: 1;
}

.filter-group-wide .searchable-select {
  margin-bottom: 0;
}

.filter-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.875rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.filter-group select:focus {
  outline: none;
  border-color: #42b883;
}

.filter-buttons {
  display: flex;
  gap: 0.25rem;
}

.filter-buttons button {
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-buttons button:hover {
  border-color: #42b883;
}

.filter-buttons button.active {
  background: #42b883;
  border-color: #42b883;
  color: white;
}

.clear-filters {
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 0.2s;
  align-self: flex-end;
}

.clear-filters:hover {
  background: #c0392b;
}

.results-count {
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-style: italic;
}

.greetings-container {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.greeting-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.greeting-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.greeting-card.canon {
  border-color: #42b883;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.canon-badge {
  background: #42b883;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.au-badge {
  background: #9b59b6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-info {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  color: #555;
  font-size: 0.875rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-info strong {
  color: #333;
}

.card-link {
  color: #4a90e2;
  text-decoration: none;
  transition: color 0.2s;
}

.card-link:hover {
  color: #357abd;
  text-decoration: underline;
}

.card-body {
  margin-bottom: 1rem;
}

.card-section {
  margin-bottom: 1rem;
}

.card-section:last-child {
  margin-bottom: 0;
}

.card-section strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.characters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.character-tag {
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timeline-list {
  margin: 0;
  padding-left: 1.5rem;
}

.timeline-list li {
  color: #666;
  margin-bottom: 0.25rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.card-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
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
</style>
