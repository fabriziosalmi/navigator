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
    description: 'Abstract class for creating Navigator plugins',
    link: 'https://github.com/fabriziosalmi/navigator/tree/main/packages/pdk#baseplugin',
    demo: () => {
      console.log('🔌 BasePlugin Demo:');
      console.log('- Provides lifecycle methods: init(), start(), stop(), destroy()');
      console.log('- Automatic event validation via NIP');
      console.log('- Plugin metadata management');
      const plugin = new DemoPlugin();
      console.log('Created plugin:', plugin.name, plugin.metadata);
    }
  },
  {
    title: 'NipValidator',
    description: 'Validate and create NIP v1.0 events',
    link: 'https://github.com/fabriziosalmi/navigator/blob/main/docs/NIP.md',
    demo: () => {
      console.log('✅ NipValidator Demo:');
      const event = NipValidator.createEvent(
        'custom:demo:click',
        'demo-plugin',
        { timestamp: Date.now() }
      );
      console.log('Valid NIP event created:', event);
      const isValid = NipValidator.validateEvent(event);
      console.log('Event is valid:', isValid);
    }
  },
  {
    title: 'Utilities',
    description: 'debounce, throttle, math helpers, and more',
    link: 'https://github.com/fabriziosalmi/navigator/tree/main/packages/pdk#utilities',
    demo: () => {
      console.log('🛠️ Utilities Demo:');
      const debouncedFn = debounce(() => console.log('Debounced!'), 500);
      console.log('Debounce: Will execute after 500ms of inactivity');
      debouncedFn();
      console.log('Math helpers: clamp(5, 0, 10) =', clamp(5, 0, 10));
      console.log('Math helpers: clamp(15, 0, 10) =', clamp(15, 0, 10));
    }
  },
  {
    title: 'Testing Mocks',
    description: 'CoreMock, EventBusMock, AppStateMock for testing',
    link: 'https://github.com/fabriziosalmi/navigator/tree/main/packages/pdk#testing-utilities',
    demo: () => {
      console.log('🧪 Testing Mocks Demo:');
      const mockCore = new CoreMock({ debugMode: false });
      console.log('CoreMock created:', mockCore);
      console.log('- Use for unit testing plugins');
      console.log('- Simulates Navigator Core behavior');
      console.log('- No real dependencies needed');
    }
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
      <div class="card-actions">
        <button class="btn-demo">Run Demo</button>
        ${card.link ? `<a href="${card.link}" target="_blank" class="btn-docs">📖 Docs</a>` : ''}
      </div>
    `;
    
    // Demo button handler
    const demoBtn = cardElement.querySelector('.btn-demo');
    if (demoBtn && card.demo) {
      demoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.clear();
        console.log(`\n${'='.repeat(50)}`);
        console.log(`  ${card.title.toUpperCase()} DEMO`);
        console.log('='.repeat(50) + '\n');
        card.demo();
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Visual feedback
        demoBtn.textContent = '✓ Ran Demo';
        setTimeout(() => {
          demoBtn.textContent = 'Run Demo';
        }, 2000);
      });
    }
    
    // Card hover effect
    cardElement.addEventListener('mouseenter', () => {
      cardElement.style.transform = 'translateY(-4px)';
    });
    
    cardElement.addEventListener('mouseleave', () => {
      cardElement.style.transform = '';
    });
    
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
