# Frequently Asked Questions (FAQ)

## General Questions

### What is OSPO Events Manager?

OSPO Events Manager is a comprehensive event management system designed for Open Source Program Offices. It helps track events, manage CFP submissions, coordinate attendees, and organize related files and documents.

### Who can use this application?

Anyone in your organization with valid credentials can access the application. Access levels depend on your assigned role (User, Reviewer, or Admin).

### Is my data secure?

Yes! The application uses industry-standard security practices including:
- Encrypted connections (HTTPS/TLS)
- Keycloak authentication with OpenID Connect
- Role-based access control
- Secure file storage
- Regular security updates

---

## Account & Login

### How do I create an account?

1. Go to the application URL
2. Click **Register** on the login page
3. Fill in your information
4. Verify your email (if required)
5. Log in with your credentials

### I forgot my password. What do I do?

1. Click **Forgot Password** on the login page
2. Enter your email address
3. Check your email for reset instructions
4. Click the link and set a new password

### Can I change my username?

No, usernames are set during registration and cannot be changed. However, you can update your display name in your profile settings.

### Why can't I log in?

Common reasons:
- Incorrect username or password
- Account not activated
- Browser cookies disabled
- Network/firewall issues
- Account locked (contact admin)

---

## Events

### How do I create an event?

See the detailed guide in [Managing Events](managing-events.md#creating-an-event).

### Can I edit someone else's event?

Only if you're an admin. Users can only edit their own events unless given specific permissions.

### What's the difference between Priority levels?

- **High**: Critical events requiring immediate attention and resources
- **Medium**: Important events with standard priority
- **Low**: Optional or exploratory events

### Can I delete an event?

Yes, if you're the creator or an admin. Note that deletion is permanent and cannot be undone.

### What happens to submissions when I delete an event?

All associated submissions, attendees, and comments are also deleted. Consider marking the event as "Cancelled" instead if you want to preserve history.

---

## CFP Submissions

### How do I submit a CFP?

1. Find the event you want to submit to
2. Click **Submit CFP**
3. Fill in the form
4. Upload supporting files (optional)
5. Click **Submit**

### Can I edit my submission after submitting?

Yes, as long as the CFP deadline hasn't passed and it hasn't been reviewed yet. Open your submission and click **Edit**.

### How do I know if my submission was accepted?

You'll receive a notification when your submission status changes. You can also check the status in the **CFP Submissions** section.

### What are the submission statuses?

- **Draft**: Not yet submitted
- **Submitted**: Awaiting review
- **Under Review**: Currently being reviewed
- **Accepted**: Your submission was accepted
- **Rejected**: Not accepted this time
- **Waitlisted**: On the waiting list

### Can I withdraw my submission?

Yes, open your submission and click **Withdraw**. You can resubmit if the deadline hasn't passed.

---

## File Uploads

### What file types can I upload?

Supported formats:
- **Documents**: PDF, DOCX, DOC, TXT, MD
- **Spreadsheets**: XLSX, XLS, CSV
- **Presentations**: PPTX, PPT
- **Images**: JPG, JPEG, PNG, GIF, WEBP
- **Archives**: ZIP

### What's the maximum file size?

50 MB per file.

### Why did my file upload fail?

Common reasons:
- File too large (>50MB)
- Unsupported file type
- Network interruption
- Storage quota exceeded
- Invalid filename characters

### Can I delete uploaded files?

Yes, if you uploaded them or if you're an admin. Click the file and select **Delete**.

### Where are my uploaded files stored?

Files are stored securely on the server with persistent storage. They're associated with your user account and the related event or submission.

---

## User Profile

### How do I update my profile?

1. Click your name in the header
2. Select **Profile**
3. Click **Edit Profile**
4. Update your information
5. Click **Save**

### Can I add a profile picture?

Yes! In your profile settings, click **Upload Photo** and select an image (JPG, PNG, or GIF, max 5MB).

### What information is visible to other users?

By default, other users can see:
- Your name
- Your email (if you choose to share it)
- Your job title
- Your profile picture
- Events you've created
- CFP submissions (if accepted)

You can adjust visibility in your privacy settings.

---

## Permissions & Roles

### What can different roles do?

**User**:
- Create and manage own events
- Submit CFPs
- Upload files
- View public events

**Reviewer**:
- All user permissions
- Review CFP submissions
- Provide feedback
- Access review dashboard

**Admin**:
- All reviewer permissions
- Manage all users
- Approve/reject events
- Configure settings
- Access all data

### How do I get reviewer or admin access?

Contact your system administrator. They can upgrade your role based on your responsibilities.

### Can I have multiple roles?

No, each user has one primary role. However, admins have all permissions.

---

## Notifications

### How do I enable/disable notifications?

1. Go to your **Profile**
2. Click **Notification Settings**
3. Toggle notifications on/off for different events
4. Click **Save**

### What types of notifications are there?

- Email notifications
- In-app notifications (bell icon)
- Browser push notifications (optional)

### Why am I not receiving notifications?

Check:
- Notification settings in your profile
- Email spam/junk folder
- Browser notification permissions
- Account email is correct

---

## Technical Issues

### The page won't load. What should I do?

1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Try a different browser
4. Check your internet connection
5. Contact your admin if issue persists

### Why is the application slow?

Common causes:
- Slow internet connection
- Large file uploads/downloads
- Server maintenance
- Browser with many tabs open
- Outdated browser

Try closing other tabs, clearing cache, or using a different browser.

### I'm seeing an error message. What do I do?

1. Note the exact error message
2. Try refreshing the page
3. Check if you're still logged in
4. Try the action again
5. Contact support with the error details

### Is there a mobile app?

Currently, there's no dedicated mobile app, but the web application is mobile-responsive and works on phones and tablets.

---

## Data & Privacy

### Is my data backed up?

Yes, the system automatically backs up data regularly. Contact your admin for specific backup schedules.

### Can I export my data?

Yes! You can export:
- Events to CSV/Excel
- CFP submissions
- Asset lists
- Your profile data

### How long is data kept?

Data retention policies vary by organization. Contact your admin for specific details.

### Can I delete my account?

Contact your system administrator to request account deletion. Note that some data may be retained for audit purposes.

---

## Import/Export

### How do I import events from CSV?

See the [Managing Events](managing-events.md#bulk-operations) guide for detailed instructions.

### What's the CSV format for importing?

Download the CSV template from the Import page. It includes all required columns and sample data.

### Can I export filtered results?

Yes! Apply your filters first, then click **Export**. Only the filtered results will be exported.

---

## Getting Help

### Where can I find more help?

- Check these documentation pages
- Review the [Troubleshooting Guide](../general/troubleshooting.md)
- Contact your system administrator
- Check for system announcements in the app

### How do I report a bug?

Contact your system administrator with:
- Description of the issue
- Steps to reproduce
- Screenshots (if applicable)
- Browser and OS information
- Error messages

### Can I request new features?

Yes! Contact your admin or project team with feature suggestions. Include:
- What you want to accomplish
- Why it would be useful
- How you envision it working

---

## Best Practices

### Tips for managing events effectively

1. Create events early in the planning process
2. Keep event information up to date
3. Set realistic deadlines
4. Use clear, descriptive names
5. Upload relevant documents promptly
6. Update status as events progress
7. Add detailed notes for context
8. Track attendees consistently

### Tips for CFP submissions

1. Submit early, don't wait for the deadline
2. Write clear, compelling titles
3. Include detailed abstracts
4. Attach relevant supporting materials
5. Proofread before submitting
6. Follow any specific event guidelines
7. Check submission status regularly

---

**Still have questions?** Contact your system administrator or check the [Troubleshooting Guide](../general/troubleshooting.md).

