'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Color palette for charts
const COLORS = {
  primary: '#06b6d4', // cyan-500
  secondary: '#8b5cf6', // violet-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
  muted: '#6b7280', // gray-500
  accent: '#ec4899', // pink-500
}

const STATUS_COLORS = {
  todo: COLORS.info,
  'in progress': COLORS.warning,
  completed: COLORS.success,
  cancelled: COLORS.error,
}

const PRIORITY_COLORS = {
  low: COLORS.muted,
  medium: COLORS.info,
  high: COLORS.warning,
  urgent: COLORS.error,
}

interface ChartWrapperProps {
  title: string
  description?: string
  children: React.ReactNode
}

function ChartWrapper({ title, description, children }: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <div>{children}</div>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}${entry.name.includes('Rate') ? '%' : ''}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface TodoStatusChartProps {
  data: Array<{
    name: string
    value: number
    percentage: number
  }>
}

export function TodoStatusChart({ data }: TodoStatusChartProps) {
  return (
    <ChartWrapper title="Task Status Distribution" description="Breakdown of tasks by current status">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS.muted} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ChartWrapper>
  )
}

interface TodoPriorityChartProps {
  data: Array<{
    name: string
    value: number
    percentage: number
  }>
}

export function TodoPriorityChart({ data }: TodoPriorityChartProps) {
  return (
    <ChartWrapper title="Task Priority Distribution" description="Breakdown of tasks by priority level">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill={COLORS.primary}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || COLORS.primary} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  )
}

interface DailyActivityChartProps {
  data: Array<{
    date: string
    todosCompleted: number
    todosCreated: number
  }>
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  return (
    <ChartWrapper title="Daily Activity" description="Tasks created and completed per day">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip 
          content={<CustomTooltip />}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <Legend />
        <Bar dataKey="todosCreated" fill={COLORS.info} name="Created" />
        <Bar dataKey="todosCompleted" fill={COLORS.success} name="Completed" />
      </ComposedChart>
    </ChartWrapper>
  )
}

interface TimeTrackingChartProps {
  data: Array<{
    date: string
    timeSpent: number
    sessions: number
  }>
}

export function TimeTrackingChart({ data }: TimeTrackingChartProps) {
  // Convert seconds to hours for display
  const chartData = data.map(item => ({
    ...item,
    timeSpentHours: Math.round((item.timeSpent / 3600) * 10) / 10,
  }))

  return (
    <ChartWrapper title="Daily Time Tracking" description="Time spent and sessions per day">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
                  <p style={{ color: COLORS.primary }}>
                    Time: {payload.find(p => p.dataKey === 'timeSpentHours')?.value}h
                  </p>
                  <p style={{ color: COLORS.secondary }}>
                    Sessions: {payload.find(p => p.dataKey === 'sessions')?.value}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="timeSpentHours"
          fill={COLORS.primary}
          fillOpacity={0.3}
          stroke={COLORS.primary}
          name="Hours"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sessions"
          stroke={COLORS.secondary}
          strokeWidth={2}
          name="Sessions"
        />
      </ComposedChart>
    </ChartWrapper>
  )
}

interface CategoryChartProps {
  data: Array<{
    name: string
    value: number
    percentage: number
  }>
}

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <ChartWrapper title="Task Categories" description="Top categories by task count">
      <BarChart data={data.slice(0, 8)} layout="horizontal" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill={COLORS.accent} />
      </BarChart>
    </ChartWrapper>
  )
}

interface TeamPerformanceChartProps {
  data: Array<{
    name: string
    completedTodos: number
    timeSpent: number
    completionRate: number
  }>
}

export function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {
  // Convert time from seconds to hours
  const chartData = data.map(item => ({
    ...item,
    timeSpentHours: Math.round((item.timeSpent / 3600) * 10) / 10,
  }))

  return (
    <ChartWrapper title="Team Member Performance" description="Completed tasks and time spent by team member">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p style={{ color: COLORS.success }}>
                    Completed: {payload.find(p => p.dataKey === 'completedTodos')?.value}
                  </p>
                  <p style={{ color: COLORS.primary }}>
                    Time: {payload.find(p => p.dataKey === 'timeSpentHours')?.value}h
                  </p>
                  <p style={{ color: COLORS.warning }}>
                    Rate: {payload.find(p => p.dataKey === 'completionRate')?.value}%
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="completedTodos" fill={COLORS.success} name="Completed Tasks" />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="completionRate" 
          stroke={COLORS.warning} 
          strokeWidth={2}
          name="Completion Rate (%)"
        />
      </ComposedChart>
    </ChartWrapper>
  )
}

interface WorkTypeComparisonChartProps {
  data: Array<{
    type: string
    todos: number
    completed: number
    timeSpent: number
  }>
}

export function WorkTypeComparisonChart({ data }: WorkTypeComparisonChartProps) {
  // Convert time from seconds to hours
  const chartData = data.map(item => ({
    ...item,
    timeSpentHours: Math.round((item.timeSpent / 3600) * 10) / 10,
    completionRate: item.todos > 0 ? Math.round((item.completed / item.todos) * 100) : 0,
  }))

  return (
    <ChartWrapper title="Personal vs Team Work" description="Comparison of personal and team work distribution">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="type" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p style={{ color: COLORS.info }}>Total: {payload.find(p => p.dataKey === 'todos')?.value}</p>
                  <p style={{ color: COLORS.success }}>Completed: {payload.find(p => p.dataKey === 'completed')?.value}</p>
                  <p style={{ color: COLORS.primary }}>Time: {payload.find(p => p.dataKey === 'timeSpentHours')?.value}h</p>
                  <p style={{ color: COLORS.warning }}>Rate: {payload.find(p => p.dataKey === 'completionRate')?.value}%</p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="todos" fill={COLORS.info} name="Total Tasks" />
        <Bar yAxisId="left" dataKey="completed" fill={COLORS.success} name="Completed" />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="completionRate" 
          stroke={COLORS.warning} 
          strokeWidth={2}
          name="Completion Rate (%)"
        />
      </ComposedChart>
    </ChartWrapper>
  )
}

interface TrendChartProps {
  data: Array<{
    date: string
    value: number
    target?: number
  }>
  title: string
  description?: string
  valueKey?: string
  targetKey?: string
  unit?: string
}

export function TrendChart({ 
  data, 
  title, 
  description, 
  valueKey = 'value', 
  targetKey = 'target',
  unit = ''
}: TrendChartProps) {
  return (
    <ChartWrapper title={title} description={description}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
                  {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }}>
                      {`${entry.name}: ${entry.value}${unit}`}
                    </p>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={valueKey} 
          stroke={COLORS.primary} 
          strokeWidth={2}
          name="Actual"
        />
        {data.some(item => item[targetKey as keyof typeof item]) && (
          <Line 
            type="monotone" 
            dataKey={targetKey} 
            stroke={COLORS.muted} 
            strokeWidth={1}
            strokeDasharray="5 5"
            name="Target"
          />
        )}
      </LineChart>
    </ChartWrapper>
  )
}