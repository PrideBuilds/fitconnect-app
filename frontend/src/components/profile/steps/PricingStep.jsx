import { useFormContext } from 'react-hook-form'

const PricingStep = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext()

  const hourlyRate = watch('hourly_rate') || 0

  return (
    <div className="space-y-6">
      {/* Hourly Rate */}
      <div>
        <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-2">
          Hourly Rate (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            id="hourly_rate"
            step="0.01"
            {...register('hourly_rate', {
              required: 'Hourly rate is required',
              min: {
                value: 10,
                message: 'Hourly rate must be at least $10',
              },
              max: {
                value: 500,
                message: 'Hourly rate must be less than $500',
              },
              valueAsNumber: true,
            })}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="75.00"
          />
        </div>
        {errors.hourly_rate && (
          <p className="mt-1 text-sm text-red-600">{errors.hourly_rate.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Set your rate per hour of training</p>
      </div>

      {/* Pricing Preview */}
      {hourlyRate > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-900 mb-3">Pricing Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">1-hour session:</span>
              <span className="font-medium">${Number(hourlyRate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">90-minute session:</span>
              <span className="font-medium">${(hourlyRate * 1.5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">2-hour session:</span>
              <span className="font-medium">${(hourlyRate * 2).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Market Rate Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Market Rates</h4>
        <p className="text-sm text-blue-800 mb-2">
          Average trainer rates by experience:
        </p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Entry level (0-2 years): $30-$50/hour</li>
          <li>• Intermediate (3-5 years): $50-$80/hour</li>
          <li>• Experienced (6-10 years): $80-$120/hour</li>
          <li>• Expert (10+ years): $120-$200+/hour</li>
        </ul>
      </div>

      {/* Fee Notice */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Platform Fee:</strong> FitConnect charges a 15% service fee on all bookings.
          This is deducted from your earnings to cover payment processing, insurance, and
          platform maintenance.
        </p>
        {hourlyRate > 0 && (
          <p className="text-sm text-yellow-800 mt-2">
            <strong>Your earnings per hour:</strong> $
            {(hourlyRate * 0.85).toFixed(2)} (after 15% fee)
          </p>
        )}
      </div>
    </div>
  )
}

export default PricingStep
