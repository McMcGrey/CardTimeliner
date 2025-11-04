<template>
  <div class="searchable-select">
    <label v-if="label" class="select-label">{{ label }}</label>

    <!-- Selected items -->
    <div v-if="selectedItems.length > 0" class="selected-items">
      <span
        v-for="item in selectedItems"
        :key="item.id"
        class="selected-tag"
      >
        {{ item.name }}
        <button
          type="button"
          class="remove-btn"
          @click="removeItem(item.id)"
        >
          ×
        </button>
      </span>
    </div>

    <!-- Search input -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="search-input"
        @focus="showDropdown = true"
        @input="onSearchInput"
      />
    </div>

    <!-- Dropdown with filtered results -->
    <div v-if="showDropdown && (filteredOptions.length > 0 || (allowCreate && searchQuery))" class="dropdown">
      <!-- Create new option -->
      <div
        v-if="allowCreate && searchQuery && !exactMatch"
        class="dropdown-item create-new"
        @click="createNewItem"
      >
        <strong>+ Create:</strong> "{{ searchQuery }}"
      </div>

      <!-- Existing options -->
      <div
        v-for="option in filteredOptions"
        :key="option.id"
        class="dropdown-item"
        @click="selectItem(option)"
      >
        {{ option.name }}
        <span v-if="option.canon" class="mini-badge">Canon</span>
      </div>

      <!-- No results message -->
      <div v-if="!allowCreate && filteredOptions.length === 0" class="dropdown-item no-results">
        No matches found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  options: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  allowCreate: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'create'])

const searchQuery = ref('')
const showDropdown = ref(false)

// Get full objects for selected IDs
const selectedItems = computed(() => {
  return props.modelValue
    .map(id => props.options.find(opt => opt.id === id))
    .filter(Boolean)
})

// Filter options based on search query and exclude already selected
const filteredOptions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  return props.options
    .filter(option => !props.modelValue.includes(option.id))
    .filter(option => {
      if (!query) return true
      return option.name.toLowerCase().includes(query)
    })
    .slice(0, 10) // Limit to 10 results for performance
})

// Check if there's an exact match in the options
const exactMatch = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return props.options.some(option => option.name.toLowerCase() === query)
})

function selectItem(item) {
  if (props.multiple) {
    emit('update:modelValue', [...props.modelValue, item.id])
  } else {
    // Single selection mode - replace the array with just this item
    emit('update:modelValue', [item.id])
  }
  searchQuery.value = ''
  showDropdown.value = false
}

function createNewItem() {
  if (!searchQuery.value.trim()) return

  emit('create', searchQuery.value.trim())
  searchQuery.value = ''
  showDropdown.value = false
}

function removeItem(id) {
  emit('update:modelValue', props.modelValue.filter(itemId => itemId !== id))
}

function onSearchInput() {
  showDropdown.value = true
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (!event.target.closest('.searchable-select')) {
    showDropdown.value = false
  }
}

// Add event listener when component mounts
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}

// Clean up event listener
if (typeof window !== 'undefined') {
  watch(() => props.modelValue, () => {
    // Optionally clear search when selection changes
  })
}
</script>

<style scoped>
.searchable-select {
  position: relative;
  margin-bottom: 1rem;
}

.select-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f9f9f9;
  border-radius: 4px;
  min-height: 42px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #42b883;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.remove-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
  margin-left: 0.25rem;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 0.7;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.1);
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 0.25rem;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.no-results {
  color: #999;
  cursor: default;
}

.dropdown-item.no-results:hover {
  background: transparent;
}

.dropdown-item.create-new {
  background: #f0f9ff;
  color: #0369a1;
  border-bottom: 1px solid #e0e0e0;
}

.dropdown-item.create-new:hover {
  background: #e0f2fe;
}

.dropdown-item.create-new strong {
  color: #0284c7;
}

.mini-badge {
  background: #42b883;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Scrollbar styling */
.dropdown::-webkit-scrollbar {
  width: 8px;
}

.dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dropdown::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.dropdown::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
