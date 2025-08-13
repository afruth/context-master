# Design System & Guidelines

## Design Philosophy

Our design philosophy centers on **productivity through clarity** and **collaboration through connection**. Every design decision prioritizes user focus, reduces cognitive load, and facilitates seamless teamwork.

### Core Principles
- **Clarity First**: Information hierarchy that guides users naturally through tasks
- **Productivity Focus**: Minimize friction, maximize efficiency in task management
- **Collaborative Spirit**: Visual cues that distinguish personal and team contexts
- **Progressive Disclosure**: Show what's needed, when it's needed
- **Inclusive Access**: Universal design that works for all users and abilities

## Visual Identity

### Brand Personality
- **Modern & Forward-thinking**: Clean, contemporary interface with subtle futuristic touches
- **Professional yet Approachable**: Serious productivity tool with human warmth
- **Trustworthy & Reliable**: Consistent patterns users can depend on
- **Collaborative & Connected**: Visual language that emphasizes teamwork

### Logo & Branding
- Minimalist approach emphasizing functionality over decoration
- Iconography should be clear, universal, and contextually meaningful
- Consistent visual weight across all brand elements

## Color System

### Primary Palette
```
Primary (Turquoise)
- primary-50:  #f0fdfa
- primary-100: #ccfbf1
- primary-200: #99f6e4
- primary-300: #5eead4
- primary-400: #2dd4bf
- primary-500: #06b6d4  // Main brand color
- primary-600: #0891b2
- primary-700: #0e7490
- primary-800: #155e75
- primary-900: #164e63
```

### Secondary Colors
```
Secondary (Complementary Orange)
- secondary-50:  #fff7ed
- secondary-100: #ffedd5
- secondary-200: #fed7aa
- secondary-300: #fdba74
- secondary-400: #fb923c
- secondary-500: #f97316
- secondary-600: #ea580c
- secondary-700: #c2410c
- secondary-800: #9a3412
- secondary-900: #7c2d12
```

### Semantic Colors
```
Success (Green)
- success-50:  #f0fdf4
- success-500: #22c55e
- success-600: #16a34a

Warning (Amber)
- warning-50:  #fffbeb
- warning-500: #f59e0b
- warning-600: #d97706

Error (Red)
- error-50:  #fef2f2
- error-500: #ef4444
- error-600: #dc2626

Info (Blue)
- info-50:   #eff6ff
- info-500:  #3b82f6
- info-600:  #2563eb
```

### Grayscale
```
Text & Interface Grays
- gray-50:   #f9fafb  // Light backgrounds
- gray-100:  #f3f4f6  // Card backgrounds
- gray-200:  #e5e7eb  // Borders, dividers
- gray-300:  #d1d5db  // Disabled states
- gray-400:  #9ca3af  // Placeholder text
- gray-500:  #6b7280  // Secondary text
- gray-600:  #4b5563  // Body text
- gray-700:  #374151  // Headings
- gray-800:  #1f2937  // Primary text
- gray-900:  #111827  // High contrast text
```

### Usage Guidelines
- **Primary**: Actions, links, progress indicators, active states
- **Secondary**: Accent elements, hover states, secondary actions
- **Success**: Completed tasks, confirmations, positive feedback
- **Warning**: Pending items, cautions, non-critical alerts
- **Error**: Validation errors, critical alerts, destructive actions
- **Gray-800**: Primary text content
- **Gray-600**: Secondary text, descriptions
- **Gray-400**: Placeholder text, disabled content

## Typography

### Font Selection
```
Headers: Space Grotesk
- Modern, geometric sans-serif
- Futuristic personality while maintaining readability
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

Body Text: Inter
- Optimized for screen reading and accessibility
- Excellent legibility at all sizes
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)

Code/Monospace: JetBrains Mono
- Fixed-width font for code snippets, timestamps
- Weight: 400 (Regular)
```

### Typography Hierarchy

#### Desktop Scale
```
Display Large:    Space Grotesk 48px/52px, Weight 700
Display Medium:   Space Grotesk 36px/40px, Weight 600
Display Small:    Space Grotesk 30px/36px, Weight 600

Heading 1:        Space Grotesk 24px/32px, Weight 600
Heading 2:        Space Grotesk 20px/28px, Weight 600
Heading 3:        Space Grotesk 18px/28px, Weight 600
Heading 4:        Space Grotesk 16px/24px, Weight 500

Body Large:       Inter 18px/28px, Weight 400
Body Medium:      Inter 16px/24px, Weight 400
Body Small:       Inter 14px/20px, Weight 400

Caption:          Inter 12px/16px, Weight 400
Label:            Inter 14px/20px, Weight 500
Button:           Inter 14px/20px, Weight 500
```

