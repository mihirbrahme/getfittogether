# Get Fit Together - Admin User Guide

## Admin Control Center 🎛️

This comprehensive guide covers all administrative functions for managing the Get Fit Together fitness challenge platform.

---

## 🚀 Getting Started

### Admin Login

1. **Access Platform**
   - Navigate to the platform URL
   - Click **"Login"**

2. **Enter Admin Credentials**
   - Email (must have admin role)
   - Password

3. **Automatic Redirect**
   - System detects admin role
   - Redirects to Admin Dashboard

---

## 🏠 Admin Dashboard Overview

### Navigation Tabs

Your admin panel has 8 main tabs:

1. **GROUPS** - Manage squads and members
2. **WODS** - Create and assign workouts
3. **LIBRARY** - Workout template library
4. **BULK SCHEDULER** - Schedule multiple WODs at once
5. **CALENDAR** - Visual WOD calendar view
6. **ANALYTICS** - Performance metrics and insights
7. **GOALS** - Manage goal templates
8. **CHECK-INS** - Configure squad activities

---

## 👥 GROUPS Tab - Squad Management

### Managing Squads

#### View Squads
- See all squads in list format
- Each card shows:
  - Squad name
  - Color code
  - Member count
  - Created date

#### Create New Squad

1. Click **"Add Squad"** button
2. Fill in details:
   - **Name**: Squad name (e.g., "Alpha Squad")
   - **Color**: Choose identifying color
3. Click **"Add"**

#### Edit Squad

1. Click pencil icon on squad card
2. Update name or color
3. Click checkmark to save

#### Delete Squad

1. Click trash icon on squad card
2. Confirm deletion
3. **Warning**: All members will be unassigned

### Managing Members

#### Approval Queue

**View Pending Users**:
- Click **"Approval Queue"** button
- See all pending registrations:
  - Name
  - Email
  - Registration date
  - Requested squad

**Approve User**:
1. Click **"Approve"** on user row
2. User gains access immediately
3. User can now login

**Reject User**:
1. Click **"Reject"** on user row
2. User remains pending
3. Contact user directly if needed

#### Assign Users to Squad

1. Find user in list
2. Click **"Assign"** dropdown
3. Select target squad
4. Click **"Assign Squad"**
5. User now part of selected squad

---

## 💪 WODS Tab - Workout Management

### Creating a WOD

#### From Scratch

1. Click **"Create New WOD"**
2. Fill in details:
   - **Title**: WOD name (e.g., "Day 1 - Full Body Blast")
   - **Type**: weekday/weekend/event
   - **Description**: Brief overview
   - **YouTube URL**: (optional) Link to video

3. **Assign to Squads**:
   - Check boxes for target squads
   - Can assign to multiple squads
   - "Select All" / "Deselect All" options

4. **Schedule**:
   - Pick date
   - Time defaults to day start

5. Click **"Schedule"**

#### From Library Template

1. Click dropdown **"Load from Library"**
2. Select template
3. Auto-fills title, type, description, video URL
4. Assign squads and date
5. Click **"Schedule"**

### Managing Exercises

#### Add Exercise to WOD

After creating WOD:

1. Scroll to **"Exercises"** section
2. Click **"Add Exercise"**
3. Fill exercise details:
   - **Name**: Exercise name
   - **Sets**: Number of sets
   - **Reps**: Reps per set
   - **Duration**: For time-based (seconds)
   - **Rest**: Rest between sets (seconds)
   - **Equipment**: Required equipment
   - **Notes**: Form tips, modifications

4. Click checkmark to save

#### Reorder Exercises

- Use up/down arrows
- Drag to reposition
- Click **"Update Order"**

#### Edit Exercise

1. Click pencil icon
2. Modify details
3. Click checkmark

#### Delete Exercise

- Click trash icon
- Confirm deletion

### Editing Scheduled WODs

1. Find WOD in list
2. Click **"Edit"** button
3. Modify any field
4. Update exercises as needed
5. Click **"Update"**

### Deleting WODs

1. Find WOD in list
2. Click **"Delete"** button
3. Confirm deletion
4. **Warning**: Removes from participant view

---

## 📚 LIBRARY Tab - Workout Templates

### Purpose

Create reusable workout templates to speed up WOD scheduling.

### Creating Template

1. Click **"Add Template"**
2. Fill details:
   - **Name**: Template name
   - **Type**: weekday/weekend/event
   - **Description**: Brief overview
   - **YouTube URL**: (optional) Video link
   - **Sample Exercises**: (optional) Exercise list

3. Click **"Add"**

### Using Templates

- Templates appear in WOD creation dropdown
- Select to auto-fill WOD form
- Edit as needed before scheduling

### Managing Templates

**Edit**: Click pencil icon
**Delete**: Click trash icon

---

## 📅 BULK SCHEDULER Tab - Batch Scheduling

### Purpose

Schedule multiple WODs across date range efficiently.

### Using Bulk Scheduler

1. **Select Date Range**:
   - Start date
   - End date
   - System calculates number of days

2. **Select Workouts**:
   - Check templates from library
   - Must select enough for date range
   - Or select more for rotation

3. **Choose Strategy**:
   - **Sequential**: Apply in order selected
   - **Random**: Randomize assignment
   - **Round Robin**: Rotate through set

4. **Select Squads**:
   - Choose which squads to schedule for
   - Can select multiple or all

5. **Preview Schedule**:
   - Review proposed schedule
   - Check for conflicts (existing WODs)
   - Conflicts highlighted in red

6. **Submit**:
   - Click **"Schedule All"**
   - Bulk creation completes
   - Confirmation shown

### Best Practices

- Create library templates first
- Preview before submitting
- Check for conflicts
- Consider squad-specific needs

---

## 🗓️ CALENDAR Tab - Visual Overview

