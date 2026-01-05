import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'card-timeliner-data'

// UUID generator with fallback for environments without crypto.randomUUID
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Generate a unique UUID - will be used with idExists check inside the store
function generateUniqueUUID(checkExists) {
  let id = generateUUID()
  // Keep generating until we get a unique ID, rechecking ALL items each time
  while (checkExists(id)) {
    id = generateUUID()
  }
  return id
}

export const useGreetingsStore = defineStore('greetings', () => {
  // State
  const greetings = ref([])
  const characters = ref([])
  const cards = ref([])

  // Helper to check if an ID exists in any collection
  function idExists(id) {
    return greetings.value.some(item => item.id === id) ||
           characters.value.some(item => item.id === id) ||
           cards.value.some(item => item.id === id)
  }

  // Load data from localStorage on initialization
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)

        // Load with backward compatibility
        if (data.characters) {
          characters.value = data.characters
        }

        if (data.cards) {
          cards.value = data.cards
        }

        if (data.greetings) {
          greetings.value = data.greetings.map(g => ({
            ...g,
            predecessors: g.predecessors || [],
            successors: g.successors || []
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
  }

  // Save data to localStorage
  function saveToLocalStorage() {
    try {
      const data = {
        characters: characters.value,
        cards: cards.value,
        greetings: greetings.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  // Watch for changes and auto-save
  watch([greetings, characters, cards], () => {
    saveToLocalStorage()
  }, { deep: true })

  // Initialize from localStorage
  loadFromLocalStorage()

  // Getters
  const allGreetings = computed(() => greetings.value)

  const canonGreetings = computed(() =>
    greetings.value.filter(g => g.canon)
  )

  const getGreetingById = computed(() => (id) =>
    greetings.value.find(g => g.id === id)
  )

  const allCharacters = computed(() => characters.value)

  const getCharacterById = computed(() => (id) =>
    characters.value.find(c => c.id === id)
  )

  const allCards = computed(() => cards.value)

  const getCardById = computed(() => (id) =>
    cards.value.find(c => c.id === id)
  )

  // Helper function to sync bidirectional links
  function syncBidirectionalLinks(greetingId, oldSuccessors = [], newSuccessors = [], oldPredecessors = [], newPredecessors = []) {
    // Handle successors: when A adds B as successor, B should have A as predecessor
    const addedSuccessors = newSuccessors.filter(id => !oldSuccessors.includes(id))
    const removedSuccessors = oldSuccessors.filter(id => !newSuccessors.includes(id))

    addedSuccessors.forEach(successorId => {
      const successor = greetings.value.find(g => g.id === successorId)
      if (successor && !successor.predecessors.includes(greetingId)) {
        successor.predecessors.push(greetingId)
      }
    })

    removedSuccessors.forEach(successorId => {
      const successor = greetings.value.find(g => g.id === successorId)
      if (successor) {
        successor.predecessors = successor.predecessors.filter(id => id !== greetingId)
      }
    })

    // Handle predecessors: when A adds B as predecessor, B should have A as successor
    const addedPredecessors = newPredecessors.filter(id => !oldPredecessors.includes(id))
    const removedPredecessors = oldPredecessors.filter(id => !newPredecessors.includes(id))

    addedPredecessors.forEach(predecessorId => {
      const predecessor = greetings.value.find(g => g.id === predecessorId)
      if (predecessor && !predecessor.successors.includes(greetingId)) {
        predecessor.successors.push(greetingId)
      }
    })

    removedPredecessors.forEach(predecessorId => {
      const predecessor = greetings.value.find(g => g.id === predecessorId)
      if (predecessor) {
        predecessor.successors = predecessor.successors.filter(id => id !== greetingId)
      }
    })
  }

  // Helper function to insert greeting between linked greetings
  function insertBetweenLinks(greetingId, predecessors, successors) {
    // For each predecessor, check if it links to any of our successors
    predecessors.forEach(predecessorId => {
      const predecessor = greetings.value.find(g => g.id === predecessorId)
      if (predecessor) {
        // Remove any direct links from predecessor to our successors
        successors.forEach(successorId => {
          if (predecessor.successors.includes(successorId)) {
            predecessor.successors = predecessor.successors.filter(id => id !== successorId)

            // Also remove the reverse link
            const successor = greetings.value.find(g => g.id === successorId)
            if (successor) {
              successor.predecessors = successor.predecessors.filter(id => id !== predecessorId)
            }
          }
        })
      }
    })
  }

  // Actions
  function addGreeting(greeting) {
    const newGreeting = {
      id: generateUniqueUUID(idExists),
      name: greeting.name || 'Untitled',
      canon: greeting.canon || false,
      au: greeting.au || false,
      card: greeting.card || null,
      characters: greeting.characters || [],
      successors: greeting.successors || [],
      predecessors: greeting.predecessors || [],
      ...greeting
    }
    greetings.value.push(newGreeting)

    // Sync bidirectional links for new greeting
    syncBidirectionalLinks(
      newGreeting.id,
      [],
      newGreeting.successors,
      [],
      newGreeting.predecessors
    )

    // Insert this greeting between any linked predecessors and successors
    insertBetweenLinks(newGreeting.id, newGreeting.predecessors, newGreeting.successors)

    return newGreeting
  }

  function updateGreeting(id, updates) {
    const index = greetings.value.findIndex(g => g.id === id)
    if (index !== -1) {
      const oldGreeting = greetings.value[index]
      const oldSuccessors = [...oldGreeting.successors]
      const oldPredecessors = [...oldGreeting.predecessors]

      greetings.value[index] = { ...oldGreeting, ...updates }

      // Sync bidirectional links if successors or predecessors changed
      if (updates.successors !== undefined || updates.predecessors !== undefined) {
        syncBidirectionalLinks(
          id,
          oldSuccessors,
          greetings.value[index].successors,
          oldPredecessors,
          greetings.value[index].predecessors
        )
      }
    }
  }

  function deleteGreeting(id) {
    const greeting = greetings.value.find(g => g.id === id)

    if (greeting) {
      // Remove bidirectional links before deleting
      greeting.successors.forEach(successorId => {
        const successor = greetings.value.find(g => g.id === successorId)
        if (successor) {
          successor.predecessors = successor.predecessors.filter(pId => pId !== id)
        }
      })

      greeting.predecessors.forEach(predecessorId => {
        const predecessor = greetings.value.find(g => g.id === predecessorId)
        if (predecessor) {
          predecessor.successors = predecessor.successors.filter(sId => sId !== id)
        }
      })
    }

    // Remove the greeting
    greetings.value = greetings.value.filter(g => g.id !== id)
  }

  function exportToJSON() {
    const exportData = {
      characters: characters.value,
      cards: cards.value,
      greetings: greetings.value
    }
    return JSON.stringify(exportData, null, 2)
  }

  function importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString)

      // Handle newest format with characters, cards, and greetings
      if (data.characters && data.cards && data.greetings) {
        characters.value = data.characters
        cards.value = data.cards
        greetings.value = data.greetings.map(g => ({
          ...g,
          predecessors: g.predecessors || []
        }))
        return true
      }

      // Handle format with characters but no separate cards
      if (data.characters && data.greetings) {
        characters.value = data.characters
        cards.value = []

        // Convert card strings to card objects
        const cardMap = new Map()
        data.greetings.forEach(greeting => {
          if (greeting.card && typeof greeting.card === 'string') {
            if (!cardMap.has(greeting.card.toLowerCase())) {
              const card = addCard(greeting.card)
              cardMap.set(greeting.card.toLowerCase(), card.id)
            }
          }
        })

        greetings.value = data.greetings.map(g => ({
          ...g,
          predecessors: g.predecessors || [],
          card: typeof g.card === 'string' ? cardMap.get(g.card.toLowerCase()) : g.card
        }))
        return true
      }

      // Handle old format (array of greetings with character names as strings)
      if (Array.isArray(data)) {
        // Convert old character names to new character objects
        const characterMap = new Map()
        const cardMap = new Map()

        data.forEach(greeting => {
          if (greeting.characters && Array.isArray(greeting.characters)) {
            greeting.characters.forEach(charName => {
              if (typeof charName === 'string' && !characterMap.has(charName.toLowerCase())) {
                const char = addCharacter(charName)
                characterMap.set(charName.toLowerCase(), char.id)
              }
            })
          }

          if (greeting.card && typeof greeting.card === 'string') {
            if (!cardMap.has(greeting.card.toLowerCase())) {
              const card = addCard(greeting.card)
              cardMap.set(greeting.card.toLowerCase(), card.id)
            }
          }
        })

        // Update greetings to use character IDs and card IDs
        greetings.value = data.map(g => ({
          ...g,
          predecessors: g.predecessors || [],
          characters: (g.characters || []).map(charName => {
            if (typeof charName === 'string') {
              return characterMap.get(charName.toLowerCase())
            }
            return charName // Already an ID
          }).filter(Boolean),
          card: typeof g.card === 'string' ? cardMap.get(g.card.toLowerCase()) : g.card
        }))

        return true
      }

      return false
    } catch (e) {
      console.error('Failed to import JSON:', e)
      return false
    }
  }

  // Character Actions
  function addCharacter(name) {
    // Check if character already exists
    const existing = characters.value.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      return existing
    }

    const newCharacter = {
      id: generateUniqueUUID(idExists),
      name: name.trim()
    }
    characters.value.push(newCharacter)
    return newCharacter
  }

  function deleteCharacter(id) {
    // Remove character
    characters.value = characters.value.filter(c => c.id !== id)

    // Remove character from all greetings
    greetings.value.forEach(g => {
      g.characters = g.characters.filter(cId => cId !== id)
    })
  }

  // Card Actions
  function addCard(name, url = '') {
    // Check if card already exists
    const existing = cards.value.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      return existing
    }

    const newCard = {
      id: generateUniqueUUID(idExists),
      name: name.trim(),
      url: url.trim()
    }
    cards.value.push(newCard)
    return newCard
  }

  function updateCard(id, updates) {
    const index = cards.value.findIndex(c => c.id === id)
    if (index !== -1) {
      cards.value[index] = { ...cards.value[index], ...updates }
    }
  }

  function deleteCard(id) {
    // Remove card
    cards.value = cards.value.filter(c => c.id !== id)

    // Remove card reference from all greetings
    greetings.value.forEach(g => {
      if (g.card === id) {
        g.card = null
      }
    })
  }

  function clearAll() {
    greetings.value = []
    characters.value = []
    cards.value = []
  }

  return {
    greetings,
    characters,
    cards,
    allGreetings,
    canonGreetings,
    getGreetingById,
    allCharacters,
    getCharacterById,
    allCards,
    getCardById,
    addGreeting,
    updateGreeting,
    deleteGreeting,
    addCharacter,
    deleteCharacter,
    addCard,
    updateCard,
    deleteCard,
    exportToJSON,
    importFromJSON,
    clearAll
  }
})