#### Mobile Scale (< 768px)
```
Display Large:    Space Grotesk 36px/40px, Weight 700
Display Medium:   Space Grotesk 30px/36px, Weight 600
Display Small:    Space Grotesk 24px/32px, Weight 600

Heading 1:        Space Grotesk 20px/28px, Weight 600
Heading 2:        Space Grotesk 18px/28px, Weight 600
Heading 3:        Space Grotesk 16px/24px, Weight 600
Heading 4:        Space Grotesk 14px/20px, Weight 500

Body Large:       Inter 16px/24px, Weight 400
Body Medium:      Inter 14px/20px, Weight 400
Body Small:       Inter 12px/18px, Weight 400
```

## Spacing & Layout

### Spacing Scale
```
xs:  4px   (0.25rem)  // Icon padding, fine details
sm:  8px   (0.5rem)   // Small gaps, tight layouts
md:  16px  (1rem)     // Default spacing, component padding
lg:  24px  (1.5rem)   // Section spacing, card padding
xl:  32px  (2rem)     // Large section breaks
2xl: 48px  (3rem)     // Major layout divisions
3xl: 64px  (4rem)     // Page-level spacing
4xl: 96px  (6rem)     // Hero sections, major breaks
```

### Grid System
- **Container Max Width**: 1280px (80rem)
- **Responsive Breakpoints**:
  - sm: 640px (40rem)
  - md: 768px (48rem)
  - lg: 1024px (64rem)
  - xl: 1280px (80rem)
  - 2xl: 1536px (96rem)

### Layout Patterns
- **Sidebar + Main**: 256px sidebar, flex main content
- **Card Grid**: CSS Grid with auto-fit columns, 280px minimum
- **Modal Widths**: sm (384px), md (512px), lg (640px), xl (768px)

## Component Design System

### Todo Cards

#### Personal Todo Cards
```
Style: Clean, minimal border, subtle shadow
Colors: White background, gray-200 border
States: 
- Default: Subtle shadow, gray border
- Hover: Lifted shadow, primary-100 border
- Selected: primary-200 background, primary-500 border
- Completed: gray-100 background, strikethrough text
```

#### Team Todo Cards
```
Style: Slightly more prominent, team color accent
Colors: White background, left border in team color
Visual Distinction: 4px left border, team member avatar
States:
- Default: Team color left border, subtle shadow
- Hover: Enhanced shadow, team color background tint
- Selected: Team color background (10% opacity)
- Completed: Muted team color, reduced opacity
```

### Forms and Inputs

#### Text Inputs
```
Base State: gray-200 border, white background
Focus State: primary-500 border, primary-50 background
Error State: error-500 border, error-50 background
Success State: success-500 border, success-50 background
Disabled State: gray-100 background, gray-300 border
```

#### WYSIWYG Editor
```
Container: Clean border, generous padding
Toolbar: gray-50 background, subtle bottom border
Content Area: White background, focus ring on container
Markdown Toggle: Toggle switch in toolbar
Preview Mode: Slightly gray background to distinguish
```

### Modal and Dialog Patterns

#### Modal Structure
```
Backdrop: black with 50% opacity
Container: White background, rounded-lg, max-width based on content
Header: Consistent padding, optional close button
Body: Scrollable content area, generous padding
Footer: Action buttons, right-aligned
```

#### Dialog Variants
- **Confirmation**: Small width, centered text, clear actions
- **Form**: Medium width, form layout, validation states
- **Content**: Large width for rich content display

### Navigation Structure

#### Primary Navigation
```
Desktop: Horizontal navigation bar, persistent
Mobile: Collapsible hamburger menu
Active State: primary-500 text, subtle background
Hover State: gray-100 background
```

#### Secondary Navigation
```
Sidebar: Vertical navigation for app sections
Breadcrumbs: For deep navigation hierarchy
Tab Navigation: For related content sections
```

## Iconography Guidelines

