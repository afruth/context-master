# Design System & Guidelines

## Design Philosophy

### User-Centered Financial Tracking
The Hattrick Steptrading Application prioritizes clarity, trust, and actionable insights for players managing their trading performance. Our design philosophy centers on:

- **Clarity First**: Financial data must be immediately comprehensible with clear visual hierarchy
- **Trust Through Consistency**: Professional, reliable interface that builds user confidence
- **Data-Driven Design**: Interface optimized for quick decision-making and performance analysis
- **Progressive Disclosure**: Complex trading information revealed progressively to avoid cognitive overload
- **Performance-Oriented**: Fast loading and responsive interactions for real-time trading decisions
- **Accessibility-First**: Equal access to financial tools for all users regardless of abilities

### Core Principles
1. **Transparency**: All calculations and fees are clearly visible and explained
2. **Efficiency**: Minimize clicks and cognitive load for frequent trading operations
3. **Precision**: Exact values and calculations with appropriate decimal precision
4. **Context**: Always provide relevant context for financial decisions
5. **Forgiveness**: Clear error states and easy recovery from mistakes

## Visual Identity

### Brand Characteristics
- **Professional**: Clean, business-like appearance that inspires confidence
- **Trustworthy**: Subtle design elements that convey reliability and security
- **Modern**: Contemporary interface patterns familiar to users of financial applications
- **Accessible**: High contrast and clear visual indicators for all users

### Primary Brand Colors
- **Hattrick Green**: `#2D7D32` (Success, profit, positive trends)
- **Professional Blue**: `#1565C0` (Primary actions, navigation, trust)
- **Neutral Slate**: `#475569` (Text, secondary information)
- **Clean White**: `#FFFFFF` (Backgrounds, cards, clean space)

### Logo Usage
- Maintain clear space equal to the height of the "H" in Hattrick
- Use on neutral backgrounds for maximum legibility
- Monochrome version available for single-color applications

## Component Design System

### Base Architecture
- **Foundation**: Radix UI primitives ensuring accessibility and keyboard navigation
- **Styling**: Tailwind CSS with custom design tokens for financial applications
- **Variants**: Class Variance Authority (CVA) for systematic component variations
- **Responsive**: Mobile-first approach with breakpoints at 640px, 768px, 1024px, 1280px

### Financial-Specific Components

#### Trading Cards
- **Player Card**: Compact display of player info, current value, and quick actions
- **Transaction Card**: Historical trading data with profit/loss indicators
- **Summary Card**: Key metrics with prominent visual indicators

#### Data Tables
- **Trading History Table**: Sortable columns with fixed headers for large datasets
- **Player List Table**: Filterable and searchable with bulk action capabilities
- **Performance Table**: Comparative analysis with trend indicators

#### Form Components
- **Trading Calculator**: Real-time calculation with immediate feedback
- **Player Search**: Autocomplete with recent searches and favorites
- **Filters Panel**: Collapsible advanced filtering with preset options

#### Navigation
- **Trading Tabs**: Clear separation between different trading views
- **Breadcrumbs**: Context for nested trading categories
- **Action Buttons**: Prominent CTAs for primary trading actions

## Color System

### Semantic Colors

#### Financial Status Colors
```css
/* Profit/Positive */
--profit-50: #E8F5E8;
--profit-100: #C8E6C9;
--profit-500: #4CAF50;
--profit-700: #388E3C;
--profit-900: #2E7D32;

/* Loss/Negative */
--loss-50: #FFEBEE;
--loss-100: #FFCDD2;
--loss-500: #F44336;
--loss-700: #D32F2F;
--loss-900: #C62828;

/* Neutral/Break-even */
--neutral-50: #FAFAFA;
--neutral-100: #F5F5F5;
--neutral-500: #9E9E9E;
--neutral-700: #616161;
--neutral-900: #212121;
```

#### Status Indicators
```css
/* Active Trading */
--active: #2196F3;
--active-bg: #E3F2FD;

/* Pending Transactions */
--pending: #FF9800;
--pending-bg: #FFF3E0;

/* Completed */
--completed: #4CAF50;
--completed-bg: #E8F5E8;

/* Error/Warning */
--error: #F44336;
--error-bg: #FFEBEE;
--warning: #FF9800;
--warning-bg: #FFF8E1;
```

