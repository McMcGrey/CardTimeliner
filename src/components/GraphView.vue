<template>
  <div class="graph-view">
    <div class="graph-header">
      <div>
        <h2>Timeline Graph</h2>
        <p class="description">Visual representation of greeting connections</p>
      </div>
      <button v-if="store.allGreetings.length > 0" class="btn-download" @click="downloadGraph">
        Download Graph
      </button>
    </div>

    <div v-if="store.allGreetings.length === 0" class="empty-state">
      <p>No greetings yet. Add some greetings to see the timeline graph!</p>
    </div>

    <div v-else class="graph-container">
      <v-network-graph
        ref="graph"
        :nodes="graphData.nodes"
        :edges="graphData.edges"
        :layouts="graphData.layouts"
        :configs="configs"
        :event-handlers="eventHandlers"
      >
        <template #override-node="{ nodeId, scale, config, ...slotProps }">
          <g>
            <!-- Draw split circle for Canon + AU -->
            <template v-if="getNodeFlags(nodeId).canon && getNodeFlags(nodeId).au">
              <!-- Left half - Canon (green) -->
              <path
                :d="getLeftHalfCircle(config.radius * scale)"
                fill="#42b883"
                :stroke="'#359268'"
                :stroke-width="2 * scale"
                v-bind="slotProps"
              />
              <!-- Right half - AU (purple) -->
              <path
                :d="getRightHalfCircle(config.radius * scale)"
                fill="#9b59b6"
                :stroke="'#7d3c98'"
                :stroke-width="2 * scale"
                v-bind="slotProps"
              />
            </template>
            <!-- Draw single color circle for others -->
            <circle
              v-else
              :r="config.radius * scale"
              :fill="getNodeColor(nodeId)"
              :stroke="getNodeStroke(nodeId)"
              :stroke-width="2 * scale"
              v-bind="slotProps"
            />
          </g>
        </template>
      </v-network-graph>

      <!-- Legend -->
      <div class="legend">
        <h4>Legend</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-circle canon-color"></div>
            <span>Canon</span>
          </div>
          <div class="legend-item">
            <div class="legend-circle au-color"></div>
            <span>AU</span>
          </div>
          <div class="legend-item">
            <div class="legend-circle split-color"></div>
            <span>Canon + AU</span>
          </div>
          <div class="legend-item">
            <div class="legend-circle regular-color"></div>
            <span>Regular</span>
          </div>
          <div class="legend-item">
            <div class="legend-arrow">→</div>
            <span>Timeline Flow</span>
          </div>
        </div>
      </div>

      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        class="tooltip"
        :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
      >
        <div class="tooltip-content">
          <h4>{{ tooltip.greeting.name }}</h4>
          <div class="tooltip-badges">
            <span v-if="tooltip.greeting.canon" class="badge canon">Canon</span>
            <span v-if="tooltip.greeting.au" class="badge au">AU</span>
          </div>
          <div v-if="tooltip.greeting.card" class="tooltip-section">
            <strong>Card:</strong> {{ getCardName(tooltip.greeting.card) }}
          </div>
          <div v-if="tooltip.greeting.characters && tooltip.greeting.characters.length > 0" class="tooltip-section">
            <strong>Characters:</strong>
            <div class="character-tags">
              <span
                v-for="charId in tooltip.greeting.characters"
                :key="charId"
                class="character-tag"
              >
                {{ getCharacterName(charId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useGreetingsStore } from '../stores/greetings'
import * as vNG from 'v-network-graph'

const store = useGreetingsStore()
const graph = ref()

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  greeting: null
})

const graphData = computed(() => {
  const nodes = {}
  const edges = {}
  const layouts = { nodes: {} }

  // Build nodes
  store.allGreetings.forEach(greeting => {
    const badges = []
    if (greeting.canon) badges.push('C')
    if (greeting.au) badges.push('AU')

    let color = '#4a90e2'
    if (greeting.canon) color = '#42b883'
    else if (greeting.au) color = '#9b59b6'

    nodes[greeting.id] = {
      name: badges.length > 0 ? `${greeting.name} [${badges.join(', ')}]` : greeting.name,
      color: color
    }
  })

  // Build edges
  store.allGreetings.forEach(greeting => {
    if (greeting.successors && greeting.successors.length > 0) {
      greeting.successors.forEach((successorId, index) => {
        const edgeId = `${greeting.id}->${successorId}-${index}`
        edges[edgeId] = {
          source: greeting.id,
          target: successorId
        }
      })
    }
  })

  // Calculate layout
  const levels = {}
  const visited = new Set()

  function assignLevel(greetingId, level = 0) {
    if (visited.has(greetingId)) return
    visited.add(greetingId)

    if (!levels[level]) levels[level] = []
    levels[level].push(greetingId)

    const greeting = store.allGreetings.find(g => g.id === greetingId)
    if (greeting && greeting.successors) {
      greeting.successors.forEach(successorId => {
        assignLevel(successorId, level + 1)
      })
    }
  }

  // Find roots (no predecessors)
  const roots = store.allGreetings.filter(g => !g.predecessors || g.predecessors.length === 0)

  if (roots.length > 0) {
    roots.forEach(root => assignLevel(root.id))
  }

  // Handle disconnected nodes
  store.allGreetings.forEach(g => {
    if (!visited.has(g.id)) {
      assignLevel(g.id, 0)
    }
  })

  // Position nodes
  const horizontalSpacing = 250
  const verticalSpacing = 100

  Object.keys(levels).forEach(level => {
    const nodesInLevel = levels[level]
    const levelNum = parseInt(level)

    nodesInLevel.forEach((nodeId, index) => {
      layouts.nodes[nodeId] = {
        x: levelNum * horizontalSpacing,
        y: index * verticalSpacing - (nodesInLevel.length - 1) * verticalSpacing / 2
      }
    })
  })

  return { nodes, edges, layouts }
})

