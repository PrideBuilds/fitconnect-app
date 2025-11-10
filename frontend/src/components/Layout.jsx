import PropTypes from 'prop-types'
import Header from './Header'
import Footer from './Footer'

/**
 * Layout component
 * Wraps all pages with consistent header and footer
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 */
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <Footer />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