### Icon System
- **Library**: Lucide React (consistent stroke width, modern style)
- **Sizes**: 16px, 20px, 24px, 32px
- **Stroke Width**: 2px for consistency
- **Usage**: Semantic meaning, not decoration

### Icon Categories
- **Actions**: Plus, Edit, Delete, Save, Share
- **Status**: Check, X, Alert, Info, Loading
- **Navigation**: Arrow, Chevron, Menu, Home
- **Content**: File, Folder, User, Team, Calendar

## Interaction Patterns

### Todo State Transitions
```
Creation: Fade in animation (200ms ease-out)
Completion: Checkbox check animation → strikethrough → opacity reduction
Deletion: Slide out animation (300ms ease-in) → remove from DOM
Reordering: Drag preview with shadow, smooth position transitions
```

### Drag and Drop Considerations
- **Drag Preview**: Slightly transparent, elevated shadow
- **Drop Zones**: Subtle border highlight, background tint
- **Invalid Drop**: Red tint, shake animation for feedback
- **Successful Drop**: Green flash, smooth position animation

### Keyboard Shortcuts
- **Quick Add**: Ctrl/Cmd + N
- **Toggle Complete**: Space or Enter on focused item
- **Delete**: Delete key on focused item
- **Search**: Ctrl/Cmd + K (command palette)

### Loading States
- **Skeleton Loading**: Gray-200 background, subtle shimmer
- **Spinner**: primary-500 color, consistent size
- **Progress Bars**: primary-500 fill, gray-200 background

## Responsive Design Breakpoints

### Breakpoint Strategy
```
Mobile First: Design for 375px minimum
Tablet: 768px+ (iPad portrait)
Desktop: 1024px+ (laptop screens)
Large Desktop: 1280px+ (desktop monitors)
```

### Responsive Patterns
- **Navigation**: Hamburger menu → horizontal nav bar
- **Cards**: Single column → grid layout
- **Sidebar**: Hidden/overlay → persistent sidebar
- **Modals**: Full screen → centered dialog

### Touch Considerations
- **Minimum Touch Target**: 44px (iOS) / 48px (Android)
- **Spacing**: Extra padding on mobile for fat finger tolerance
- **Gestures**: Swipe to complete, long press for context menu

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility, logical tab order
- **Screen Reader Support**: Semantic HTML, ARIA labels, live regions

### Implementation Checklist
- [ ] All interactive elements have focus states
- [ ] Color is not the only way to convey information
- [ ] Images have descriptive alt text
- [ ] Form fields have proper labels
- [ ] Error messages are clearly associated with fields
- [ ] Dynamic content changes are announced to screen readers

### Testing Requirements
- **Automated**: Run axe-core or similar accessibility testing
- **Manual**: Test with keyboard navigation only
- **Screen Reader**: Test with VoiceOver (Mac) or NVDA (Windows)
- **Color Blindness**: Test with color blindness simulators

## Dark Mode Support

### Implementation Strategy
- **CSS Variables**: Color tokens that automatically switch
- **User Preference**: Respect system preference by default
- **Manual Toggle**: User can override system preference
- **Persistence**: Remember user's manual choice

### Dark Mode Palette
```
Background Colors:
- bg-primary: #0f172a (slate-900)
- bg-secondary: #1e293b (slate-800)
- bg-tertiary: #334155 (slate-700)

Text Colors:
- text-primary: #f8fafc (slate-50)
- text-secondary: #cbd5e1 (slate-300)
- text-tertiary: #94a3b8 (slate-400)

Border Colors:
- border-primary: #334155 (slate-700)
- border-secondary: #475569 (slate-600)
```

## Design Tokens Implementation

### CSS Custom Properties
```css
:root {
  /* Colors */
  --color-primary-500: #06b6d4;
  --color-gray-800: #1f2937;
  
  /* Typography */
  --font-family-display: 'Space Grotesk', sans-serif;
  --font-family-body: 'Inter', sans-serif;
  
  /* Spacing */
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  /* Borders */
  --border-radius-md: 0.5rem;
  --border-width-default: 1px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

### Tailwind Configuration
Extend Tailwind's default theme with custom color palette, typography scale, and spacing system to match design tokens.

---

This design system provides a comprehensive foundation for building a cohesive, accessible, and productivity-focused collaborative todo application. All components should be built following these guidelines to ensure consistency and excellent user experience.