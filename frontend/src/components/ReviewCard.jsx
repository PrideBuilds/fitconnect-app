import React from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';

/**
 * ReviewCard Component
 *
 * Displays a single review with client name, rating, comment, and date.
 *
 * @param {object} review - The review object
 * @param {function} onEdit - Optional callback for editing review
 * @param {function} onDelete - Optional callback for deleting review
 * @param {boolean} showActions - Whether to show edit/delete actions
 */
const ReviewCard = ({
  review,
  onEdit = null,
  onDelete = null,
  showActions = false
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header: Client info and rating */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Client avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {review.client_name ? review.client_name.charAt(0).toUpperCase() : '?'}
          </div>

          {/* Client name and date */}
          <div>
            <h4 className="font-medium text-gray-900">
              {review.client_name || 'Anonymous'}
            </h4>
            <p className="text-sm text-gray-500">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>

        {/* Rating */}
        <StarRating rating={review.rating} readonly size="sm" />
      </div>

      {/* Review comment */}
      {review.comment && (
        <p className="text-gray-700 leading-relaxed mb-3">
          {review.comment}
        </p>
      )}

      {/* Verified badge */}
      {review.is_verified && (
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Verified booking</span>
        </div>
      )}

      {/* Actions (edit/delete) */}
      {showActions && review.can_edit && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(review)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number.isRequired,
    client_name: PropTypes.string,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    is_verified: PropTypes.bool,
    can_edit: PropTypes.bool,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showActions: PropTypes.bool,
};

export default ReviewCard;
