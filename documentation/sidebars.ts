import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  tutorialSidebar: [
    'intro',
    'quick-start',
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core-concepts',
        'architecture',
        'event-bus',
        'state-management',
        'configuration',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/gesture-control',
        'features/keyboard-navigation',
        'features/voice-commands',
        'features/adaptive-system',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/getting-started',
        'guides/optimization',
        'guides/testing',
      ],
    },
  ],

  // API Reference sidebar
  apiSidebar: [
    'api/overview',
    {
      type: 'category',
      label: 'Core API',
      items: [
        'api/core/navigator',
        'api/core/event-bus',
        'api/core/state-manager',
        'api/core/config-loader',
      ],
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'api/plugins/base-plugin',
        'api/plugins/input-plugins',
        'api/plugins/output-plugins',
      ],
    },
  ],

  // Plugin Development sidebar
  pluginSidebar: [
    'plugin-development/getting-started',
    'plugin-development/plugin-architecture',
    {
      type: 'category',
      label: 'Creating Plugins',
      items: [
        'plugin-development/input-plugin-tutorial',
        'plugin-development/output-plugin-tutorial',
        'plugin-development/plugin-api',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'plugin-development/examples/vr-controller',
        'plugin-development/examples/philips-hue',
      ],
    },
  ],
};

export default sidebars;
