/**
 * Navigator Menu - Demo Application
 * Showcasing @navigator.menu/pdk features
 */

import { BasePlugin, NipValidator, debounce, clamp } from '@navigator.menu/pdk';
import { CoreMock } from '@navigator.menu/pdk/testing';

// Example plugin using BasePlugin
class DemoPlugin extends BasePlugin {
  constructor() {
    super('demo-plugin');
  }

  async init() {
    // console.log('✅ DemoPlugin initialized!');
    
    // Create NIP-compliant event
    const event = NipValidator.createEvent(
      'custom:demo:initialized',
      this.name,
      { message: 'Demo plugin is ready!' }
    );
    
    // console.log('📤 Event created:', event);
  }

  async start() {
    // console.log('🚀 DemoPlugin started!');
  }
}

const cards = [
  {
    title: 'BasePlugin',
    description: 'Abstract class for creating Navigator plugins'
  },
  {
    title: 'NipValidator',
    description: 'Validate and create NIP v1.0 events'
  },
  {
    title: 'Utilities',
    description: 'debounce, throttle, math helpers, and more'
  },
  {
    title: 'Testing Mocks',
    description: 'CoreMock, EventBusMock, AppStateMock for testing'
  }
];

function init() {
  const container = document.getElementById('cardsContainer');
  
  // Render cards
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.innerHTML = `
      <h3>${card.title}</h3>
      <p>${card.description}</p>
    `;
    
    // Demo: debounced click handler
    const handleClick = debounce(() => {
      // console.log('Card clicked (debounced):', card.title);
      cardElement.style.transform = `scale(${clamp(1.05, 0.95, 1.1)})`;
      setTimeout(() => {
        cardElement.style.transform = '';
      }, 200);
    }, 300);
    
    cardElement.addEventListener('click', handleClick);
    container.appendChild(cardElement);
  });
  
  // Demo: Initialize Navigator Core with plugin
  const core = new CoreMock({ debugMode: true });
  const plugin = new DemoPlugin();
  
  core.registerPlugin(plugin, { priority: 10 });
  
  core.init().then(() => {
    // console.log('✨ Navigator Core initialized with DemoPlugin!');
    core.start();
  });
  
  // console.log('🎯 Navigator Demo App initialized!');
  // console.log('📦 Using @navigator.menu/pdk v2.0.0');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
