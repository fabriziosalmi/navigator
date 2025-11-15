/**
 * Navigator Menu - Demo Application
 * Showcasing @navigator.menu/pdk features
 */

import '../css/main.css';
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
    icon: '🔌',
    title: 'BasePlugin',
    description: 'Build custom Navigator plugins with lifecycle management',
    details: 'Abstract class providing init(), start(), stop(), and destroy() methods with automatic NIP event validation.',
    link: 'https://github.com/fabriziosalmi/navigator/tree/main/packages/pdk#baseplugin',
    demo: () => {
      console.log('%c🔌 BasePlugin Demo', 'font-size: 18px; font-weight: bold; color: #00d4ff;');
      console.log('━'.repeat(60));
      
      const plugin = new DemoPlugin();
      console.log('✅ Created plugin instance:', {
        name: plugin.name,
        metadata: plugin.metadata,
        lifecycle: ['init()', 'start()', 'stop()', 'destroy()']
      });
      
      console.log('\n📋 Key Features:');
      console.log('  • Automatic lifecycle management');
      console.log('  • Built-in NIP event validation');
      console.log('  • Plugin metadata tracking');
      console.log('  • Error boundary protection');
      
      console.log('\n💡 Usage Example:');
      console.log(`  class MyPlugin extends BasePlugin {
    constructor() {
      super('my-plugin');
    }
    
    async init() {
      // Initialize your plugin
    }
  }`);
      
      console.log('\n━'.repeat(60));
      updateConsoleStatus('BasePlugin demo completed ✓', 'success');
    }
  },
  {
    icon: '✅',
    title: 'NipValidator',
    description: 'Validate Navigator Interface Protocol (NIP) v1.0 events',
    details: 'Ensures all events follow the NIP specification with type, source, payload, and metadata validation.',
    link: 'https://github.com/fabriziosalmi/navigator/blob/main/docs/NIP.md',
    demo: () => {
      console.log('%c✅ NipValidator Demo', 'font-size: 18px; font-weight: bold; color: #22c55e;');
      console.log('━'.repeat(60));
      
      // Valid event
      const validEvent = NipValidator.createEvent(
        'custom:demo:click',
        'demo-plugin',
        { timestamp: Date.now(), value: 42 }
      );
      console.log('✓ Created NIP-compliant event:', validEvent);
      
      const isValid = NipValidator.validateEvent(validEvent);
      console.log('✓ Validation result:', isValid ? '✅ VALID' : '❌ INVALID');
      
      console.log('\n📋 NIP v1.0 Event Structure:');
      console.log(`  {
    type: "namespace:category:action",
    source: "plugin-name",
    payload: { /* your data */ },
    metadata: { timestamp, id }
  }`);
      
      // Invalid event example
      console.log('\n⚠️ Testing invalid event:');
      const invalidEvent = { type: 'invalid', foo: 'bar' };
      const invalidResult = NipValidator.validateEvent(invalidEvent);
      console.log('  Result:', invalidResult ? '✅ VALID' : '❌ INVALID (as expected)');
      
      console.log('\n━'.repeat(60));
      updateConsoleStatus('NipValidator demo completed ✓', 'success');
    }
  },
  {
    icon: '🛠️',
    title: 'Utilities',
    description: 'Performance helpers: debounce, throttle, clamp, and more',
    details: 'Common utility functions to optimize your plugin performance and handle edge cases.',
    link: 'https://github.com/fabriziosalmi/navigator/tree/main/packages/pdk#utilities',
    demo: () => {
      console.log('%c🛠️ Utilities Demo', 'font-size: 18px; font-weight: bold; color: #f59e0b;');
      console.log('━'.repeat(60));
      
      console.log('📌 1. Debounce Function:');
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
        console.log(`  → Executed! (call #${callCount})`);
      }, 500);
      
      console.log('  Calling 5 times rapidly...');
      for (let i = 0; i < 5; i++) {
        debouncedFn();
      }
      console.log('  ⏱️  Will execute only once after 500ms of inactivity');
      
      console.log('\n📌 2. Math Helpers:');
      console.log('  clamp(5, 0, 10) =', clamp(5, 0, 10), '(within bounds)');
      console.log('  clamp(15, 0, 10) =', clamp(15, 0, 10), '(clamped to max)');
      console.log('  clamp(-5, 0, 10) =', clamp(-5, 0, 10), '(clamped to min)');
      
      console.log('\n📋 Available Utilities:');
      console.log('  • debounce(fn, delay) - Delay execution until idle');
      console.log('  • throttle(fn, delay) - Limit execution rate');
      console.log('  • clamp(value, min, max) - Constrain number');
      console.log('  • deepClone(obj) - Deep object copy');
      
      console.log('\n━'.repeat(60));
      updateConsoleStatus('Utilities demo completed ✓', 'success');
    }
  },
  {
    icon: '🧪',
    title: 'Testing Mocks',
    description: 'Unit test your plugins with CoreMock and EventBusMock',
    details: 'Lightweight mocks simulating Navigator Core behavior without real dependencies.',
    link: 'https://github.com/fabriziosalmi/navigator/tree/main/packages/pdk#testing-utilities',
    demo: () => {
      console.log('%c🧪 Testing Mocks Demo', 'font-size: 18px; font-weight: bold; color: #a78bfa;');
      console.log('━'.repeat(60));
      
      const mockCore = new CoreMock({ debugMode: false });
      console.log('✓ Created CoreMock instance:', {
        config: mockCore.config,
        methods: ['init()', 'start()', 'stop()', 'registerPlugin()']
      });
      
      const testPlugin = new DemoPlugin();
      mockCore.registerPlugin(testPlugin, { priority: 10 });
      console.log('✓ Registered test plugin:', testPlugin.name);
      
      console.log('\n📋 Testing Workflow:');
      console.log(`  import { CoreMock } from '@navigator.menu/pdk/testing';
  
  describe('MyPlugin', () => {
    it('should initialize', async () => {
      const core = new CoreMock();
      const plugin = new MyPlugin();
      
      await core.registerPlugin(plugin);
      await core.init();
      
      expect(plugin.isInitialized).toBe(true);
    });
  });`);
      
      console.log('\n✨ Benefits:');
      console.log('  • No real Navigator dependencies');
      console.log('  • Fast unit test execution');
      console.log('  • Predictable mock behavior');
      console.log('  • Easy setup and teardown');
      
      console.log('\n━'.repeat(60));
      updateConsoleStatus('Testing Mocks demo completed ✓', 'success');
    }
  }
];

