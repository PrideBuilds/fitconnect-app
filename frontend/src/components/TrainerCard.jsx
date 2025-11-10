import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Badge, Card } from './ui'
import { getTrainerDetailPath } from '../routes'

const TrainerCard = ({ trainer }) => {
  // Get primary profile photo or first gym photo
  const profilePhoto = trainer.photos?.find((p) => p.photo_type === 'profile')
  const fallbackPhoto = trainer.photos?.[0]
  const photoUrl = profilePhoto?.photo || fallbackPhoto?.photo

  return (
    <Link to={getTrainerDetailPath(trainer.id)} className="block">
      <Card hover className="h-full">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Photo */}
          <div className="w-full sm:w-32 h-48 sm:h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${trainer.user.first_name} ${trainer.user.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {trainer.user.first_name} {trainer.user.last_name}
                  {trainer.verified && (
                    <svg
                      className="inline-block w-5 h-5 ml-1 text-primary-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      title="Verified Trainer"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </h3>

                {/* Distance Badge */}
                {trainer.distance_miles !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {trainer.distance_miles} mi away
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-gray-900">
                  ${trainer.hourly_rate}
                </div>
                <div className="text-xs text-gray-500">per hour</div>
              </div>
            </div>

            {/* Rating */}
            {trainer.total_reviews > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-900">
                    {parseFloat(trainer.average_rating).toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  ({trainer.total_reviews} review{trainer.total_reviews !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Specializations */}
            {trainer.specializations && trainer.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {trainer.specializations.slice(0, 3).map((spec) => (
                  <Badge key={spec.id} variant="primary" className="text-xs">
                    {spec.icon && <span className="mr-1">{spec.icon}</span>}
                    {spec.name}
                  </Badge>
                ))}
                {trainer.specializations.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{trainer.specializations.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Bio (truncated) */}
            {trainer.bio && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {trainer.bio}
              </p>
            )}

            {/* Experience */}
            {trainer.years_experience > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {trainer.years_experience} year{trainer.years_experience !== 1 ? 's' : ''} of
                experience
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

TrainerCard.propTypes = {
  trainer: PropTypes.shape({
    id: PropTypes.number.isRequired,
    user: PropTypes.shape({
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
    }).isRequired,
    bio: PropTypes.string,
    hourly_rate: PropTypes.string.isRequired,
    years_experience: PropTypes.number,
    verified: PropTypes.bool,
    average_rating: PropTypes.string,
    total_reviews: PropTypes.number,
    distance_miles: PropTypes.number,
    specializations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string,
      })
    ),
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        photo: PropTypes.string.isRequired,
        photo_type: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
}

export default TrainerCard
