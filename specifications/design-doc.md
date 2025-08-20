# Hattrick Steptrading Application - Design Document

## 1. User Experience Strategy

### 1.1 User Goals
- **Primary Goal**: Track and analyze player trading profitability in Hattrick
- **Secondary Goals**: 
  - Optimize trading strategies through data insights
  - Manage current player portfolio
  - Monitor financial performance over time
  - Make informed buying/selling decisions

### 1.2 User Personas

#### Primary Persona: Active Trader
- **Profile**: Experienced Hattrick player who regularly buys and sells players
- **Needs**: Quick data entry, clear profit visualization, trend analysis
- **Pain Points**: Manual calculation of profits, losing track of trading history
- **Behavior**: Uses mobile and desktop, values speed and accuracy

#### Secondary Persona: Casual Trader
- **Profile**: Occasional trader focused on team development
- **Needs**: Simple tracking, basic profit information
- **Pain Points**: Complex interfaces, overwhelming data
- **Behavior**: Primarily mobile user, prefers simplicity

### 1.3 Success Metrics
- Time to add new player: < 30 seconds
- Time to record sale: < 20 seconds
- Dashboard load time: < 2 seconds
- User task completion rate: > 95%

## 2. Information Architecture

### 2.1 Site Structure
```
Hattrick Steptrading App
├── Dashboard (Overview)
│   ├── Profit Summary
│   ├── Recent Activity
│   └── Quick Actions
├── Players
│   ├── Current Players (Owned)
│   └── Trading History (Sold)
├── Analytics
│   ├── Profit Trends
│   ├── Performance Metrics
│   └── Trading Insights
├── Add Player
│   ├── Manual Entry
│   └── Bulk Import
└── Settings
    ├── Account Preferences
    └── Data Export
```

### 2.2 Navigation Hierarchy
- **Primary Navigation**: Bottom tab bar (mobile) / Side navigation (desktop)
- **Secondary Navigation**: Page-specific tabs and filters
- **Contextual Actions**: Floating action buttons, inline actions

### 2.3 Content Organization
- **Dashboard**: High-level metrics and recent activity
- **Data Tables**: Sortable, filterable lists with pagination
- **Forms**: Progressive disclosure, contextual help
- **Analytics**: Interactive charts with drill-down capability

## 3. User Interface Design Principles

### 3.1 Design Philosophy
- **Clarity First**: Information hierarchy that prioritizes profit data
- **Efficiency**: Minimize clicks and form fields for common tasks
- **Consistency**: Unified patterns across all interfaces
- **Feedback**: Clear confirmation and error states

### 3.2 Visual Hierarchy
1. **Critical Information**: Profit/loss amounts, player status
2. **Important Data**: Player names, dates, purchase prices
3. **Supporting Information**: Secondary stats, metadata
4. **Actions**: Buttons and interactive elements

### 3.3 Interaction Patterns
- **Primary Actions**: Prominent buttons (Add Player, Record Sale)
- **Secondary Actions**: Text links, icon buttons
- **Destructive Actions**: Confirmation dialogs, warning states
- **Bulk Actions**: Selection patterns, batch operations

## 4. Component Specifications

### 4.1 Dashboard Components

#### Profit Summary Card
- **Purpose**: Display total profit, current value, and key metrics
- **Elements**: 
  - Total profit (large, color-coded)
  - Current portfolio value
  - Number of active players
  - Recent profit trend indicator
- **States**: Loading, success, error
- **Responsive**: Stacks vertically on mobile

#### Recent Activity Feed
- **Purpose**: Show latest player additions and sales
- **Elements**:
  - Player name and action type
  - Profit/loss amount
  - Timestamp
  - Quick action buttons
- **Behavior**: Auto-refresh, infinite scroll

### 4.2 Data Table Components

#### Player List Table
- **Columns**: 
  - Player name (sortable)
  - Purchase price
  - Current/Sale price
  - Profit/Loss (color-coded)
  - Purchase date
  - Actions (Edit, Sell, Delete)
- **Features**:
  - Sort by any column
  - Filter by date range, profit range
  - Search by player name
  - Bulk selection for actions
