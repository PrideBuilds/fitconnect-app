import PropTypes from 'prop-types'
import { forwardRef } from 'react'

/**
 * Input Component
 * Styled input field with label and error states
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      fullWidth = false,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputStyles = `
    w-full px-4 py-2.5 text-gray-900 bg-white border rounded-button
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}
    ${icon ? 'pl-10' : ''}
    ${className}
  `.trim()

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">{icon}</span>
            </div>
          )}

          <input ref={ref} type={type} className={inputStyles} {...props} />
        </div>

        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  type: PropTypes.string,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
}

export default Input
