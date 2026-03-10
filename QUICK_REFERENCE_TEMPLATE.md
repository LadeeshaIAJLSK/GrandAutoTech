# Quick Reference: Updating Remaining Pages with Notifications

Copy and use this as a template for each remaining page.

## Template Code

### At Top of File
```jsx
import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'
import Notification from '../components/common/Notification'  // ← ADD THIS

function MyPage({ user }) {
  // ... existing state declarations ...
  const [notification, setNotification] = useState(null)  // ← ADD THIS
```

### Replacing Alert Calls

```jsx
// ❌ OLD
try {
  await api.call()
  alert('Success!')
} catch (error) {
  alert('Error: ' + error.message)
}

// ✅ NEW  
try {
  await api.call()
  setNotification({ 
    type: 'success', 
    title: 'Success', 
    message: 'Operation completed successfully!' 
  })
} catch (error) {
  setNotification({ 
    type: 'error', 
    title: 'Error', 
    message: error.response?.data?.message || 'Something went wrong' 
  })
}
```

### Before Closing Return Statement
```jsx
return (
  <div>
    {/* All your page content */}
    
    {/* ← ADD THIS LINE BEFORE CLOSING </div> */}
    <Notification notification={notification} onClose={() => setNotification(null)} />
  </div>
)
```

---

## Pages to Update (Copy Template for Each)

### 1. InvoiceManagement.jsx
**Alerts to replace:** 2
```
Line 73: alert('Invoice generated successfully!')
Line 76: alert(error.response?.data?.message...)
```

### 2. InvoiceDetail.jsx
**Alerts to replace:** 5
```
Line 50-53: Payment validation alerts (3)
Line 68: alert('Payment recorded successfully!')
Line 72: alert(err.response?.data?.message...)
```

### 3. JobCardManagement.jsx
**Alerts to replace:** 4
```
Line 101: alert('Error fetching job cards...')
Line 172: alert('Job card deleted successfully!')
Line 186: alert(`Status updated...`)
Line 190: alert(error.response?.data?.message...)
```

### 4. JobCardDetail.jsx
**Alerts to replace:** 3
```
Line 69: alert('Error loading job card...')
Line 185: alert('Please save pricing...')
Line 192-195: alert('Prices saved...') + error
```

### 5. PettyCashManagement.jsx
**Alerts to replace:** 10+
```
Line 141 & others: Multiple success/error alerts for fund creation, expenses, approvals
```

### 6. AccessRightsManagement.jsx
**Alerts to replace:** 2
```
Line 30: alert('Error loading access rights')
Line 123/126: Alert on save success/error
```

### 7. InvoicePrint.jsx
**Alerts to replace:** 1
```
Line 38: alert('Error loading invoice')
```

---

## Notification Types Reference

### Success Notification
```jsx
setNotification({
  type: 'success',
  title: 'Success',
  message: 'Operation completed!'
})
```
Result: Green popup with checkmark

### Error Notification
```jsx
setNotification({
  type: 'error',
  title: 'Error',
  message: 'Something went wrong'
})
```
Result: Red popup with X icon

### Info Notification
```jsx
setNotification({
  type: 'info',
  title: 'Information',
  message: 'Please note this message'
})
```
Result: Blue popup with info icon

---

## Common Alert Patterns to Replace

### Success Pattern
```jsx
// ❌ OLD
alert('User saved successfully!')

// ✅ NEW
setNotification({
  type: 'success',
  title: 'Success',
  message: 'User saved successfully!'
})
```

### Error Pattern
```jsx
// ❌ OLD
alert(error.response?.data?.message || 'Error')

// ✅ NEW
setNotification({
  type: 'error',
  title: 'Error',
  message: error.response?.data?.message || 'Error saving user'
})
```

### Validation Pattern
```jsx
// ❌ OLD
if (!field) { alert('Please enter field'); return }

// ✅ NEW
if (!field) { 
  setNotification({
    type: 'info',
    title: 'Required',
    message: 'Please enter a field value'
  })
  return 
}
```

### Async Pattern
```jsx
// ❌ OLD
try {
  await apiCall()
  alert('Good!')
} catch (e) {
  alert('Bad!')
}

// ✅ NEW
try {
  await apiCall()
  setNotification({
    type: 'success',
    title: 'Success',
    message: 'Operation completed'
  })
} catch (error) {
  setNotification({
    type: 'error',
    title: 'Error',
    message: error.response?.data?.message || 'Operation failed'
  })
}
```

---

## Check List Template

Copy this for each page:

```
[ ] Import Notification component
[ ] Add notification state
[ ] Replace all alert() calls
[ ] Add Notification component to JSX
[ ] Test success notifications
[ ] Test error notifications
[ ] Verify styling looks good
```

---

## Real Example (from UserManagement)

**BEFORE:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (formData.password !== formData.passwordConfirm) {
    alert('Passwords do not match')
    return
  }
  
  try {
    const response = await axiosClient.post('/users', formData)
    alert('User created successfully')
  } catch (error) {
    alert(error.response?.data?.message || 'Error saving user')
  }
}
```

**AFTER:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (formData.password !== formData.passwordConfirm) {
    setNotification({
      type: 'error',
      title: 'Validation Error',
      message: 'Passwords do not match'
    })
    return
  }
  
  try {
    const response = await axiosClient.post('/users', formData)
    setNotification({
      type: 'success',
      title: 'Success',
      message: 'User created successfully'
    })
  } catch (error) {
    setNotification({
      type: 'error',
      title: 'Error',
      message: error.response?.data?.message || 'Error saving user'
    })
  }
}
```

---

## Implementation Time Estimate

- **Per page:** 5-10 minutes
- **All remaining pages:** ~45-90 minutes
- **Testing:** 10-20 minutes

**Total:** ~2-3 hours for complete implementation

---

## Quick Start Steps

1. **Open a page** (e.g., InvoiceManagement.jsx)
2. **Add import** at the top
3. **Add state** inside component
4. **Find all alert()** calls (Ctrl+F for "alert")
5. **Replace each** with proper notification
6. **Add component** before return closes
7. **Save and test** on mobile!
8. **Repeat** for next page

---

## Pro Tips

✅ **Use Find & Replace** (Ctrl+H) to speed up replacements
✅ **Test as you go** - update 1-2 pages, test, then continue
✅ **Consistent titles** - Use "Success/Error/Info" for all alerts
✅ **Good messages** - Be specific about what happened
✅ **Mobile first** - Always test on real phone if possible

---

## Need Help?

If you get stuck:
1. Check `RESPONSIVE_IMPLEMENTATION_GUIDE.md` for more details
2. Copy the exact template from this file
3. Compare with updated `UserManagement.jsx` for reference
4. All notification imports and usage are identical across pages

---

Happy Implementing! 🚀
