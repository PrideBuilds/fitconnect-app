import React, { useState } from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';
import { Button } from './ui';

/**
 * ReviewForm Modal Component
 *
 * Modal form for submitting or editing reviews for completed bookings.
 *
 * @param {object} booking - The booking object to review
 * @param {object} existingReview - Optional existing review for editing
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSuccess - Callback when review is successfully submitted
 */
const ReviewForm = ({
  booking,
  existingReview = null,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = existingReview
        ? `http://localhost:8000/api/v1/bookings/reviews/${existingReview.id}/`
        : 'http://localhost:8000/api/v1/bookings/reviews/';

      const method = existingReview ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking: booking.id,
          rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.non_field_errors?.[0] || 'Failed to submit review');
      }

      const reviewData = await response.json();
      onSuccess(reviewData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Trainer Info */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Session with</p>
          <p className="font-semibold text-gray-900">{booking.trainer_name}</p>
          <p className="text-sm text-gray-500">
            {new Date(booking.session_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <div className="flex justify-center">
              <StarRating
                rating={rating}
                onChange={setRating}
                size="lg"
              />
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Review (Optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this trainer..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : existingReview ? (
                'Update Review'
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

ReviewForm.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.number.isRequired,
    trainer_name: PropTypes.string.isRequired,
    session_date: PropTypes.string.isRequired,
  }).isRequired,
  existingReview: PropTypes.shape({
    id: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default ReviewForm;
