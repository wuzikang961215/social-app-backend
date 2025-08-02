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
  
  // Parse the components
  const [datePart, timePart] = timeString.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  
  // Create a date in UTC first
  const utcDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // JavaScript months are 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    0
  ));
  
  // Get Sydney offset for this specific date
  // Sydney is UTC+10 (AEST) or UTC+11 (AEDT)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    hour12: false
  });
  
  // Format the UTC date as Sydney time to find the offset
  const sydneyHour = parseInt(formatter.format(utcDate));
  const utcHour = utcDate.getUTCHours();
  
  // Calculate offset (accounting for day boundary)
  let offset = sydneyHour - utcHour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;
  
  // Adjust the UTC date by subtracting the offset to get the correct UTC time
  // when the Sydney time is as specified
  const correctUTCTime = new Date(utcDate);
  correctUTCTime.setUTCHours(correctUTCTime.getUTCHours() - offset);
  
  return correctUTCTime;
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
  
  // Get the weekday in Sydney timezone
  const sydneyDate = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  const weekday = weekdays[sydneyDate.getDay()];
  
  return `${month}月${day}日 ${weekday} ${hour}:${minute}`;
}

module.exports = {
  formatToSydneyString,
  parseSydneyString,
  hasEventStarted,
  hasEventExpired,
  formatToHumanReadable
};