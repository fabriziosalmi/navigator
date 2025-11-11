import './ImageCarousel.css';

interface ImageCarouselProps {
  currentIndex: number;
  cognitiveState: string;
}

const IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    title: 'Space Station',
  },
  {
    url: 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=800',
    title: 'Cosmic Nebula',
  },
  {
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800',
    title: 'Galaxy Cluster',
  },
  {
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
    title: 'Deep Space',
  },
  {
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
    title: 'Star Field',
  },
];

function ImageCarousel({ currentIndex, cognitiveState }: ImageCarouselProps) {
  const getAnimationSpeed = () => {
    switch (cognitiveState) {
      case 'concentrated':
        return 'fast';
      case 'frustrated':
        return 'slow';
      case 'learning':
        return 'medium';
      default:
        return 'normal';
    }
  };

  return (
    <div className="carousel-container">
      <div 
        className={`carousel-track speed-${getAnimationSpeed()}`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {IMAGES.map((image, index) => (
          <div key={index} className="carousel-slide">
            <img
              src={image.url}
              alt={image.title}
              className="carousel-image"
            />
            <div className="carousel-caption">
              <span className="slide-number">{index + 1} / {IMAGES.length}</span>
              <h3>{image.title}</h3>
            </div>
          </div>
        ))}
      </div>
      
      <div className="carousel-indicators">
        {IMAGES.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="cognitive-overlay" data-state={cognitiveState}>
        <div className="state-badge">{cognitiveState}</div>
      </div>
    </div>
  );
}

export default ImageCarousel;
