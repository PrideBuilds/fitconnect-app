/**
 * About Page
 * Information about FitConnect
 */
const About = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About FitConnect</h1>

        <div className="prose prose-lg">
          <p className="text-gray-600 mb-6">
            FitConnect is your trusted peer-to-peer marketplace connecting travelers with certified
            personal trainers and gyms across the United States.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-6">
            We believe that staying fit shouldn't stop when you travel. Whether you're on a business
            trip, vacation, or relocating to a new city, FitConnect helps you find qualified trainers
            and maintain your fitness routine anywhere in the country.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Search</h3>
                <p className="text-gray-600">Find trainers near your location with our powerful search tools.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Book</h3>
                <p className="text-gray-600">Choose a trainer and book a session that fits your schedule.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Train</h3>
                <p className="text-gray-600">Meet your trainer and crush your fitness goals!</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose FitConnect?</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Verified and certified trainers</li>
            <li>Secure payments through Stripe</li>
            <li>Location-based search with real-time availability</li>
            <li>Transparent pricing with no hidden fees</li>
            <li>Easy booking and session management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default About
