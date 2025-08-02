/**
 * Date utilities for consistent Sydney timezone handling
 */

/**
 * Format a date to Sydney local time string (YYYY-MM-DDTHH:mm)
 * This format is timezone-agnostic and represents the exact time shown to Sydney users
 */
function formatToSydneyString(date) {
  if (!date) return null;
  
  // If it's already a string in the correct format, return it
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) {
    return date;
  }
  
  // Convert to Date object if needed
  const dateObj = new Date(date);
  
  // Get Sydney time using Intl.DateTimeFormat
  const sydneyTime = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(dateObj);
  
  // Build the string in YYYY-MM-DDTHH:mm format
  const dateParts = {};
  sydneyTime.forEach(part => {
    dateParts[part.type] = part.value;
  });
  
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}`;
}

/**
 * Parse a Sydney time string to a Date object
 * Treats the input as Sydney local time
 */
function parseSydneyString(timeString) {
  if (!timeString) return null;
  
  // Add seconds if not present
  const normalizedString = timeString.includes(':00:00') 
    ? timeString 
    : timeString.includes('T') && timeString.split('T')[1].split(':').length === 2
      ? timeString + ':00'
      : timeString;
  
  // Parse as Sydney time
  const [datePart, timePart] = normalizedString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);
  
  // Create date in Sydney timezone
  const sydneyDate = new Date(
    new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}.000+10:00`)
  );
  
  return sydneyDate;
}

/**
 * Check if an event has started (based on Sydney time)
 */
function hasEventStarted(startTime) {
  const now = new Date();
  const eventStart = parseSydneyString(startTime);
  return now >= eventStart;
}

/**
 * Check if an event has expired (based on Sydney time)
 */
function hasEventExpired(startTime, durationMinutes) {
  const now = new Date();
  const eventStart = parseSydneyString(startTime);
  const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60000);
  return now >= eventEnd;
}

/**
 * Format a Sydney time string to human-readable format
 * e.g., "2025-08-15T10:30" -> "8月15日 周五 10:30"
 */
function formatToHumanReadable(timeString) {
  if (!timeString) return null;
  
  const date = parseSydneyString(timeString);
  if (!date) return timeString;
  
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  // Format in Sydney timezone
  const sydneyFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Australia/Sydney',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = sydneyFormatter.formatToParts(date);
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  
  const weekday = weekdays[date.getDay()];
  
  return `${month}月${day}日 ${weekday} ${hour}:${minute}`;
}

module.exports = {
  formatToSydneyString,
  parseSydneyString,
  hasEventStarted,
  hasEventExpired,
  formatToHumanReadable
};