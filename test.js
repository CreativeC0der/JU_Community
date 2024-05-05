// Specify the timezone offset in minutes
const timeZoneOffset = 330; // For example, New York timezone offset is -240 minutes (UTC-4)

// Get the current date and time adjusted for the timezone offset
const offsetInMilliseconds = timeZoneOffset * 60 * 1000; // Convert minutes to milliseconds
const adjustedDate = new Date(Date.now() + offsetInMilliseconds).toISOString().replace("T"," ")

console.log(adjustedDate);