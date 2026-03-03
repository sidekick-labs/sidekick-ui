/**
 * Attempts to parse JSON and returns a user-friendly error message if it fails.
 * Extracts line number from the error when possible.
 */
export function parseJsonError(value: string): string | null {
  try {
    JSON.parse(value)
    return null
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Try to extract position from V8 error messages (Node/Chrome).
      // Other engines use different formats; the fallback below handles them.
      const positionMatch = e.message.match(/position (\d+)/)
      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10)
        const lines = value.substring(0, position).split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        return `Syntax error at line ${line}, column ${column}: ${e.message.replace(/^JSON\.parse: /, '').replace(/ at position \d+/, '')}`
      }
      return `Syntax error: ${e.message.replace(/^JSON\.parse: /, '')}`
    }
    return 'Invalid JSON'
  }
}

/**
 * Formats JSON string with proper indentation.
 */
export function formatJson(value: string): string {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // Return original if parsing fails
    return value
  }
}
