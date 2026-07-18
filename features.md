# Features

Conference Scheduler 2026 is packed with powerful features to make conference planning effortless.

## Core Features

### 📥 Import Wizard
- **CSV and Excel Support** - Import data from .csv, .xlsx, or .xls files
- **Smart Column Mapping** - Automatically detects common column names
- **Manual Column Selection** - Full control over field mapping
- **Weekday Availability Detection** - Auto-detects and parses presenter availability columns
- **Data Validation** - Ensures required fields are present before proceeding

### 🎯 Drag-and-Drop Scheduling
- **Visual Grid Interface** - Organize sessions across days, time slots, and rooms
- **Intuitive Drag-and-Drop** - Powered by dnd-kit for smooth, accessible interactions
- **Day Tabs** - Switch between conference days seamlessly
- **Room Columns** - Each room has its own column for easy visualization
- **Drop Zone Highlights** - Visual feedback when dragging sessions

### 🎨 Session Management
- **Session Duplication** - Create multiple offerings of the same session with +/- buttons
- **Rich Text Descriptions** - Format session descriptions with bold, italic, lists, and links
- **Session Details Popup** - View complete session information with presenter availability
- **Radial Context Menu** - Right-click sessions for quick actions
- **Color-Coded Cards** - Visual distinction between different sessions

### 🔍 Filtering and Search
- **Multi-Criteria Filtering** - Filter by presenter, session title, or description
- **Real-Time Search** - Instant results as you type
- **Filter Bar** - Persistent search interface in the session list panel

### 🤖 Auto-Scheduling
- **Intelligent Placement** - Automatically schedules sessions based on constraints
- **Availability Respect** - Only schedules presenters during their available times
- **Room Preference Matching** - Considers room capacity and presenter preferences
- **Conflict Avoidance** - Prevents scheduling conflicts during auto-assignment
- **Batch Processing** - Schedule all or selected sessions at once

### ⚠️ Conflict Detection
- **Presenter Conflicts** - Detects when a presenter is double-booked
- **Room Conflicts** - Alerts when multiple sessions are assigned to the same room/time
- **Capacity Warnings** - Highlights when room capacity is exceeded
- **Visual Badges** - Color-coded conflict indicators on session cards
- **Conflicts Modal** - Comprehensive list of all detected conflicts

### 👥 Presenter Management
- **Presenter List View** - Browse all presenters and their sessions
- **Availability Display** - See each presenter's available time slots
- **Day-Organized Format** - Availability grouped and sorted by day
- **Time Range Details** - Individual time slots displayed clearly
- **Unavailability Indicators** - Orange badges for unavailable periods

### 📤 Export Options
- **PDF Export** - Professional schedule documents with jsPDF
- **CSV Export** - Export to spreadsheet format
- **Custom Field Selection** - Choose which fields to include in exports
- **Print View** - Optimized print layout
- **Multi-Format Support** - Different export formats for different needs

### 🎨 Theming
- **Dark Mode** - Full dark theme support
- **Light Mode** - Clean, bright interface
- **Theme Toggle** - Easy switching between modes
- **Persistent Preferences** - Theme choice saved to localStorage

### 💾 Data Persistence
- **Auto-Save** - All changes automatically saved to localStorage
- **Session Recovery** - Resume work exactly where you left off
- **No Server Required** - Fully client-side storage
- **Import/Export** - Move data between browsers or devices

### ⚙️ Configuration
- **Custom Days** - Define your conference schedule
- **Flexible Time Slots** - Set start and end times for each session block
- **Room Management** - Add rooms with capacity and features
- **Multi-Day Support** - Handle conferences spanning multiple days
- **Reusable Configurations** - Save and load common setups

### 📋 Additional Features
- **Keyboard Shortcuts** - Efficient navigation and actions
- **Help Menu** - In-app documentation and guides
- **About Modal** - Version information and credits
- **Patch Notes** - Full changelog from v1.0.0 to current
- **Shortcuts Reference** - Quick guide to keyboard commands
- **Settings Modal** - Centralized configuration panel

## Availability System

### Advanced Availability Parsing
- **Multi-Day Detection** - Reads all weekday columns from spreadsheet
- **Flexible Format Support** - Handles various date formats (e.g., "THURSDAY, August 31")
- **Time Range Parsing** - Extracts time slots like "2:45p - 3:35p"
- **Unavailability Notes** - Detects and displays "I will not be able to teach..." text
- **Calendar Order Sorting** - Days displayed in chronological order
- **Time Sorting** - Time ranges sorted within each day
- **Duplicate Consolidation** - Merges duplicate day entries

### Availability Display
- **Bold Day Headers** - Clear section headers for each day
- **Green Time Slots** - Available times shown with checkmarks
- **Orange Unavailable Markers** - Clear indication of unavailable periods
- **Consistent Formatting** - Matching format in Session Details and Presenter List
- **Clean, Readable Layout** - Easy to scan and understand

## Technical Features

### Performance
- **React 18** - Latest React features including concurrent rendering
- **TypeScript** - Full type safety and IntelliSense support
- **Vite** - Fast HMR (Hot Module Replacement) in development
- **Optimized Builds** - Production builds with code splitting
- **Efficient State Management** - Zustand with minimal re-renders

### Code Quality
- **ESLint** - Code linting for consistency
- **TypeScript Strict Mode** - Enhanced type checking
- **Component Architecture** - Modular, reusable components
- **Utility Functions** - Separated business logic
- **Type Definitions** - Comprehensive TypeScript interfaces

### Browser Compatibility
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **Responsive Design** - Works on desktop and tablet screens
- **localStorage API** - Universal browser support
- **HTML5 Canvas** - For PDF generation
- **CSS Grid/Flexbox** - Modern layout techniques

## Future Enhancements (Potential)

- Real-time collaboration
- Cloud storage integration
- Advanced analytics and reporting
- Mobile app version
- Multiple language support
- Template library
- Recurring session patterns
- Resource allocation (equipment, etc.)
- Attendee capacity tracking
- Email notifications
