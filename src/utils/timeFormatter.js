/**
 * Shared Time Formatter Utility
 * Formats real-world duration in seconds into human-readable strings based on rules:
 * - Less than 60 seconds: "45s"
 * - 60 seconds to 59m 59s: "1m 25s", "12m 08s"
 * - 60 minutes or more: "1h 05m" (excluding seconds)
 */
export const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null || seconds < 0) return '0s';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  
  if (hrs > 0) {
    const padMins = String(mins).padStart(2, '0');
    return `${hrs}h ${padMins}m`;
  }
  
  if (mins > 0) {
    const padSecs = String(secs).padStart(2, '0');
    return `${mins}m ${padSecs}s`;
  }
  
  return `${secs}s`;
};

/**
 * Formats game dates for display
 * Format: "13 July 19:24"
 */
export const formatGameTime = (dateObj) => {
  if (!dateObj) return '';
  const date = new Date(dateObj);
  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const hr = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hr}:${min}`;
};
