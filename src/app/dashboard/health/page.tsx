'use client'

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { mockWhoopData, mockWithingsData, mockAppleHealthData } from '@/data/mockHealthData'

// Modern Icon Components
const HeartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 13.5L7.33339 13.7073C7.43675 13.7925 7.56325 13.7925 7.66661 13.7073L7.5 13.5ZM1.5 6.5C1.5 8.89077 3.77103 10.5 7.5 13.5L7.66661 13.2927C3.89563 10.2599 1.75 8.77589 1.75 6.5H1.5ZM7.5 13.5C11.229 10.5 13.5 8.89077 13.5 6.5H13.25C13.25 8.77589 11.1044 10.2599 7.33339 13.2927L7.5 13.5ZM13.5 6.5C13.5 4.01472 11.4853 2 9 2V2.25C11.3472 2.25 13.25 4.15279 13.25 6.5H13.5ZM9 2C7.55154 2 6.21137 2.71683 5.35821 3.81573L5.54894 3.96762C6.35757 2.92287 7.62838 2.25 9 2.25V2ZM5.35821 3.81573C4.07474 2.16537 1.5 3.00393 1.5 6.5H1.75C1.75 3.16893 4.17527 2.53955 5.54894 3.96762L5.35821 3.81573Z"
      fill="currentColor"
    />
  </svg>
)

const BedIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.5 0.5C4.22386 0.5 4 0.723858 4 1V3C4 3.27614 4.22386 3.5 4.5 3.5H10.5C10.7761 3.5 11 3.27614 11 3V1C11 0.723858 10.7761 0.5 10.5 0.5H4.5ZM4.5 4.5C4.22386 4.5 4 4.72386 4 5V7C4 7.27614 4.22386 7.5 4.5 7.5H10.5C10.7761 7.5 11 7.27614 11 7V5C11 4.72386 10.7761 4.5 10.5 4.5H4.5ZM2 8.5C1.72386 8.5 1.5 8.72386 1.5 9V13C1.5 13.2761 1.72386 13.5 2 13.5H13C13.2761 13.5 13.5 13.2761 13.5 13V9C13.5 8.72386 13.2761 8.5 13 8.5H2Z"
      fill="currentColor"
    />
  </svg>
)

const RunningIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0ZM6.99663 3.75C7.41671 3.75 7.74663 4.07992 7.74663 4.5C7.74663 4.92008 7.41671 5.25 6.99663 5.25C6.57655 5.25 6.24663 4.92008 6.24663 4.5C6.24663 4.07992 6.57655 3.75 6.99663 3.75ZM8.49663 11.25H6.49663V6.75H5.24663V5.25H7.74663V9.75H8.49663V11.25Z"
      fill="currentColor"
    />
  </svg>
)

const COLORS = ['#45836E', '#D8D8D0', '#FF6B5E', '#2A2A2A', '#F9F9F6']