const configs = vNG.defineConfigs({
  view: {
    scalingObjects: true,
    minZoomLevel: 0.3,
    maxZoomLevel: 2
  },
  node: {
    selectable: true,
    normal: {
      type: 'circle',
      radius: 16,
      color: node => node.color || '#4a90e2'
    },
    hover: {
      radius: 18
    },
    label: {
      visible: true,
      fontSize: 11,
      direction: 'south',
      color: '#333'
    }
  },
  edge: {
    normal: {
      color: '#999',
      width: 2
    },
    marker: {
      target: {
        type: 'arrow',
        width: 8,
        height: 8
      }
    }
  }
})

const eventHandlers = {
  'node:pointerover': ({ node, event }) => {
    const greeting = store.allGreetings.find(g => g.id === node)
    if (greeting) {
      tooltip.greeting = greeting
      tooltip.x = event.pageX + 15
      tooltip.y = event.pageY + 15
      tooltip.visible = true
    }
  },
  'node:pointerout': () => {
    tooltip.visible = false
  },
  'node:pointermove': ({ event }) => {
    tooltip.x = event.pageX + 15
    tooltip.y = event.pageY + 15
  }
}

function getCharacterName(id) {
  const character = store.allCharacters.find(c => c.id === id)
  return character ? character.name : 'Unknown'
}

function getCardName(id) {
  const card = store.allCards.find(c => c.id === id)
  return card ? card.name : 'Unknown'
}

function getNodeFlags(nodeId) {
  const greeting = store.allGreetings.find(g => g.id === nodeId)
  return {
    canon: greeting?.canon || false,
    au: greeting?.au || false
  }
}

function getNodeColor(nodeId) {
  const flags = getNodeFlags(nodeId)
  if (flags.canon) return '#42b883'
  if (flags.au) return '#9b59b6'
  return '#4a90e2'
}

function getNodeStroke(nodeId) {
  const flags = getNodeFlags(nodeId)
  if (flags.canon) return '#359268'
  if (flags.au) return '#7d3c98'
  return '#357abd'
}

function getLeftHalfCircle(radius) {
  // SVG path for left half of circle
  return `M 0,${-radius} A ${radius},${radius} 0 0,1 0,${radius} L 0,0 Z`
}

function getRightHalfCircle(radius) {
  // SVG path for right half of circle
  return `M 0,${-radius} A ${radius},${radius} 0 0,0 0,${radius} L 0,0 Z`
}

async function downloadGraph() {
  if (!graph.value) return

  try {
    // Export as SVG
    const svgText = await graph.value.exportAsSvgText()

    // Create a Blob and download
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `timeline-graph-${new Date().toISOString().split('T')[0]}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Also convert to PNG for better compatibility
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `timeline-graph-${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)))
  } catch (error) {
    console.error('Error downloading graph:', error)
    alert('Failed to download graph. Please try again.')
  }
}
</script>

<style scoped>
.graph-view {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.graph-header h2 {
  margin: 0;
  color: #333;
}

.btn-download {
  padding: 0.5rem 1rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-download:hover {
  background: #357abd;
}

.description {
  color: #666;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-style: italic;
  background: #f9f9f9;
  border-radius: 8px;
}

.graph-container {
  position: relative;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  height: 600px;
  overflow: hidden;
}

.tooltip {
  position: fixed;
  background: white;
  border: 2px solid #333;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  pointer-events: none;
  max-width: 300px;
}

.tooltip-content h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.tooltip-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.badge.canon {
  background: #42b883;
}

.badge.au {
  background: #9b59b6;
}

.tooltip-section {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.tooltip-section strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #555;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.character-tag {
  background: #f0f0f0;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.75rem;
}

/* Legend */
.legend {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.legend h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #333;
  font-weight: 600;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #555;
}

.legend-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #333;
}

.canon-color {
  background: #42b883;
  border-color: #359268;
}

.au-color {
  background: #9b59b6;
  border-color: #7d3c98;
}

.regular-color {
  background: #4a90e2;
  border-color: #357abd;
}

.split-color {
  background: linear-gradient(90deg, #42b883 50%, #9b59b6 50%);
  border-color: #333;
}

.legend-arrow {
  font-size: 1.25rem;
  color: #999;
  font-weight: bold;
  width: 16px;
  text-align: center;
}
</style>
