// Add this to browser console to check what user data is stored
console.log('Stored user in localStorage:', localStorage.getItem('user'))
console.log('Parsed:', JSON.parse(localStorage.getItem('user') || '{}'))
