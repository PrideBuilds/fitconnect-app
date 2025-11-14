import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * StarRating Component
 *
 * Displays a star rating (1-5 stars) with optional interactivity.
 * Can be used in read-only mode to display ratings or interactive mode for selection.
 *
 * @param {number} rating - The rating value (0-5)
 * @param {function} onChange - Callback function when rating is changed (interactive mode)
 * @param {boolean} readonly - If true, stars are not clickable
 * @param {string} size - Size of stars: 'sm', 'md', 'lg'
 * @param {boolean} showCount - If true, shows the numeric rating
 */
const StarRating = ({
  rating = 0,
  onChange = null,
  readonly = false,
  size = 'md',
  showCount = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const handleClick = (value) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly && onChange) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly && onChange) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;
        const isHalf = !isFilled && star - 0.5 <= displayRating;

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`
              ${sizeClasses[size]}
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-transform duration-150
              focus:outline-none
            `}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            {isFilled ? (
              // Filled star
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-yellow-400"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : isHalf ? (
              // Half-filled star
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-yellow-400"
              >
                <defs>
                  <linearGradient id={`half-${star}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="rgb(229, 231, 235)" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${star})`}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            ) : (
              // Empty star
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-gray-300"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        );
      })}

      {showCount && (
        <span className="ml-1 text-sm text-gray-600 font-medium">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number,
  onChange: PropTypes.func,
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showCount: PropTypes.bool,
};

export default StarRating;