// Update console status indicator in sidebar
function updateConsoleStatus(message, type = 'info') {
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.console-status p');
  
  if (statusIndicator) {
    statusIndicator.className = 'status-indicator';
    statusIndicator.classList.add(type);
  }
  
  if (statusText) {
    statusText.textContent = message;
  }
  
  // Reset to idle after 3 seconds
  setTimeout(() => {
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator idle';
    }
    if (statusText) {
      statusText.textContent = 'Ready - Click a demo to start';
    }
  }, 3000);
}

function init() {
  const container = document.getElementById('cardsContainer');
  
  // Render cards with enhanced structure
  cards.forEach((card, index) => {
    const cardElement = document.createElement('article');
    cardElement.className = 'card';
    cardElement.style.animationDelay = `${index * 0.1}s`;
    cardElement.innerHTML = `
      <div class="card-icon">${card.icon}</div>
      <h3>${card.title}</h3>
      <p class="card-description">${card.description}</p>
      <p class="card-details">${card.details}</p>
      <div class="card-actions">
        <button class="btn-demo">
          <span>▶ Run Demo</span>
        </button>
        ${card.link ? `<a href="${card.link}" target="_blank" rel="noopener" class="btn-docs">📖 Docs</a>` : ''}
      </div>
    `;
    
    // Demo button handler with enhanced feedback
    const demoBtn = cardElement.querySelector('.btn-demo');
    if (demoBtn && card.demo) {
      demoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Visual feedback
        demoBtn.classList.add('running');
        updateConsoleStatus(`Running ${card.title} demo...`, 'running');
        
        // Run demo
        console.clear();
        card.demo();
        
        // Reset button after animation
        setTimeout(() => {
          demoBtn.classList.remove('running');
          demoBtn.innerHTML = '<span>✓ Completed</span>';
          
          setTimeout(() => {
            demoBtn.innerHTML = '<span>▶ Run Demo</span>';
          }, 2000);
        }, 300);
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
    core.start();
    console.log('%c✨ Navigator PDK Demo Ready!', 'font-size: 16px; font-weight: bold; color: #00d4ff;');
    console.log('Click any "Run Demo" button to see the PDK features in action.');
    updateConsoleStatus('Demo ready - Click a card to start', 'idle');
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
