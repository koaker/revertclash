/**
 * Base Converter class that defines the interface for protocol converters
 */
class BaseConverter {
  /**
   * Convert from protocol-specific URI to a Clash proxy configuration
   * @param {string} uri - The protocol-specific URI
   * @returns {Object|null} - A Clash proxy configuration object or null if conversion fails
   */
  uriToClash(uri) {
    throw new Error('Method uriToClash must be implemented by subclasses');
  }

  /**
   * Convert from Clash proxy configuration to protocol-specific URI
   * @param {Object} clashConfig - The Clash proxy configuration object
   * @returns {string|null} - A protocol-specific URI or null if conversion fails
   */
  clashToUri(clashConfig) {
    throw new Error('Method clashToUri must be implemented by subclasses');
  }

  /**
   * Check if this converter can handle the given URI
   * @param {string} uri - The URI to check
   * @returns {boolean} - True if this converter can handle the URI, false otherwise
   */
  canHandleUri(uri) {
    throw new Error('Method canHandleUri must be implemented by subclasses');
  }

  /**
   * Check if this converter can handle the given Clash configuration
   * @param {Object} clashConfig - The Clash configuration to check
   * @returns {boolean} - True if this converter can handle the configuration, false otherwise
   */
  canHandleClash(clashConfig) {
    throw new Error('Method canHandleClash must be implemented by subclasses');
  }
}

module.exports = BaseConverter;