#### Primary Color Palette
```css
/* Primary Blue */
--primary-50: #E3F2FD;
--primary-100: #BBDEFB;
--primary-500: #2196F3;
--primary-700: #1976D2;
--primary-900: #0D47A1;

/* Secondary Green */
--secondary-50: #E8F5E8;
--secondary-100: #C8E6C9;
--secondary-500: #4CAF50;
--secondary-700: #388E3C;
--secondary-900: #1B5E20;
```

### Usage Guidelines
- **Profit/Loss**: Always use semantic colors consistently across all components
- **Interactive Elements**: Primary blue for clickable elements and active states
- **Backgrounds**: Light grays and whites for readability and focus
- **Text**: High contrast ratios (4.5:1 minimum) for all text content

## Typography

### Font Stack
```css
/* Primary Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace for Numbers */
font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', monospace;
```

### Type Scale
```css
/* Display */
--text-xs: 12px;    /* Small labels, captions */
--text-sm: 14px;    /* Body text, secondary information */
--text-base: 16px;  /* Primary body text */
--text-lg: 18px;    /* Emphasized text */
--text-xl: 20px;    /* Card titles */
--text-2xl: 24px;   /* Section headings */
--text-3xl: 30px;   /* Page titles */
--text-4xl: 36px;   /* Display headings */
```

### Financial Data Typography
- **Currency Values**: Monospace font for alignment in tables
- **Player Names**: Regular weight, adequate letter spacing
- **Percentages**: Bold weight for profit/loss percentages
- **Dates**: Consistent format (DD/MM/YYYY) in smaller text
- **Labels**: All caps with letter spacing for form labels

### Hierarchy Guidelines
1. **H1**: Page titles (text-3xl, font-bold)
2. **H2**: Section headings (text-2xl, font-semibold)
3. **H3**: Card titles (text-xl, font-medium)
4. **Body**: Regular text (text-base, font-normal)
5. **Small**: Secondary info (text-sm, text-gray-600)
6. **Caption**: Helper text (text-xs, text-gray-500)

## Spacing & Layout

### Spacing Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Grid System
- **Container**: Max-width of 1280px with responsive padding
- **Columns**: 12-column grid with 24px gutters
- **Breakpoints**: 
  - Mobile: 320px - 639px (1 column layouts)
  - Tablet: 640px - 1023px (2-3 column layouts)
  - Desktop: 1024px+ (up to 4 column layouts)

### Layout Patterns

#### Dashboard Layout
- **Header**: Fixed navigation with trading summary
- **Sidebar**: Collapsible navigation on desktop, bottom tabs on mobile
- **Main Content**: Flexible grid for trading cards and tables
- **Footer**: Minimal with essential links

#### Data Table Layout
- **Fixed Header**: Always visible column headers
- **Sticky Columns**: Important data (player name, current value) remain visible
- **Pagination**: Clear navigation with item counts
- **Filters**: Collapsible panel on desktop, modal on mobile

#### Form Layout
- **Single Column**: Mobile-first approach for all forms
- **Field Groups**: Related fields grouped with subtle backgrounds
- **Button Groups**: Primary action prominent, secondary actions subtle
- **Help Text**: Contextual guidance without overwhelming

## Data Visualization Guidelines

### Chart Types
- **Line Charts**: Profit/loss trends over time
- **Bar Charts**: Comparative performance between players
- **Pie Charts**: Portfolio distribution (used sparingly)
- **Sparklines**: Compact trend indicators in tables

### Visual Encoding
- **Color**: Profit (green) vs Loss (red) consistently
- **Position**: Higher values positioned higher/right
- **Size**: Proportional to monetary values
- **Opacity**: Used for inactive/historical data

### Interactive Elements
- **Hover States**: Detailed tooltips with exact values
- **Click Actions**: Direct navigation to detailed views
- **Zoom Controls**: For detailed time-series analysis
- **Export Options**: CSV/PDF download capabilities

## Form Design Patterns

### Input Components
- **Text Inputs**: Clear labels, proper validation, helpful placeholder text
- **Number Inputs**: Formatted for currency with proper decimal handling
- **Select Dropdowns**: Searchable for large lists (players, leagues)
- **Date Pickers**: Intuitive calendar interface with keyboard shortcuts
- **Checkboxes/Radio**: Clear visual states and group labeling

