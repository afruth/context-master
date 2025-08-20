# Chart Components

This directory contains reusable chart components built with Recharts for data visualization in the Hattrick trading application.

## Components

### Core Charts
- **ProfitTrendChart** - Line chart showing profit trends over time
- **PortfolioCompositionChart** - Pie chart for portfolio breakdown by position
- **PositionPerformanceChart** - Bar chart for position-based performance analysis
- **AgeGroupChart** - Bar chart for age group analysis
- **ProfitDistributionChart** - Small bar chart for profit distribution
- **PlayerValueChart** - Bar chart for player value distribution analysis
- **ProfitLossComparisonChart** - Bar chart comparing profits vs losses

### Container Component
- **ChartContainer** - Wrapper component providing consistent styling, loading states, error handling, and empty states

## Features

- Responsive design that works on mobile and desktop
- Consistent color scheme using CSS variables
- Loading states with spinners
- Error handling with retry options
- Empty states with helpful messages
- Interactive tooltips with detailed information
- Hover effects and smooth animations
- TypeScript support with proper type definitions

## Usage

```tsx
import { ProfitTrendChart } from '@/components/charts'

<ProfitTrendChart
  data={analyticsData?.profitTrends || []}
  loading={loading}
  error={error}
/>
```

## Data Sources

Charts are designed to work with data from the `/api/analytics` endpoint, which provides:
- Monthly profit data
- Position statistics
- Age group statistics
- Profit trends over time
- Summary analytics

## Styling

Charts use the application's design system:
- Tailwind CSS for styling
- CSS variables for theming
- Consistent spacing and typography
- Support for light/dark mode (when implemented)