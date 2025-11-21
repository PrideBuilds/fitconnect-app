import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui'
import { useAuth } from '../contexts/AuthContext'
import PropTypes from 'prop-types'

/**
 * Message Button Component
 * Creates a chat channel and navigates to chat page
 */
const MessageButton = ({ trainerId, trainerName, variant = 'outline', size = 'md', className = '' }) => {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMessageClick = async () => {
    if (!user || !tokens?.access) {
      alert('Please log in to send messages')
      navigate('/login')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create chat channel between current user and trainer
      const response = await fetch('http://localhost:8000/api/v1/users/create-chat-channel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({
          user_id: trainerId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create chat channel')
      }

      // Navigate to chat page
      navigate('/chat')

    } catch (err) {
      console.error('Message button error:', err)
      setError(err.message || 'Failed to start conversation')
      alert(error || 'Failed to start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleMessageClick}
      disabled={loading}
      loading={loading}
    >
      {loading ? (
        'Starting chat...'
      ) : (
        <>
          <svg
            className="w-5 h-5 mr-2 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Message {trainerName ? trainerName.split(' ')[0] : 'Trainer'}
        </>
      )}
    </Button>
  )
}

MessageButton.propTypes = {
  trainerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trainerName: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
}

export default MessageButton
