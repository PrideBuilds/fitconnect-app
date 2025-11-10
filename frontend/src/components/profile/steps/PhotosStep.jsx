import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../../../contexts/AuthContext'

const PhotosStep = () => {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const { tokens } = useAuth()

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setError(null)

      // Validate file size (max 5MB per file)
      const invalidFiles = acceptedFiles.filter((file) => file.size > 5 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError('Some files are too large. Maximum size is 5MB per file.')
        return
      }

      setUploading(true)

      try {
        // Upload each file
        for (const file of acceptedFiles) {
          const formData = new FormData()
          formData.append('photo', file)
          formData.append('photo_type', 'gym') // Default to gym photos
          formData.append('caption', '')

          const response = await fetch('http://localhost:8000/api/v1/trainers/profile/photos/', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to upload photo')
          }

          const uploadedPhoto = await response.json()

          // Add preview URL
          const photoWithPreview = {
            ...uploadedPhoto,
            preview: URL.createObjectURL(file),
          }

          setPhotos((prev) => [...prev, photoWithPreview])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setUploading(false)
      }
    },
    [tokens]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 10,
    disabled: uploading,
  })

  const updatePhotoType = async (photoId, newType) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/trainers/profile/photos/${photoId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo_type: newType }),
      })

      if (!response.ok) {
        throw new Error('Failed to update photo')
      }

      // Update local state
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, photo_type: newType } : photo
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  const deletePhoto = async (photoId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/trainers/profile/photos/${photoId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      // Update local state
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Upload Photos
          <span className="text-gray-500 font-normal ml-2">
            (Add at least 1 profile photo)
          </span>
        </label>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />

          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? (
              'Drop photos here...'
            ) : uploading ? (
              'Uploading...'
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span> or drag and
                drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP up to 5MB each (max 10 photos)
          </p>
        </div>

        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Uploaded Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden"
              >
                <img
                  src={photo.preview || photo.photo}
                  alt={photo.caption || 'Trainer photo'}
                  className="w-full h-48 object-cover"
                />

                {/* Overlay with controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo.id)}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>

                {/* Photo Type Selector */}
                <div className="absolute top-2 left-2">
                  <select
                    value={photo.photo_type}
                    onChange={(e) => updatePhotoType(photo.id, e.target.value)}
                    className="text-xs px-2 py-1 bg-white bg-opacity-90 border border-gray-300 rounded"
                  >
                    <option value="profile">Profile</option>
                    <option value="gym">Training Space</option>
                    <option value="credentials">Credentials</option>
                    <option value="action">Training Session</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Requirements */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Photo Requirements</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ At least one profile photo (clear face shot)</li>
          <li>✓ Photos of your training space or gym</li>
          <li>✓ Photos of you training clients (optional)</li>
          <li>✓ Photos of certifications (optional)</li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          <strong>Tip:</strong> Profiles with multiple high-quality photos get 3x more bookings!
        </p>
      </div>

      {/* Warning if no photos */}
      {photos.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You haven't uploaded any photos yet. Add at least one profile photo to complete your
            profile.
          </p>
        </div>
      )}
    </div>
  )
}

export default PhotosStep
