import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  href,
  to,
  onClick,
  className = '',
  ...props
}) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    rounded-button transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  // Variant styles
  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600
      hover:from-primary-600 hover:to-primary-700
      text-white shadow-sm hover:shadow-md
      focus:ring-primary-500
      transform hover:scale-105
    `,
    secondary: `
      bg-gradient-to-r from-secondary-500 to-secondary-600
      hover:from-secondary-600 hover:to-secondary-700
      text-white shadow-sm hover:shadow-md
      focus:ring-secondary-500
      transform hover:scale-105
    `,
    accent: `
      bg-gradient-to-r from-accent-500 to-accent-600
      hover:from-accent-600 hover:to-accent-700
      text-white shadow-sm hover:shadow-md
      focus:ring-accent-500
      transform hover:scale-105
    `,
    outline: `
      bg-white border-2 border-primary-500 text-primary-600
      hover:bg-primary-50
      focus:ring-primary-500
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100
      focus:ring-gray-500
    `,
    danger: `
      bg-red-600 hover:bg-red-700
      text-white shadow-sm hover:shadow-md
      focus:ring-red-500
    `,
  }

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim()

  // Loading spinner
  const Spinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  // Render as Link if 'to' prop is provided (internal link)
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {loading && <Spinner />}
        {children}
      </Link>
    )
  }

  // Render as anchor if 'href' prop is provided (external link)
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {loading && <Spinner />}
        {children}
      </a>
    )
  }

  // Render as button
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  href: PropTypes.string,
  to: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default Button
