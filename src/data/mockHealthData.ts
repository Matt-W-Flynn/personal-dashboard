interface SleepStage {
  stage: 'awake' | 'light' | 'rem' | 'deep';
  duration_minutes: number;
  start_time: string;
}

interface WorkoutData {
  type: string;
  duration_minutes: number;
  calories_burned: number;
  average_heart_rate: number;
  max_heart_rate: number;
  strain_score: number;
  distance_km?: number;
  date: string;
}

interface BodyMetrics {
  weight_kg: number;
  body_fat_percentage: number;
  muscle_mass_kg: number;
  bone_mass_kg: number;
  water_percentage: number;
  date: string;
}

interface DailyReadiness {
  date: string;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_ms: number;
  sleep_score: number;
  readiness_score: number;
}

interface DailyActivity {
  date: string;
  steps: number;
  active_calories: number;
  total_calories: number;
  floors_climbed: number;
  exercise_minutes: number;
  stand_hours: number;
}

const mockWhoopData = {
  user: {
    id: "user123",
    name: "John Doe",
    joined_date: "2023-01-01",
  },
  daily_readiness: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recovery_score: Math.floor(60 + Math.random() * 40),
    resting_heart_rate: Math.floor(45 + Math.random() * 15),
    hrv_ms: Math.floor(40 + Math.random() * 30),
    sleep_score: Math.floor(70 + Math.random() * 30),
    readiness_score: Math.floor(65 + Math.random() * 35),
  })),
  recent_workouts: [
    {
      type: "Running",
      duration_minutes: 45,
      calories_burned: 520,
      average_heart_rate: 155,
      max_heart_rate: 175,
      strain_score: 15.4,
      distance_km: 7.2,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "Strength Training",
      duration_minutes: 60,
      calories_burned: 450,
      average_heart_rate: 140,
      max_heart_rate: 165,
      strain_score: 14.2,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "Cycling",
      duration_minutes: 90,
      calories_burned: 750,
      average_heart_rate: 145,
      max_heart_rate: 170,
      strain_score: 16.8,
      distance_km: 30,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as WorkoutData[],
  last_sleep: {
    total_sleep_hours: 7.5,
    sleep_score: 85,
    sleep_cycles: 5,
    time_in_bed: 8.2,
    sleep_efficiency: 91,
    stages: [
      {
        stage: "awake",
        duration_minutes: 42,
        start_time: "2023-01-01T23:00:00Z",
      },
      {
        stage: "light",
        duration_minutes: 240,
        start_time: "2023-01-01T23:42:00Z",
      },
      {
        stage: "rem",
        duration_minutes: 108,
        start_time: "2023-01-02T03:42:00Z",
      },
      {
        stage: "deep",
        duration_minutes: 90,
        start_time: "2023-01-02T05:30:00Z",
      },
    ] as SleepStage[],
  },
}

const mockWithingsData = {
  body_metrics: Array.from({ length: 30 }, (_, i) => ({
    weight_kg: 75 + Math.random() * 2 - 1,
    body_fat_percentage: 15 + Math.random() * 2 - 1,
    muscle_mass_kg: 35 + Math.random() * 1 - 0.5,
    bone_mass_kg: 3.2 + Math.random() * 0.2 - 0.1,
    water_percentage: 62 + Math.random() * 2 - 1,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })) as BodyMetrics[],
  blood_pressure: Array.from({ length: 14 }, (_, i) => ({
    systolic: Math.floor(115 + Math.random() * 10),
    diastolic: Math.floor(75 + Math.random() * 8),
    heart_rate: Math.floor(60 + Math.random() * 10),
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  })),
}

const mockAppleHealthData = {
  daily_activity: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    steps: Math.floor(6000 + Math.random() * 6000),
    active_calories: Math.floor(400 + Math.random() * 300),
    total_calories: Math.floor(2000 + Math.random() * 500),
    floors_climbed: Math.floor(8 + Math.random() * 12),
    exercise_minutes: Math.floor(30 + Math.random() * 45),
    stand_hours: Math.floor(10 + Math.random() * 4),
  })) as DailyActivity[],
  heart_rate: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    value: Math.floor(60 + Math.random() * 30),
  })),
  workouts: [
    {
      type: "HIIT",
      duration_minutes: 30,
      calories_burned: 350,
      average_heart_rate: 165,
      max_heart_rate: 185,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "Yoga",
      duration_minutes: 45,
      calories_burned: 180,
      average_heart_rate: 95,
      max_heart_rate: 115,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as WorkoutData[],
}

export { mockWhoopData, mockWithingsData, mockAppleHealthData }
export type { 
  SleepStage, 
  WorkoutData, 
  BodyMetrics, 
  DailyReadiness, 
  DailyActivity 
} 