- **Mobile**: Card layout with essential information

#### Responsive Behavior
- **Desktop**: Full table with all columns
- **Tablet**: Hide less critical columns
- **Mobile**: Card-based layout with expandable details

### 4.3 Form Components

#### Add Player Form
- **Fields**:
  - Player name (required)
  - Purchase price (required, currency input)
  - Purchase date (date picker, defaults to today)
  - Notes (optional, textarea)
- **Validation**: Real-time validation with clear error messages
- **Submission**: Loading state, success confirmation

#### Record Sale Form
- **Fields**:
  - Sale price (required, currency input)
  - Sale date (date picker, defaults to today)
  - Notes (optional)
- **Behavior**: Auto-calculate profit, confirmation dialog

### 4.4 Navigation Components

#### Primary Navigation
- **Mobile**: Bottom tab bar with icons and labels
  - Dashboard (home icon)
  - Players (list icon)
  - Analytics (chart icon)
  - Add (plus icon)
- **Desktop**: Sidebar navigation with collapsible sections

#### Action Components
- **Floating Action Button**: Primary add action (mobile)
- **Quick Actions**: Contextual buttons in tables and cards
- **Bulk Actions**: Toolbar that appears on selection

## 5. User Flow Diagrams (Textual Description)

### 5.1 Add New Player Flow
1. User clicks "Add Player" button
2. Form opens with required fields highlighted
3. User enters player name and purchase price
4. System validates input in real-time
5. User submits form
6. Loading state displays
7. Success confirmation shown
8. User redirected to player list or dashboard
9. New player appears in current players list

### 5.2 Record Sale Flow
1. User navigates to current players list
2. User finds player to sell (search/filter if needed)
3. User clicks "Sell" action button
4. Sale form opens with player context
5. User enters sale price and date
6. System calculates profit automatically
7. Confirmation dialog shows profit/loss
8. User confirms sale
9. Player moves to trading history
10. Dashboard updates with new profit data

### 5.3 Dashboard Overview Flow
1. User opens application
2. Dashboard loads with summary metrics
3. Recent activity feed displays latest transactions
4. User can quick-add player or view detailed lists
5. Profit trends show performance over time
6. User can navigate to detailed views for more information

## 6. Responsive Design Guidelines

### 6.1 Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px and above

### 6.2 Layout Adaptations

#### Mobile (320px - 767px)
- **Navigation**: Bottom tab bar
- **Tables**: Card-based layout
- **Forms**: Single column, full-width inputs
- **Dashboard**: Stacked cards, minimal spacing

#### Tablet (768px - 1023px)
- **Navigation**: Side panel or top navigation
- **Tables**: Simplified columns, horizontal scroll if needed
- **Forms**: Two-column layout for related fields
- **Dashboard**: Grid layout with larger cards

#### Desktop (1024px+)
- **Navigation**: Persistent sidebar
- **Tables**: Full column display with advanced features
- **Forms**: Optimized spacing, contextual help
- **Dashboard**: Multi-column layout with detailed widgets

### 6.3 Touch Targets
- **Minimum size**: 44px x 44px for all interactive elements
- **Spacing**: 8px minimum between touch targets
- **Gesture support**: Swipe actions on mobile for common tasks

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance

#### Color and Contrast
- **Text contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color independence**: Information not conveyed by color alone
- **Profit indicators**: Use icons and text in addition to color coding

#### Keyboard Navigation
- **Tab order**: Logical sequence through all interactive elements
- **Focus indicators**: Clear, high-contrast focus rings
- **Keyboard shortcuts**: Common actions accessible via keyboard
- **Skip links**: Allow users to skip navigation

#### Screen Reader Support
- **Semantic markup**: Proper heading hierarchy, landmarks
- **ARIA labels**: Descriptive labels for complex components
- **Table headers**: Proper association between data and headers
- **Form labels**: Clear, descriptive labels for all inputs
- **Status updates**: Announce dynamic content changes

#### Motor Accessibility
- **Large touch targets**: Minimum 44px interactive areas
- **Gesture alternatives**: Keyboard alternatives for touch gestures
- **Timeout extensions**: User control over session timeouts