### Validation Strategy
- **Real-time**: Immediate feedback for format errors
- **On Submit**: Comprehensive validation with clear error messages
- **Progressive**: Guide users through complex multi-step processes
- **Recovery**: Easy correction paths for validation errors

### Form Layout
- **Vertical Stacking**: All forms use vertical layout for mobile compatibility
- **Field Spacing**: Consistent 16px spacing between form fields
- **Button Placement**: Primary action bottom-right, cancel bottom-left
- **Help Text**: Below inputs, color-coded for different message types

## Mobile Responsiveness

### Touch-First Design
- **Minimum Touch Target**: 44px × 44px for all interactive elements
- **Thumb Navigation**: Critical actions within thumb reach
- **Swipe Gestures**: Natural swipe actions for table navigation
- **Pull to Refresh**: Standard mobile patterns for data updates

### Mobile-Specific Features
- **Quick Actions**: Swipe-to-sell, long-press for context menus
- **Compact Cards**: Essential information in thumb-scrollable cards
- **Bottom Sheet Modals**: Native-feeling modal presentations
- **Haptic Feedback**: Subtle feedback for successful actions

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript for form submissions
- **Enhanced Experience**: Rich interactions with JavaScript enabled
- **Offline Capability**: Cached data for basic trading calculations
- **Network Awareness**: Graceful degradation for slow connections

## Error States and Validation Feedback

### Error Message Hierarchy
1. **Field-Level**: Immediate validation feedback
2. **Form-Level**: Summary of validation issues
3. **Page-Level**: System errors and connectivity issues
4. **Application-Level**: Critical errors requiring user action

### Visual Error Indicators
- **Color**: Consistent red color system for all error states
- **Icons**: Warning/error icons for immediate recognition
- **Borders**: Red border treatment for invalid fields
- **Background**: Subtle red background for error containers

### Error Recovery
- **Clear Instructions**: Specific guidance on how to fix errors
- **Inline Editing**: Fix errors without losing form context
- **Bulk Actions**: Address multiple similar errors at once
- **Help Links**: Contextual help for complex validation rules

### Validation Timing
- **On Blur**: Check individual fields when user moves on
- **On Change**: Real-time feedback for formatting issues
- **On Submit**: Comprehensive final validation
- **Debounced**: Avoid overwhelming users with constant feedback

## Loading States and Calculations

### Loading Indicators
- **Skeleton Screens**: Content-aware loading placeholders
- **Progress Bars**: For multi-step processes and file uploads
- **Spinners**: For quick calculations and API calls
- **Shimmer Effects**: Subtle animation indicating active loading

### Real-time Calculations
- **Instant Feedback**: Profit/loss calculations update immediately
- **Debounced Updates**: Prevent excessive API calls during typing
- **Visual Indicators**: Show when calculations are in progress
- **Cached Results**: Store frequently calculated values locally

### Performance Optimization
- **Lazy Loading**: Load trading data as needed
- **Virtual Scrolling**: Handle large player lists efficiently
- **Image Optimization**: Compressed player photos with fallbacks
- **Code Splitting**: Load only necessary JavaScript for current view

## Accessibility Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements (minimum 4.5:1 ratio)
- Focus management for modal dialogs and complex interactions
- Alternative text for all trading charts and data visualizations
- Proper ARIA labels for financial data tables

## Dark Mode Support

### Implementation Strategy
- **CSS Custom Properties**: System-wide color token management
- **User Preference**: Respect system settings with manual override option
- **Consistent Contrast**: Maintain accessibility standards in both modes
- **Semantic Colors**: Profit/loss colors adapt while maintaining meaning

### Dark Mode Color Palette
```css
/* Dark Mode Backgrounds */
--dark-bg-primary: #0F172A;
--dark-bg-secondary: #1E293B;
--dark-bg-tertiary: #334155;

/* Dark Mode Text */
--dark-text-primary: #F8FAFC;
--dark-text-secondary: #CBD5E1;
--dark-text-tertiary: #94A3B8;

/* Dark Mode Borders */
--dark-border: #334155;
--dark-border-light: #475569;
```

### Component Adaptations
- **Cards**: Elevated appearance with subtle shadows
- **Tables**: Alternating row colors for better readability
- **Forms**: Higher contrast for input fields and labels
- **Charts**: Adapted color schemes maintaining data clarity