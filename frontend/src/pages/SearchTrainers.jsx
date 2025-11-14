import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import { Button, Card, Badge } from '../components/ui'
import TrainerCard from '../components/TrainerCard'

const libraries = ['places']
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * Search Trainers Page
 * Search and browse available trainers by location, specialization, and price
 */
const SearchTrainers = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Google Maps autocomplete
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries,
  })
  const [autocomplete, setAutocomplete] = useState(null)

  // Search filters
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [radius, setRadius] = useState(searchParams.get('radius') || '25')
  const [selectedSpecializations, setSelectedSpecializations] = useState([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('distance')

  // Data state
  const [specializations, setSpecializations] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  // Load specializations on mount
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/trainers/specializations/')
        if (response.ok) {
          const data = await response.json()
          setSpecializations(data)
        }
      } catch (err) {
        console.error('Failed to load specializations:', err)
      }
    }
    fetchSpecializations()
  }, [])

  // Search on initial load if location provided
  useEffect(() => {
    const initialLocation = searchParams.get('location')
    if (initialLocation && !loading) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle Google Places Autocomplete
  const onLoad = useCallback((autocompleteInstance) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setLocation(place.formatted_address)
      }
    }
  }

  // Search function
  const handleSearch = async (e) => {
    if (e) e.preventDefault()

    if (!location.trim()) {
      setError('Please enter a location')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams({
        address: location,
        radius: radius,
        page: page.toString(),
      })

      if (selectedSpecializations.length > 0) {
        params.append('specializations', selectedSpecializations.join(','))
      }

      if (minPrice) {
        params.append('min_price', minPrice)
      }

      if (maxPrice) {
        params.append('max_price', maxPrice)
      }

      if (minRating) {
        params.append('min_rating', minRating)
      }

      if (minExperience) {
        params.append('min_experience', minExperience)
      }

      if (verifiedOnly) {
        params.append('verified_only', 'true')
      }

      if (sortBy && sortBy !== 'distance') {
        params.append('sort_by', sortBy)
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/trainers/search/?${params.toString()}`
      )

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to search trainers')
        } else {
          // Response is HTML or other format (likely an error page)
          const errorText = await response.text()
          throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}...`)
        }
      }

      const data = await response.json()
      setResults(data.results)
      setTotalResults(data.count)
      setHasNextPage(!!data.next)
      setHasPreviousPage(!!data.previous)

      // Update URL params
      setSearchParams({ location, radius })
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle specialization filter
  const toggleSpecialization = (specId) => {
    setSelectedSpecializations((prev) =>
      prev.includes(specId) ? prev.filter((id) => id !== specId) : [...prev, specId]
    )
  }

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((p) => p + 1)
    }
  }

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setPage((p) => Math.max(1, p - 1))
    }
  }

  // Re-search when page changes
  useEffect(() => {
    if (page > 1 && location) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Trainer</h1>
          <p className="text-gray-600">
            Search for certified fitness professionals near you
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                {isLoaded && GOOGLE_MAPS_API_KEY ? (
                  <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter city, state, or zip"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter city, state, or zip"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                )}
              </div>

              {/* Radius */}
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                  Radius (miles)
                </label>
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="25">25 miles</option>
                  <option value="50">50 miles</option>
                  <option value="100">100 miles</option>
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  id="minPrice"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="$0"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Max Price */}
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="$200"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Rating
                </label>
                <select
                  id="minRating"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Min Experience */}
              <div>
                <label htmlFor="minExperience" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Experience
                </label>
                <select
                  id="minExperience"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Any Experience</option>
                  <option value="1">1+ Years</option>
                  <option value="3">3+ Years</option>
                  <option value="5">5+ Years</option>
                  <option value="10">10+ Years</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="distance">Distance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                </select>
              </div>
            </div>

            {/* Specializations */}
            {specializations.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => toggleSpecialization(spec.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedSpecializations.includes(spec.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {spec.icon && <span className="mr-1">{spec.icon}</span>}
                      {spec.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Only */}
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Show only verified trainers
                </span>
              </label>
            </div>

            {/* Search Button */}
            <Button type="submit" size="lg" loading={loading} disabled={loading}>
              {loading ? 'Searching...' : 'Search Trainers'}
            </Button>
          </form>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center text-red-800">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {totalResults} Trainer{totalResults !== 1 ? 's' : ''} Found
              </h2>
              <div className="text-sm text-gray-500">
                Page {page} • {results.length} results
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4 mb-8">
              {results.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>

            {/* Pagination */}
            {(hasNextPage || hasPreviousPage) && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={handlePreviousPage}
                  disabled={!hasPreviousPage}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <Button onClick={handleNextPage} disabled={!hasNextPage} variant="outline">
                  Next
                </Button>
              </div>
            )}
          </>
        ) : !loading && location ? (
          <Card className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No trainers found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search filters or increasing the search radius.
            </p>
          </Card>
        ) : !loading ? (
          <Card className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Search</h3>
            <p className="text-gray-500">
              Enter your location and preferences to find trainers near you.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default SearchTrainers
