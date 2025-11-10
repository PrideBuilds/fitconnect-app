import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

const SpecializationsStep = () => {
  const [specializations, setSpecializations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext()

  const selectedIds = watch('specialization_ids') || []

  useEffect(() => {
    // Fetch specializations from API
    const fetchSpecializations = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/trainers/specializations/')
        if (!response.ok) {
          throw new Error('Failed to load specializations')
        }
        const data = await response.json()
        setSpecializations(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSpecializations()
  }, [])

  const toggleSpecialization = (id) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id]
    setValue('specialization_ids', newIds, { shouldValidate: true })
  }

  if (loading) {
    return <div className="text-center py-8">Loading specializations...</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Select Your Specializations
          <span className="text-gray-500 font-normal ml-2">(Choose at least 1)</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {specializations.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => toggleSpecialization(spec.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedIds.includes(spec.id)
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{spec.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{spec.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{spec.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <input
          type="hidden"
          {...register('specialization_ids', {
            validate: (value) =>
              (value && value.length > 0) || 'Please select at least one specialization',
          })}
        />

        {errors.specialization_ids && (
          <p className="mt-2 text-sm text-red-600">{errors.specialization_ids.message}</p>
        )}

        <p className="mt-4 text-sm text-gray-600">
          Selected: {selectedIds.length} specialization{selectedIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

export default SpecializationsStep
