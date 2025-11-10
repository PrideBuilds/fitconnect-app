/**
 * Help Page
 * FAQs and support information
 */
const Help = () => {
  const faqs = [
    {
      question: "How do I book a training session?",
      answer: "Search for trainers in your area, view their profiles, and click 'Book Now' to schedule a session."
    },
    {
      question: "How do payments work?",
      answer: "All payments are processed securely through Stripe. You'll be charged when you book a session."
    },
    {
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel bookings according to the trainer's cancellation policy shown on their profile."
    },
    {
      question: "How do I become a trainer?",
      answer: "Sign up with a trainer account, complete your profile with certifications, and wait for verification."
    },
    {
      question: "Is there a booking fee?",
      answer: "We charge a small service fee on each booking to maintain the platform. This is shown before you confirm."
    }
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Help Center</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Need Help?</h2>
          <p className="text-blue-800 mb-4">
            Can't find what you're looking for? Contact our support team.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Contact Support
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Getting Started Guide
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Trainer Verification Process
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Payment and Refund Policy
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Safety Guidelines
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Help
