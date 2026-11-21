# Google Apps Script Setup Guide
## Vertiv Xpress Registration → Google Sheets

This guide walks you through connecting the registration form at `register.html` to your Google Sheet so that every new registration is automatically saved.

---

## Step 1 — Open your Google Sheet


Your sheet:
👉 https://docs.google.com/spreadsheets/d/1kuJRqCNTqMKLtXny4KxusXzR7jSsliYJu6F7gx9u8Oc/edit?gid=0#gid=0

Make sure the **first row** (Row 1) has these exact column headers (A1 to L1):

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | First Name | Last Name | Work Mail Address | Phone Number | Job Title | I am a | Company | Country | Industry | City | Comments |

---

## Step 2 — Create the Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Paste the following script:

```javascript
const SHEET_NAME = 'Sheet1'; // Change if your sheet tab has a different name

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    
    // Parse the form JSON payload
    const data = JSON.parse(e.postData.contents);
    
    // Format timestamp in IST
    const timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    
    // Append row matching column order (A to L)
    sheet.appendRow([
      timestamp,
      data.first_name || '',
      data.last_name  || '',
      data.email      || '',
      data.phone      || '',
      data.job_title  || '',
      data.i_am_a     || '',
      data.company    || '',
      data.country    || '',
      data.industry   || '',
      data.city       || '',
      data.comments   || ''
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

// Optional: test manually in the editor
function testPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '+91 90000 00000',
        job_title: 'Engineer',
        i_am_a: 'End Customer',
        company: 'Test Corp',
        country: 'India',
        industry: 'Data Center / Colocation',
        city: 'Bengaluru',
        comments: 'Looking forward to the event',
        event: 'Vertiv Xpress: AI Solution Roadmap',
        event_date: '24th November 2026',
        event_venue: 'The Lalit Ashok, Bengaluru'
      })
    }
  };
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
```

4. Click **Save** (Ctrl+S / Cmd+S) and name the project `VertivXpressRegistration`

---

## Step 3 — Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Select type" → choose **Web app**
3. Fill in:
   - **Description**: Vertiv Xpress Registration Handler
   - **Execute as**: Me *(your Google account)*
   - **Who has access**: **Anyone** *(this allows the form to submit without login)*
4. Click **Deploy**
5. Click **Authorize access** and grant permissions
6. Copy the **Web app URL** that appears — it looks like:  
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 4 — Add the URL to register.html

Open `register.html` in your editor and find this line near the bottom:

```javascript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```

Replace `'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'` with the URL you copied, like:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbXXXXXXXX/exec';
```

Save the file and redeploy your website.

---

## Step 5 — Test it

1. Open `register.html` in your browser
2. Fill in the form with test data and submit
3. Go to your Google Sheet — a new row should appear within a few seconds ✅

---

## Notes

- **`mode: 'no-cors'`** is used in the fetch call. This means the browser won't see the response body (a CORS limitation with Apps Script), but the data **will** be saved to the sheet — the form treats any network success as a successful submission.
- If you need to re-deploy after script changes, go to **Deploy → Manage deployments → Edit** and create a new version.
- The honeypot field (`_honey`) silently blocks bot submissions.
