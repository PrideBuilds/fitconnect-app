import { useFormContext } from 'react-hook-form'

const BasicInfoStep = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div className="space-y-6">
      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Bio
          <span className="text-gray-500 font-normal ml-2">(Tell clients about yourself)</span>
        </label>
        <textarea
          id="bio"
          rows={6}
          {...register('bio', {
            required: 'Bio is required',
            minLength: {
              value: 50,
              message: 'Bio must be at least 50 characters',
            },
            maxLength: {
              value: 500,
              message: 'Bio must be less than 500 characters',
            },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your training philosophy, experience, and what makes you unique..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Minimum 50 characters, maximum 500 characters
        </p>
      </div>

      {/* Years of Experience */}
      <div>
        <label
          htmlFor="years_experience"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Years of Experience
        </label>
        <input
          type="number"
          id="years_experience"
          {...register('years_experience', {
            required: 'Years of experience is required',
            min: {
              value: 0,
              message: 'Years of experience must be at least 0',
            },
            max: {
              value: 50,
              message: 'Years of experience must be less than 50',
            },
            valueAsNumber: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="5"
        />
        {errors.years_experience && (
          <p className="mt-1 text-sm text-red-600">{errors.years_experience.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          How many years have you been a personal trainer?
        </p>
      </div>
    </div>
  )
}

export default BasicInfoStep
