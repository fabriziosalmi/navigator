import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Navigator SDK",
  description: "Advanced gesture and keyboard navigation SDK for web applications",
  base: '/',
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Guide', link: '/architecture' },
      { text: 'API', link: '/api/' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Features', link: '/features' },
          { text: 'Configuration', link: '/configuration' }
        ]
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/architecture' },
          { text: 'Unidirectional Flow', link: '/unidirectional-flow' },
          { text: 'Plugin System', link: '/plugin-architecture' },
          { text: 'Cognitive Intelligence', link: '/cognitive-intelligence' }
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Cookbook', link: '/cookbook' },
          { text: 'Optimization Guide', link: '/optimization-guide' },
          { text: 'Testing Guide', link: '/testing/' }
        ]
      },
      {
        text: 'UI/UX',
        items: [
          { text: 'Dual HUD Layout', link: '/dual-hud-layout' },
          { text: 'Monochrome Design', link: '/monochrome-design' },
          { text: 'CSS Modularization', link: '/css-modularization' }
        ]
      },
      {
        text: 'Security',
        items: [
          { text: 'Security Overview', link: '/security/' },
          { text: 'Branch Protection', link: '/branch-protection' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fabriziosalmi/navigator' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Navigator SDK'
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
