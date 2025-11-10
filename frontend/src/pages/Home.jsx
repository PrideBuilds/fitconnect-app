import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { ROUTES } from '../routes'

const Home = () => {
  const navigate = useNavigate()
  const [searchLocation, setSearchLocation] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchLocation.trim()) {
      navigate(`${ROUTES.SEARCH_TRAINERS}?location=${encodeURIComponent(searchLocation)}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
              <span className="text-sm font-medium">🚀 Join 10,000+ fitness enthusiasts</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up">
              Find & Book Your Perfect{' '}
              <span className="text-yellow-300">Fitness Professional</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-50 mb-10 max-w-2xl mx-auto animate-slide-up">
              Connect with certified trainers and gyms across the United States.
              Your fitness journey starts here.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-scale-in">
              <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-card-lg">
                <div className="flex-1 flex items-center px-4">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter city, state, or zip code"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="flex-1 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <Button type="submit" size="lg" className="sm:w-auto w-full">
                  Find Trainers
                </Button>
              </div>
            </form>

            {/* Popular Searches */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-primary-100 text-sm">Popular:</span>
              {['New York', 'Los Angeles', 'Chicago', 'Miami'].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSearchLocation(city)
                    navigate(`${ROUTES.SEARCH_TRAINERS}?location=${city}`)
                  }}
                  className="text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">5K+</div>
              <div className="text-gray-600">Certified Trainers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600">Cities Covered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">4.9★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Popular Cities */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore Popular Cities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find fitness professionals nearby, or explore trainers in cities around the country
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                city: 'Los Angeles',
                state: 'CA',
                trainers: '200+',
                image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&auto=format&fit=crop&q=80',
              },
              {
                city: 'New York',
                state: 'NY',
                trainers: '350+',
                image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
                featured: true,
              },
              {
                city: 'San Francisco',
                state: 'CA',
                trainers: '180+',
                image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop&q=80',
              },
              {
                city: 'Austin',
                state: 'TX',
                trainers: '120+',
                image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&auto=format&fit=crop&q=80',
              },
              {
                city: 'Miami',
                state: 'FL',
                trainers: '150+',
                image: 'https://images.unsplash.com/photo-1506966161761-0ff0e84ea1b4?w=800&auto=format&fit=crop&q=80',
              },
              {
                city: 'Seattle',
                state: 'WA',
                trainers: '110+',
                image: 'https://images.unsplash.com/photo-1591019052241-e4d95a5dc3fc?w=800&auto=format&fit=crop&q=80',
              },
            ].map((location, index) => (
              <button
                key={index}
                onClick={() => navigate(`${ROUTES.SEARCH_TRAINERS}?location=${location.city}, ${location.state}`)}
                className={`group relative h-48 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  location.featured ? 'md:col-span-1' : ''
                }`}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${location.image})`,
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Featured Badge */}
                {location.featured && (
                  <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}

                {/* Search Icon for Featured City */}
                {location.featured && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-xl group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* City Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-2xl font-bold mb-1">{location.city}</h3>
                  <p className="text-white/90 text-sm">{location.trainers} fitness professionals</p>
                </div>
              </button>
            ))}
          </div>

          {/* View All Cities Link */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate(ROUTES.SEARCH_TRAINERS)}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
            >
              View All Cities
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose FitConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The easiest way to find and book fitness professionals near you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Easy Discovery',
                description: 'Search by location, specialty, and availability to find the perfect trainer for your goals.',
              },
              {
                icon: '✅',
                title: 'Verified Professionals',
                description: 'All trainers are certified and background-checked for your safety and peace of mind.',
              },
              {
                icon: '💳',
                title: 'Secure Payments',
                description: 'Book and pay securely through our platform. No cash, no hassle.',
              },
              {
                icon: '📅',
                title: 'Flexible Scheduling',
                description: 'Book sessions that fit your schedule with our easy-to-use calendar.',
              },
              {
                icon: '⭐',
                title: 'Real Reviews',
                description: 'Read authentic reviews from real clients to make informed decisions.',
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                description: 'Manage your bookings on-the-go with our mobile-optimized platform.',
              },
            ].map((feature, index) => (
              <Card key={index} hover className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Search',
                  description: 'Enter your location and find trainers in your area',
                },
                {
                  step: '2',
                  title: 'Choose',
                  description: 'Browse profiles, read reviews, and select your trainer',
                },
                {
                  step: '3',
                  title: 'Book',
                  description: 'Schedule a session and pay securely online',
                },
              ].map((step) => (
                <div key={step.step} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl font-bold mb-4 shadow-lg">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Trainers */}
      <section className="py-20 bg-gradient-to-r from-accent-500 to-accent-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Are You a Fitness Professional?
            </h2>
            <p className="text-xl text-accent-100 mb-8">
              Join thousands of trainers growing their business on FitConnect.
              Get more clients, manage bookings, and grow your revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                to={ROUTES.REGISTER}
                variant="secondary"
                size="lg"
                className="bg-white text-accent-600 hover:bg-gray-50"
              >
                Become a Trainer
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Start Your Fitness Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands who have transformed their health with FitConnect
          </p>
          <Button to={ROUTES.SEARCH_TRAINERS} size="xl">
            Find Your Trainer Today
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Home
