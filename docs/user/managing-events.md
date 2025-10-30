# Managing Events

This guide covers everything you need to know about creating, editing, and managing events in OSPO Events Manager.

## Event Lifecycle

Events in the system go through several stages:

1. **Planning** - Initial planning phase
2. **Confirmed** - Event is confirmed and scheduled
3. **Active** - Event is currently happening
4. **Completed** - Event has finished
5. **Cancelled** - Event was cancelled

## Creating an Event

### Basic Information

When creating an event, you'll need to provide:

**Required Fields:**
- **Event Name**: Clear, descriptive title
- **Start Date**: Event start date
- **End Date**: Event end date (must be same day or after start date)
- **Location**: Physical address or "Virtual" for online events
- **Priority**: High, Medium, or Low
- **Type**: Select from available types
- **Goals**: What you want to achieve (select multiple)

**Optional Fields:**
- **CFP Deadline**: If accepting talk submissions
- **CFP Link**: URL to submission form
- **Event Link**: URL to event website
- **Notes**: Additional details, agenda, or special instructions
- **Status**: Defaults to "Planning"

### Event Types

Choose from the following event types:

- **Conference**: Large multi-day events
- **Meetup**: Local community gatherings
- **Workshop**: Hands-on training sessions
- **Webinar**: Online presentations
- **Summit**: High-level strategic meetings
- **Hackathon**: Coding competitions
- **Trade Show**: Exhibition events
- **Other**: Custom event types

### Event Goals

Select one or more goals for your event:

- **Community Building**: Grow and engage community
- **Lead Generation**: Attract potential customers
- **Brand Awareness**: Increase visibility
- **Product Launch**: Announce new products
- **Education**: Share knowledge
- **Networking**: Connect professionals
- **Recruitment**: Attract talent
- **Partnership**: Build relationships

### Priority Levels

Set the priority to help with planning and resource allocation:

- **High**: Critical events requiring immediate attention
- **Medium**: Important events with moderate priority
- **Low**: Nice-to-have or exploratory events

## Editing an Event

1. Navigate to the event you want to edit
2. Click the **Edit** button
3. Update the fields you want to change
4. Click **Save Changes**

### Edit Permissions

- **Event Creator**: Can edit their own events
- **Admins**: Can edit any event
- **Reviewers**: Read-only access unless they're the creator

### Edit History

All changes to events are tracked. View the edit history by:
1. Opening the event details
2. Clicking **View History**
3. See who made changes and when

## Deleting an Event

⚠️ **Warning**: Deleting an event is permanent and cannot be undone.

To delete an event:
1. Open the event details
2. Click the **Delete** button
3. Confirm the deletion

**Note**: Only event creators and admins can delete events.

## Event Details View

The event details page shows:

### Overview Section
- Event name and status badge
- Dates and location
- Priority indicator
- Quick actions (Edit, Delete, Share)

### Information Tab
- Full event description
- Goals and objectives
- Links to CFP and event website
- Creator information

### CFP Submissions Tab
- List of all submissions for this event
- Submission status indicators
- Quick review actions

### Attendees Tab
- List of registered/confirmed attendees
- Contact information
- Add new attendees

### Assets Tab
- Files associated with the event
- Upload new assets
- Download existing files

### Activity Tab
- Recent activity on this event
- Edit history
- Comments and notes

## Adding Attendees

1. Open the event details
2. Go to the **Attendees** tab
3. Click **+ Add Attendee**
4. Fill in attendee information:
   - Name (required)
   - Email (required)
   - Role (e.g., Speaker, Organizer, Attendee)
   - Notes (optional)
5. Click **Add**

### Attendee Roles

Common attendee roles:
- **Speaker**: Presenting at the event
- **Organizer**: Organizing the event
- **Sponsor**: Sponsoring the event
- **Attendee**: General participant
- **Staff**: Event staff member
- **VIP**: Special guest

## Bulk Operations

### Importing Events

You can import multiple events from a CSV file:

1. Navigate to **Events**
2. Click **Import CSV**
3. Download the template if needed
4. Upload your CSV file
5. Review and confirm the import

**CSV Format:**
```csv
name,start_date,end_date,location,priority,type,goal,status,notes,cfp_deadline,cfp_link,link
"My Event","2025-06-01","2025-06-03","San Francisco, CA","High","Conference","Community Building","Planning","Great event","2025-04-15","https://cfp.example.com","https://event.example.com"
```

### Exporting Events

Export events to CSV for reporting or backup:

1. Navigate to **Events**
2. Apply any filters you want
3. Click **Export**
4. Choose format (CSV or Excel)
5. Download the file

## Event Notifications

You'll receive notifications for:

- **Event Updates**: When someone updates an event you created or are attending
- **CFP Deadlines**: Reminders before CFP deadlines
- **New Submissions**: When someone submits to your event
- **Status Changes**: When event status changes
- **Comments**: When someone comments on your event

Configure notification preferences in your **Profile** settings.

## Collaboration

### Sharing Events

Share event details with team members:

1. Open the event
2. Click the **Share** button
3. Copy the event link
4. Send to colleagues

### Event Comments

Add comments to discuss events:

1. Open the event details
2. Scroll to the **Comments** section
3. Type your comment
4. Click **Post**

Comments are visible to all users who can view the event.

## Best Practices

### Event Naming
- Use clear, descriptive names
- Include year for recurring events (e.g., "KubeCon 2025")
- Avoid abbreviations unless widely known

### Event Planning
- Create events as early as possible
- Set realistic deadlines
- Keep information up to date
- Add CFP links promptly
- Track attendees consistently

### Documentation
- Upload relevant files to the Assets section
- Keep notes detailed and current
- Document important decisions
- Save post-event reports

### Status Updates
- Update status as the event progresses
- Move to "Completed" promptly after the event
- Cancel events as soon as known

## Troubleshooting

### Can't Edit an Event
- Verify you're the event creator or an admin
- Check that you're logged in
- Event might be locked by an admin

### Can't Delete an Event
- Only creators and admins can delete
- Event might have dependencies (submissions, attendees)
- Contact an admin if you need help

### Missing Fields
- Some fields may be hidden based on event type
- Refresh the page if fields don't appear
- Check browser console for errors

## Next Steps

- [Learn about CFP Submissions](cfp-submissions.md)
- [Managing File Uploads](file-uploads.md)
- [Understanding Approval Workflows](approval-workflows.md)

---

**Need help?** Check the [FAQ](faq.md) or contact your system administrator.

