import { mockWhoopData, mockAppleHealthData } from '@/data/mockHealthData'
import { motion } from 'framer-motion'

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

export default function HealthMetrics() {
  const todayReadiness = mockWhoopData.daily_readiness[0]
  const todayActivity = mockAppleHealthData.daily_activity[0]
  const CALORIE_GOAL = 2500 // Example goal, should come from user settings

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="col-span-full md:col-span-2"
    >
      <div className="rounded-2xl bg-brand-stone p-6 shadow-lg transition-all hover:shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-brand-text">Health Overview</h2>
          <p className="text-sm text-brand-text/70">Today's wellness metrics</p>
        </div>

        <div className="space-y-8">
          {/* Recovery Score */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recovery Score</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors">
                <p className="text-sm text-brand-text/60">Today's Score</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{todayReadiness.recovery_score}%</p>
                  <p className={`text-sm font-medium pb-1 ${
                    todayReadiness.recovery_score >= 66 ? 'text-brand-green' : 
                    todayReadiness.recovery_score >= 33 ? 'text-brand-stone' : 
                    'text-brand-coral'
                  }`}>
                    {todayReadiness.recovery_score >= 66 ? 'Optimal' : 
                     todayReadiness.recovery_score >= 33 ? 'Moderate' : 
                     'Low'}
                  </p>
                </div>
              </div>

              <div className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors">
                <p className="text-sm text-brand-text/60">Sleep Quality</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{mockWhoopData.last_sleep.sleep_score}%</p>
                  <p className={`text-sm font-medium pb-1 ${
                    mockWhoopData.last_sleep.sleep_score >= 85 ? 'text-brand-green' : 
                    mockWhoopData.last_sleep.sleep_score >= 70 ? 'text-brand-stone' : 
                    'text-brand-coral'
                  }`}>
                    {mockWhoopData.last_sleep.sleep_score >= 85 ? 'Excellent' : 
                     mockWhoopData.last_sleep.sleep_score >= 70 ? 'Good' : 
                     'Poor'}
                  </p>
                </div>
              </div>

              <div className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors">
                <p className="text-sm text-brand-text/60">HRV</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{todayReadiness.hrv_ms}ms</p>
                  <p className={`text-sm font-medium pb-1 ${
                    todayReadiness.hrv_ms >= 50 ? 'text-brand-green' : 'text-brand-coral'
                  }`}>
                    {todayReadiness.hrv_ms >= 50 ? 'Above' : 'Below'} Baseline
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Daily Activity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors">
                <p className="text-sm text-brand-text/60">Steps</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{todayActivity.steps.toLocaleString()}</p>
                  <p className={`text-sm font-medium pb-1 ${
                    todayActivity.steps >= 10000 ? 'text-brand-green' : 
                    todayActivity.steps >= 7500 ? 'text-brand-stone' : 
                    'text-brand-coral'
                  }`}>
                    {todayActivity.steps >= 10000 ? 'Goal Met' : 
                     todayActivity.steps >= 7500 ? 'Almost There' : 
                     'Below Goal'}
                  </p>
                </div>
              </div>

              <div className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors">
                <p className="text-sm text-brand-text/60">Active Minutes</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{todayActivity.exercise_minutes}</p>
                  <p className={`text-sm font-medium pb-1 ${
                    todayActivity.exercise_minutes >= 30 ? 'text-brand-green' : 
                    todayActivity.exercise_minutes >= 20 ? 'text-brand-stone' : 
                    'text-brand-coral'
                  }`}>
                    {todayActivity.exercise_minutes >= 30 ? 'Goal Met' : 
                     todayActivity.exercise_minutes >= 20 ? 'Almost There' : 
                     'Below Goal'}
                  </p>
                </div>
              </div>

              <div className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors">
                <p className="text-sm text-brand-text/60">Calories Burned</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-bold">{todayActivity.total_calories}</p>
                  <p className={`text-sm font-medium pb-1 ${
                    todayActivity.total_calories >= CALORIE_GOAL ? 'text-brand-green' : 
                    todayActivity.total_calories >= CALORIE_GOAL * 0.8 ? 'text-brand-stone' : 
                    'text-brand-coral'
                  }`}>
                    {todayActivity.total_calories >= CALORIE_GOAL ? 'Goal Met' : 
                     todayActivity.total_calories >= CALORIE_GOAL * 0.8 ? 'Almost There' : 
                     'Below Goal'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 