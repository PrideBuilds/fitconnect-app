"""
Utility functions for trainer profile management
"""
import googlemaps
from django.conf import settings
from django.contrib.gis.geos import Point
import logging

logger = logging.getLogger(__name__)

# Fallback city coordinates when Google Maps API is not available
CITY_COORDINATES = {
    'san francisco': {'lat': 37.7749, 'lng': -122.4194, 'state': 'CA'},
    'san francisco, ca': {'lat': 37.7749, 'lng': -122.4194, 'state': 'CA'},
    'los angeles': {'lat': 34.0522, 'lng': -118.2437, 'state': 'CA'},
    'los angeles, ca': {'lat': 34.0522, 'lng': -118.2437, 'state': 'CA'},
    'new york': {'lat': 40.7128, 'lng': -74.0060, 'state': 'NY'},
    'new york, ny': {'lat': 40.7128, 'lng': -74.0060, 'state': 'NY'},
    'chicago': {'lat': 41.8781, 'lng': -87.6298, 'state': 'IL'},
    'chicago, il': {'lat': 41.8781, 'lng': -87.6298, 'state': 'IL'},
    'miami': {'lat': 25.7617, 'lng': -80.1918, 'state': 'FL'},
    'miami, fl': {'lat': 25.7617, 'lng': -80.1918, 'state': 'FL'},
    'austin': {'lat': 30.2672, 'lng': -97.7431, 'state': 'TX'},
    'austin, tx': {'lat': 30.2672, 'lng': -97.7431, 'state': 'TX'},
    'seattle': {'lat': 47.6062, 'lng': -122.3321, 'state': 'WA'},
    'seattle, wa': {'lat': 47.6062, 'lng': -122.3321, 'state': 'WA'},
    'denver': {'lat': 39.7392, 'lng': -104.9903, 'state': 'CO'},
    'denver, co': {'lat': 39.7392, 'lng': -104.9903, 'state': 'CO'},
    'boston': {'lat': 42.3601, 'lng': -71.0589, 'state': 'MA'},
    'boston, ma': {'lat': 42.3601, 'lng': -71.0589, 'state': 'MA'},
    'atlanta': {'lat': 33.7490, 'lng': -84.3880, 'state': 'GA'},
    'atlanta, ga': {'lat': 33.7490, 'lng': -84.3880, 'state': 'GA'},
    'dallas': {'lat': 32.7767, 'lng': -96.7970, 'state': 'TX'},
    'dallas, tx': {'lat': 32.7767, 'lng': -96.7970, 'state': 'TX'},
    'houston': {'lat': 29.7604, 'lng': -95.3698, 'state': 'TX'},
    'houston, tx': {'lat': 29.7604, 'lng': -95.3698, 'state': 'TX'},
    'phoenix': {'lat': 33.4484, 'lng': -112.0740, 'state': 'AZ'},
    'phoenix, az': {'lat': 33.4484, 'lng': -112.0740, 'state': 'AZ'},
    'portland': {'lat': 45.5152, 'lng': -122.6784, 'state': 'OR'},
    'portland, or': {'lat': 45.5152, 'lng': -122.6784, 'state': 'OR'},
}


def geocode_address(address):
    """
    Geocode an address to lat/lng coordinates using Google Geocoding API
    Falls back to predefined city coordinates if API key is not configured

    Args:
        address (str): Full address string to geocode

    Returns:
        Point: PostGIS Point object with (longitude, latitude), or None if geocoding fails

    Example:
        >>> point = geocode_address("123 Main St, San Francisco, CA 94102")
        >>> if point:
        >>>     print(f"Lat: {point.y}, Lng: {point.x}")
    """
    api_key = settings.GOOGLE_MAPS_API_KEY

    # Try fallback city lookup first if API key is not configured
    if not api_key:
        logger.info("GOOGLE_MAPS_API_KEY not configured. Using fallback city coordinates.")

        # Try to match city name from address
        address_lower = address.lower().strip()

        # Try exact match first
        if address_lower in CITY_COORDINATES:
            coords = CITY_COORDINATES[address_lower]
            point = Point(coords['lng'], coords['lat'], srid=4326)
            logger.info(f"Found fallback coordinates for '{address}': {coords['lat']}, {coords['lng']}")
            return point

        # Try partial match (check if any city name is in the address)
        for city_key, coords in CITY_COORDINATES.items():
            if city_key in address_lower:
                point = Point(coords['lng'], coords['lat'], srid=4326)
                logger.info(f"Found fallback coordinates for '{address}' (matched '{city_key}'): {coords['lat']}, {coords['lng']}")
                return point

        logger.warning(f"No fallback coordinates found for address: {address}")
        logger.info(f"Supported cities: {', '.join(sorted(set([k.title() for k in CITY_COORDINATES.keys() if ',' not in k])))}")
        return None

    if not address or len(address.strip()) < 3:
        logger.warning(f"Invalid address provided: {address}")
        return None

    try:
        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=api_key)

        # Geocode the address
        geocode_result = gmaps.geocode(address)

        if not geocode_result:
            logger.warning(f"No geocoding results found for address: {address}")
            return None

        # Extract lat/lng from first result
        location = geocode_result[0]['geometry']['location']
        lat = location['lat']
        lng = location['lng']

        # Create PostGIS Point (longitude, latitude) - note the order!
        # PostGIS uses (x, y) = (longitude, latitude)
        point = Point(lng, lat, srid=4326)  # WGS84 coordinate system

        logger.info(f"Successfully geocoded address to: {lat}, {lng}")
        return point

    except googlemaps.exceptions.ApiError as e:
        logger.error(f"Google Maps API error: {str(e)}")
        return None
    except googlemaps.exceptions.HTTPError as e:
        logger.error(f"HTTP error during geocoding: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during geocoding: {str(e)}")
        return None


def get_address_components(address):
    """
    Extract structured address components from a full address string

    Args:
        address (str): Full address string

    Returns:
        dict: Address components (street, city, state, zip_code, country), or None

    Example:
        >>> components = get_address_components("123 Main St, San Francisco, CA 94102, USA")
        >>> print(components['city'])  # "San Francisco"
    """
    api_key = settings.GOOGLE_MAPS_API_KEY

    if not api_key:
        return None

    try:
        gmaps = googlemaps.Client(key=api_key)
        geocode_result = gmaps.geocode(address)

        if not geocode_result:
            return None

        # Extract address components
        components = {}
        for component in geocode_result[0]['address_components']:
            types = component['types']

            if 'street_number' in types:
                components['street_number'] = component['long_name']
            elif 'route' in types:
                components['street_name'] = component['long_name']
            elif 'locality' in types:
                components['city'] = component['long_name']
            elif 'administrative_area_level_1' in types:
                components['state'] = component['short_name']
            elif 'postal_code' in types:
                components['zip_code'] = component['long_name']
            elif 'country' in types:
                components['country'] = component['short_name']

        return components

    except Exception as e:
        logger.error(f"Error extracting address components: {str(e)}")
        return None
