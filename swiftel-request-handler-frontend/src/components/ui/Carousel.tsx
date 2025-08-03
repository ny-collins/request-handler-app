import React, { useState, Children, cloneElement, isValidElement } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface CarouselProps {
  children: React.ReactNode;
  slidesToShow?: number; // Number of slides to show at once
}

const Carousel: React.FC<CarouselProps> = ({ children, slidesToShow = 1 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = Children.count(children);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  };

  const getTransformValue = () => {
    // Calculate transform based on slidesToShow and current index
    // This assumes all slides have equal width, which is handled by CSS
    return `translateX(-${(currentIndex / slidesToShow) * 100}%)`;
  };

  return (
    <div className="carousel-container">
      <div className="carousel-track-container">
        <div className="carousel-track" style={{ transform: getTransformValue() }}>
          {Children.map(children, (child) => {
            if (isValidElement(child)) {
              return cloneElement(child, { className: `${child.props.className || ''} carousel-slide` });
            }
            return child;
          })}
        </div>
      </div>

      {totalSlides > slidesToShow && (
        <div className="carousel-navigation">
          <button onClick={handlePrev} className="carousel-nav-button carousel-prev">
            <FiChevronLeft />
          </button>
          <div className="carousel-dots">
            {Array.from({ length: Math.ceil(totalSlides / slidesToShow) }).map((_, index) => (
              <span
                key={index}
                className={`carousel-dot ${index === Math.floor(currentIndex / slidesToShow) ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index * slidesToShow)}
              />
            ))}
          </div>
          <button onClick={handleNext} className="carousel-nav-button carousel-next">
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default Carousel;