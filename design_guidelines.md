# Design Guidelines: Professional Certification Tracking Platform

## Design Approach

**Reference-Based Approach**: Draw inspiration from Linear and Notion for modern productivity aesthetics combined with Material Design principles for data-dense interfaces.

**Core Principles**:
- Clean, professional interface prioritizing information clarity
- Efficient workflows for both admin and user roles
- Data-first design with emphasis on scannability
- Consistent, predictable interaction patterns

## Typography System

**Font Family**: Inter (via Google Fonts CDN)

**Hierarchy**:
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels/Meta: text-sm font-medium
- Captions/Helper: text-xs font-normal

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12 consistently
- Component padding: p-4 or p-6
- Section spacing: mb-8 or mb-12
- Card gaps: gap-6
- Form field spacing: space-y-4

**Container Strategy**:
- Main dashboard: max-w-7xl mx-auto px-6
- Sidebar width: w-64 (fixed)
- Content area: flex-1 with responsive padding

## Component Library

### Navigation & Layout

**Admin/User Sidebar**:
- Fixed left sidebar (w-64) with logo at top
- Navigation items with icons (Heroicons) + labels
- Active state: subtle background treatment
- User profile section at bottom
- Role indicator badge

**Top Bar**:
- Search bar (centered, max-w-2xl)
- Notification bell icon
- User avatar dropdown (right-aligned)
- Breadcrumb navigation for nested views

### Dashboard Components

**Certification Cards**:
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Card structure: border, rounded-lg, p-6
- Certification name: text-lg font-semibold
- Status badge (top-right): pill shape with rounded-full
- Expiration date: text-sm with calendar icon
- Action buttons: text-sm in card footer

**Status Indicators**:
- Active: checkmark icon
- Expiring Soon (30 days): warning icon
- Expiring (60 days): alert icon  
- Expired: x-circle icon
- Use icons from Heroicons

**Data Table** (Admin All Certifications View):
- Striped rows for scannability
- Sticky header: position-sticky top-0
- Sortable columns with arrow indicators
- Row hover state for interactivity
- Actions column (right): icon buttons for edit/delete
- Pagination controls at bottom

### Forms & Inputs

**Form Structure**:
- Vertical layout with space-y-6
- Label above input: text-sm font-medium mb-2
- Input fields: border rounded-md px-4 py-2.5
- Full width inputs with max-w-md for text fields
- File upload: dashed border with upload icon and drag-drop text
- Helper text: text-xs mt-1

**Buttons**:
- Primary: px-6 py-2.5 rounded-md font-medium
- Secondary: outlined variant
- Icon buttons: p-2 rounded-md (for table actions)
- Button groups: flex gap-3

### Alerts & Notifications

**Expiration Alerts**:
- Banner style at top of relevant views
- Icon + message + dismiss button
- 30-day warning: prominent placement
- 60/90-day: less prominent, collapsible

**Toast Notifications**:
- Fixed bottom-right position
- Slide-in animation
- Auto-dismiss after 5 seconds
- Action confirmation messages

### Search & Filter

**Search Bar**:
- Magnifying glass icon (left)
- Placeholder: "Search certifications..."
- Rounded-full design
- min-w-96

**Filter Panel**:
- Dropdown or sidebar panel
- Checkbox groups for status filters
- Date range picker for expiration
- Apply/Clear buttons at bottom

## Images

**Logo Placement**: Top of sidebar, centered, h-8 or h-10

**User Avatars**: Circular (rounded-full), w-10 h-10 in navigation, w-8 h-8 in tables

**Empty States**: Use simple illustrations or icons centered with supportive text when no certifications exist

**Certificate Icons**: Use document/certificate icon from Heroicons next to certification names

**No Hero Image**: This is a dashboard application, not a marketing site

## Accessibility

- All interactive elements must have visible focus states (ring-2 ring-offset-2)
- Form inputs include proper labels and ARIA attributes
- Icon buttons include aria-label descriptors
- Table headers properly scoped
- Keyboard navigation through all interactive elements
- Color contrast meets WCAG AA standards minimum

## Key Layout Patterns

**Admin Dashboard**: Sidebar + main content area with metrics cards at top, followed by table or grid

**User Dashboard**: Sidebar + main content area with personal certification grid, upcoming renewals highlighted prominently

**Add/Edit Forms**: Centered form (max-w-2xl mx-auto) with clear section breaks

**Certification Detail View**: Two-column layout - details on left (lg:w-2/3), actions/metadata on right (lg:w-1/3)