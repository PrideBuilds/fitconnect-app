import PropTypes from 'prop-types'

/**
 * Card Component
 * Reusable card container with hover effects and variants
 */
const Card = ({
  children,
  variant = 'default',
  hover = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  // Base styles
  const baseStyles = `
    bg-white rounded-card transition-all duration-300
    ${onClick ? 'cursor-pointer' : ''}
  `

  // Variant styles
  const variants = {
    default: 'shadow-card',
    elevated: 'shadow-card-lg',
    outline: 'border-2 border-gray-200',
    gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 shadow-card',
  }

  // Hover styles
  const hoverStyles = hover
    ? 'hover:shadow-card-hover hover:-translate-y-1'
    : ''

  // Padding styles
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${hoverStyles}
    ${paddings[padding]}
    ${className}
  `.trim()

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outline', 'gradient']),
  hover: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  className: PropTypes.string,
  onClick: PropTypes.func,
}

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
)

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * Card Title Component
 */
export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
)

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * Card Description Component
 */
export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
)

CardDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * Card Content Component
 */
export const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * Card Footer Component
 */
export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
)

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

export default Card