export default function HealthPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'fitness' | 'sleep' | 'body'>('overview')
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M'>('1W')

  return (
    <main className="p-8 space-y-8 bg-brand-background min-h-screen">
      <div className="flex items-center justify-between border-b border-brand-stone/20 pb-4">
        <h1 className="text-3xl font-bold text-brand-text tracking-tight">Health & Wellness</h1>
        <div className="text-sm font-medium text-brand-stone bg-brand-text/5 px-3 py-1 rounded-full">
          Last synced: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-4 border-b border-brand-stone/20">
        {(['overview', 'fitness', 'sleep', 'body'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-[2px] ${
              activeSection === section
                ? 'border-brand-green text-brand-text'
                : 'border-transparent text-brand-stone hover:text-brand-text'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Time Range Selection */}
      <div className="flex justify-end space-x-2">
        {(['1D', '1W', '1M', '3M'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-brand-text text-brand-background'
                : 'text-brand-text bg-brand-text/5 hover:bg-brand-text/10'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="space-y-8">
        {activeSection === 'overview' && (
          <>
            {/* Daily Scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recovery Score */}
              <div className="bg-brand-text rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HeartIcon className="w-5 h-5 text-brand-green" />
                  <div>
                    <h3 className="text-lg font-bold text-brand-background">Recovery</h3>
                    <p className="text-sm text-brand-background/70">Today's readiness</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-brand-green">
                    {mockWhoopData.daily_readiness[0].recovery_score}%
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Resting HR</span>
                      <span className="font-medium text-brand-background">
                        {mockWhoopData.daily_readiness[0].resting_heart_rate} bpm
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">HRV</span>
                      <span className="font-medium text-brand-background">
                        {mockWhoopData.daily_readiness[0].hrv_ms} ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sleep Score */}
              <div className="bg-brand-text rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BedIcon className="w-5 h-5 text-brand-green" />
                  <div>
                    <h3 className="text-lg font-bold text-brand-background">Sleep</h3>
                    <p className="text-sm text-brand-background/70">Last night</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-brand-green">
                    {mockWhoopData.last_sleep.sleep_score}%
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Total Sleep</span>
                      <span className="font-medium text-brand-background">
                        {mockWhoopData.last_sleep.total_sleep_hours}h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Efficiency</span>
                      <span className="font-medium text-brand-background">
                        {mockWhoopData.last_sleep.sleep_efficiency}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Score */}
              <div className="bg-brand-text rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RunningIcon className="w-5 h-5 text-brand-green" />
                  <div>
                    <h3 className="text-lg font-bold text-brand-background">Activity</h3>
                    <p className="text-sm text-brand-background/70">Today's progress</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-brand-green">
                    {mockAppleHealthData.daily_activity[0].exercise_minutes} min
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Steps</span>
                      <span className="font-medium text-brand-background">
                        {mockAppleHealthData.daily_activity[0].steps.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Calories</span>
                      <span className="font-medium text-brand-background">
                        {mockAppleHealthData.daily_activity[0].active_calories} kcal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recovery Trend */}
              <div className="bg-brand-text rounded-lg p-6">
                <h3 className="text-lg font-bold text-brand-background mb-4">Recovery Trend</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={mockWhoopData.daily_readiness}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#D8D8D0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#2A2A2A"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                      />
                      <YAxis stroke="#2A2A2A" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#F9F9F6',
                          border: '1px solid #D8D8D0',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="recovery_score"
                        stroke="#45836E"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Body Metrics */}
              <div className="bg-brand-text rounded-lg p-6">
                <h3 className="text-lg font-bold text-brand-background mb-4">Body Composition</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={mockWithingsData.body_metrics}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#D8D8D0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#2A2A2A"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                      />
                      <YAxis stroke="#2A2A2A" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#F9F9F6',
                          border: '1px solid #D8D8D0',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight_kg"
                        stroke="#45836E"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="body_fat_percentage"
                        stroke="#FF6B5E"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="bg-brand-text rounded-lg p-6">
              <h3 className="text-lg font-bold text-brand-background mb-4">Recent Workouts</h3>
              <div className="space-y-4">
                {[...mockWhoopData.recent_workouts, ...mockAppleHealthData.workouts]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((workout, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-brand-background/5 hover:bg-brand-background/10 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-brand-background">{workout.type}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-brand-background/70">
                            {new Date(workout.date).toLocaleDateString()}
                          </p>
                          <span className="text-xs text-brand-background/70">•</span>
                          <p className="text-xs text-brand-background/70">
                            {workout.duration_minutes} min
                          </p>
                          {workout.distance_km && (
                            <>
                              <span className="text-xs text-brand-background/70">•</span>
                              <p className="text-xs text-brand-background/70">
                                {workout.distance_km} km
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-brand-background">
                          {workout.calories_burned} kcal
                        </p>
                        <p className="text-xs text-brand-background/70">
                          {workout.average_heart_rate} bpm avg
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'fitness' && (
          <div className="text-brand-text">
            Fitness section content will go here...
          </div>
        )}

        {activeSection === 'sleep' && (
          <div className="text-brand-text">
            Sleep section content will go here...
          </div>
        )}

        {activeSection === 'body' && (
          <div className="text-brand-text">
            Body metrics section content will go here...
          </div>
        )}
      </div>
    </main>
  )
} 