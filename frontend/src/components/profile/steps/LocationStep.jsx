import { useFormContext } from 'react-hook-form'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import { useState, useRef } from 'react'

const libraries = ['places']
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const LocationStep = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext()

  const serviceRadius = watch('service_radius_miles') || 10
  const [autocomplete, setAutocomplete] = useState(null)
  const addressInputRef = useRef(null)

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance)
  }

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()

      if (place.formatted_address) {
        setValue('address', place.formatted_address, {
          shouldValidate: true,
          shouldDirty: true
        })
      }
    }
  }

  // Unregister the default 'address' field since we'll handle it manually
  const { ref: _ref, ...addressRegister } = register('address', {
    required: 'Address is required',
    minLength: {
      value: 10,
      message: 'Please enter a complete address',
    },
  })

  return (
    <div className="space-y-6">
      {/* Address with Autocomplete */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Address
          <span className="text-gray-500 font-normal ml-2">
            (Where you train clients)
          </span>
        </label>

        {isLoaded && GOOGLE_MAPS_API_KEY ? (
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              types: ['address'],
              componentRestrictions: { country: 'us' },
            }}
          >
            <input
              type="text"
              id="address"
              ref={addressInputRef}
              {...addressRegister}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Start typing your address..."
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            id="address"
            {...register('address', {
              required: 'Address is required',
              minLength: {
                value: 10,
                message: 'Please enter a complete address',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="123 Main St, San Francisco, CA 94102"
          />
        )}

        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}

        {isLoaded && GOOGLE_MAPS_API_KEY ? (
          <p className="mt-1 text-xs text-gray-500">
            Start typing and select your address from the suggestions
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            Your full training location address (street, city, state, zip)
          </p>
        )}

        {loadError && (
          <p className="mt-1 text-xs text-red-600">
            Error loading address autocomplete. You can still enter your address manually.
          </p>
        )}
      </div>

      {/* Service Radius */}
      <div>
        <label
          htmlFor="service_radius_miles"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Service Radius: {serviceRadius} miles
        </label>
        <input
          type="range"
          id="service_radius_miles"
          min="1"
          max="50"
          step="1"
          {...register('service_radius_miles', {
            valueAsNumber: true,
          })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 mile</span>
          <span>50 miles</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          How far are you willing to travel to train clients?
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Location Privacy:</strong> Your exact address will not be shown to clients.
          We'll use it to calculate distance and show you in search results within your service
          area.
        </p>
      </div>
    </div>
  )
}

export default LocationStep