### 7.2 Assistive Technology Testing
- **Screen readers**: VoiceOver (iOS/macOS), TalkBack (Android), NVDA (Windows)
- **Voice control**: Dragon NaturallySpeaking, Voice Control
- **Switch navigation**: Single-switch and multiple-switch users

## 8. Visual Design System

### 8.1 Color Palette

#### Primary Colors
- **Brand Blue**: #2563eb (Primary actions, links)
- **Success Green**: #059669 (Profits, positive values)
- **Warning Orange**: #d97706 (Alerts, break-even)
- **Error Red**: #dc2626 (Losses, errors)

#### Neutral Colors
- **Gray 900**: #111827 (Primary text)
- **Gray 700**: #374151 (Secondary text)
- **Gray 500**: #6b7280 (Tertiary text)
- **Gray 300**: #d1d5db (Borders)
- **Gray 100**: #f3f4f6 (Backgrounds)
- **Gray 50**: #f9fafb (Light backgrounds)

#### Semantic Colors
- **Profit**: Success Green with variations
- **Loss**: Error Red with variations
- **Neutral**: Gray tones for break-even

### 8.2 Typography

#### Font Family
- **Primary**: Inter (web-safe fallback: system-ui, sans-serif)
- **Monospace**: JetBrains Mono (for currency values)

#### Type Scale
- **Display**: 3rem / 48px (Dashboard totals)
- **Heading 1**: 2.25rem / 36px (Page titles)
- **Heading 2**: 1.875rem / 30px (Section titles)
- **Heading 3**: 1.5rem / 24px (Card titles)
- **Body Large**: 1.125rem / 18px (Important text)
- **Body**: 1rem / 16px (Default text)
- **Body Small**: 0.875rem / 14px (Secondary text)
- **Caption**: 0.75rem / 12px (Metadata)

### 8.3 Spacing System
- **Base unit**: 4px
- **Scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px
- **Component spacing**: 16px default, 8px compact, 24px spacious
- **Layout margins**: 16px mobile, 24px tablet, 32px desktop

### 8.4 Component Styling

#### Buttons
- **Primary**: Blue background, white text, rounded corners
- **Secondary**: White background, blue border and text
- **Destructive**: Red background, white text
- **Ghost**: Transparent background, colored text
- **States**: Hover, focus, active, disabled

#### Form Elements
- **Inputs**: Border, rounded corners, focus states
- **Labels**: Clear typography, proper spacing
- **Validation**: Inline error messages, success indicators
- **Help text**: Subtle styling, contextual placement

#### Data Display
- **Tables**: Alternating row colors, clear headers
- **Cards**: Subtle shadows, rounded corners
- **Badges**: Small, colored indicators for status
- **Charts**: Accessible colors, clear legends

### 8.5 Iconography
- **Style**: Outline icons for consistency
- **Size**: 16px, 20px, 24px standard sizes
- **Usage**: Consistent meaning across application
- **Accessibility**: Accompanied by text labels

### 8.6 Dark Mode Support
- **Color adaptation**: Adjusted contrast ratios for dark backgrounds
- **Image handling**: Dark mode variants for graphics
- **User preference**: Respect system settings, manual toggle
- **Accessibility**: Maintain contrast requirements in both modes

## Implementation Notes

### 8.7 Performance Considerations
- **Progressive loading**: Prioritize above-the-fold content
- **Image optimization**: Responsive images, appropriate formats
- **Code splitting**: Load features on demand
- **Caching**: Effective caching strategies for repeated data

### 8.8 Technical Constraints
- **Framework**: Next.js with React components
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: Radix UI primitives for accessibility
- **State management**: Consider data freshness and offline capability

### 8.9 Future Considerations
- **Scalability**: Design patterns that support feature growth
- **Internationalization**: Text expansion, RTL language support
- **Platform expansion**: Potential native mobile app considerations
- **Integration**: API design that supports third-party integrations

---

This design document serves as the foundation for creating a user-centered, accessible, and scalable Hattrick Steptrading Application that helps users effectively track and analyze their player trading performance.