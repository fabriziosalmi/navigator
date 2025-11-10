/**
 * Navigator Menu - Main Application
 */

const cards = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of Navigator'
  },
  {
    title: 'Documentation',
    description: 'Explore the full API reference'
  },
  {
    title: 'Examples',
    description: 'Browse sample applications'
  },
  {
    title: 'Community',
    description: 'Join the Navigator community'
  }
];

function init() {
  const container = document.getElementById('cardsContainer');
  
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.innerHTML = `
      <h3>${card.title}</h3>
      <p>${card.description}</p>
    `;
    
    cardElement.addEventListener('click', () => {
      // console.log('Card clicked:', card.title);
    });
    
    container.appendChild(cardElement);
  });
  
  // console.log('Navigator app initialized!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