### Calendar View

**Monthly View**:
- See all scheduled WODs
- Color-coded by type:
  - Weekday: Blue
  - Weekend: Green
  - Event: Orange

**Features**:
- Click WOD to view details
- Navigate months with arrows
- See multiple squad assignments

### Quick Actions

- Click date to create WOD for that day
- Drag/drop to reschedule (if enabled)
- Filter by squad

---

## 📊 ANALYTICS Tab - Performance Insights

### Dashboard Metrics

**Key Metrics** (top cards):
- Total WODs
- Avg. Completion Rate
- Most Active Squad
- Engagement Trend

**Completion by WOD Type**:
- Bar chart showing completion rates
- Compare weekday vs. weekend vs. event

**Squad Leaderboard**:
- Average completion per squad
- Total participants per squad
- Performance comparison

**Engagement Trends**:
- Line chart over time
- Track participation patterns
- Identify dips/peaks

### Using Analytics

- **Monitor engagement**: Track daily check-ins
- **Identify issues**: Low completion? Adjust difficulty
- **Squad comparison**: Recognize top performers
- **Plan improvements**: Data-driven decisions

### Auto-Refresh

- Dashboard refreshes every 60 seconds
- Always see latest data

---

## 🎯 GOALS Tab - Goal Template Management

### Purpose

Create reusable goal templates to assign to participants.

### Creating Goal Template

1. Click **"Add Template"**
2. Fill details:
   - **Name**: Goal name (e.g., "No Sugar")
   - **Description**: Details/guidelines
   - **Category**: Type of goal
   - **Points**: Point value (e.g., 5)
   - **Duration**: daily/weekly/monthly

3. Click **"Add"**

### Managing Templates

**View**: See all available templates
**Edit**: Update name, description, points
**Delete**: Remove unused templates

### Assigning Goals to Users

1. Go to **GROUPS** tab
2. Find participant
3. Click **"Assign Goals"**
4. Select goal template(s)
5. Choose slot (Goal 1, Goal 2)
6. Click **"Assign"**

**Notes**:
- Each user can have 2 goals
- Goals appear in their check-in
- Points awarded on completion

---

## ✅ CHECK-INS Tab - Squad Activity Configuration

### Purpose

Configure daily check-in activities for each squad.

### Configuring Activities

1. **Select Squad**:
   - Choose squad from dropdown

2. **Add Activity**:
   - Click **"Add Activity"**
   - Fill details:
     - **Name**: Activity name
     - **Type**: core/bonus/challenge
     - **Points**: Point value
     - **Icon**: Visual identifier
     - **Display Order**: Position in list
     - **Enabled**: Active/inactive toggle

3. **Save Activity**

### Managing Activities

**Edit**: Update activity details
**Reorder**: Change display sequence
**Disable**: Turn off without deleting
**Delete**: Remove permanently

### Participant View

- Activities appear in participant check-in
- Earn configured points on completion
- Must complete all to submit check-in

---

## 🔧 Advanced Features

### Export Data

(If implemented)
- Export participant data to CSV
- Export WOD performance reports
- Export leaderboard snapshots

### Bulk Operations

- Approve multiple users at once
- Bulk assign to squad
- Mass schedule WODs

### Notifications

(If implemented)
- Email participants about new WODs
- Send reminders for check-ins
- Announce squad updates

---

## 💡 Best Practices

### Program Management

1. **Setup Phase**:
   - Create squads first
   - Approve participants
   - Assign to squads
   - Create goal templates

2. **Content Preparation**:
   - Build library of workout templates
   - Plan workout rotation
   - Define check-in activities

3. **Launch**:
   - Bulk schedule first week
   - Assign personal goals to participants
   - Monitor analytics daily

4. **Ongoing**:
   - Schedule WODs weekly
   - Review analytics for engagement
   - Adjust difficulty based on completion
   - Recognize top performers

### Engagement Tips

- **Variety**: Mix workout types
- **Progression**: Gradually increase difficulty
- **Recognition**: Highlight achievements
- **Communication**: Regular updates to squads
- **Flexibility**: Adjust based on feedback

---

## 🛠️ Troubleshooting

### Common Issues

**Participants Can't See WOD**:
- Check squad assignment
- Verify WOD scheduled for correct squads
- Confirm date is correct

**Check-in Not Working**:
- Verify activities configured for squad
- Ensure goals assigned to user
- Check if already submitted today

**Approval Not Working**:
- Refresh page
- Check if status actually updated
- Verify user email in profiles table

### Technical Issues

- **Hard refresh**: Ctrl+Shift+R
- **Clear cache**: Help with stale data
- **Check console**: F12 for error messages
- **Database check**: Verify RLS policies

---

## 📞 Support & Maintenance

### Database Management

**Regular Tasks**:
- Monitor storage usage
- Check RLS policies
- Backup data regularly

**Performance**:
- Archive old WODs (if needed)
- Optimize queries
- Monitor analytics load times

### Security

- Change admin password regularly
- Limit admin access appropriately
- Review user permissions
- Monitor for unusual activity

---

## 🎯 Quick Reference

### Daily Admin Tasks

✅ Approve new registrations
✅ Review analytics dashboard
✅ Check today's WOD is scheduled
✅ Monitor check-in completion

### Weekly Admin Tasks

✅ Schedule next week's WODs
✅ Review squad performance
✅ Assign goals to new members
✅ Update workout library

### Monthly Admin Tasks

✅ Review overall engagement trends
✅ Plan next month's workout themes
✅ Recognize top performers
✅ Gather participant feedback
✅ Adjust program as needed

---

**You're all set! Happy Program Managing! 🚀**

Remember: Your goal is to create an engaging, challenging, and rewarding fitness experience. Use data to make informed decisions and keep participants motivated!
