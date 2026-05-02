// Resource 1: individual workout sessions
export const mockWorkouts = [
  { date: '2024-01-02', type: 'Running',  duration: 42, calories: 385, distance: 5.8, heartRate: 148, effort: 'moderate' },
  { date: '2024-01-04', type: 'Cycling',  duration: 60, calories: 520, distance: 22.4,heartRate: 142, effort: 'easy'     },
  { date: '2024-01-06', type: 'Running',  duration: 35, calories: 310, distance: 4.5, heartRate: 162, effort: 'hard'     },
  { date: '2024-01-08', type: 'Yoga',     duration: 50, calories: 180, distance: 0,   heartRate:  95, effort: 'easy'     },
  { date: '2024-01-10', type: 'HIIT',     duration: 30, calories: 420, distance: 0,   heartRate: 172, effort: 'hard'     },
  { date: '2024-01-12', type: 'Swimming', duration: 45, calories: 450, distance: 1.8, heartRate: 138, effort: 'moderate' },
  { date: '2024-01-14', type: 'Running',  duration: 55, calories: 495, distance: 7.2, heartRate: 155, effort: 'moderate' },
  { date: '2024-01-16', type: 'Weights',  duration: 65, calories: 380, distance: 0,   heartRate: 128, effort: 'hard'     },
  { date: '2024-01-18', type: 'Cycling',  duration: 45, calories: 390, distance: 17.5,heartRate: 135, effort: 'easy'     },
  { date: '2024-01-20', type: 'Running',  duration: 38, calories: 340, distance: 5.0, heartRate: 158, effort: 'moderate' },
  { date: '2024-01-22', type: 'HIIT',     duration: 25, calories: 350, distance: 0,   heartRate: 178, effort: 'hard'     },
  { date: '2024-01-24', type: 'Swimming', duration: 40, calories: 400, distance: 1.5, heartRate: 132, effort: 'moderate' },
  { date: '2024-01-26', type: 'Yoga',     duration: 60, calories: 210, distance: 0,   heartRate:  88, effort: 'easy'     },
  { date: '2024-01-28', type: 'Running',  duration: 48, calories: 430, distance: 6.5, heartRate: 152, effort: 'moderate' },
  { date: '2024-01-30', type: 'Weights',  duration: 70, calories: 410, distance: 0,   heartRate: 122, effort: 'hard'     },
];

// Resource 2: weekly goals vs actuals
export const mockGoals = [
  { goal: 'Weekly Workouts',  target: 5,   actual: 4,    unit: 'sessions' },
  { goal: 'Total Calories',   target: 2500, actual: 2180, unit: 'kcal'    },
  { goal: 'Running Distance', target: 20,  actual: 17.5, unit: 'km'      },
  { goal: 'Active Minutes',   target: 300, actual: 265,  unit: 'min'     },
  { goal: 'Avg Heart Rate',   target: 140, actual: 137,  unit: 'bpm'     },
];

// Resource 3: daily nutrition log — joinable with workouts on `date`
export const mockNutrition = [
  { date: '2024-01-02', calories: 2100, protein: 148, carbs: 245, fat: 68,  water: 2.4 },
  { date: '2024-01-04', calories: 2350, protein: 162, carbs: 290, fat: 72,  water: 2.8 },
  { date: '2024-01-06', calories: 1980, protein: 135, carbs: 220, fat: 65,  water: 2.1 },
  { date: '2024-01-08', calories: 2200, protein: 155, carbs: 260, fat: 70,  water: 2.6 },
  { date: '2024-01-10', calories: 2450, protein: 170, carbs: 310, fat: 75,  water: 3.0 },
  { date: '2024-01-12', calories: 2050, protein: 140, carbs: 235, fat: 66,  water: 2.5 },
  { date: '2024-01-14', calories: 2300, protein: 158, carbs: 275, fat: 71,  water: 2.7 },
  { date: '2024-01-16', calories: 2180, protein: 168, carbs: 240, fat: 69,  water: 2.3 },
  { date: '2024-01-18', calories: 2280, protein: 152, carbs: 268, fat: 73,  water: 2.9 },
  { date: '2024-01-20', calories: 2020, protein: 138, carbs: 225, fat: 64,  water: 2.2 },
  { date: '2024-01-22', calories: 2400, protein: 175, carbs: 295, fat: 78,  water: 3.1 },
  { date: '2024-01-24', calories: 2150, protein: 145, carbs: 250, fat: 67,  water: 2.6 },
  { date: '2024-01-26', calories: 1900, protein: 128, carbs: 215, fat: 62,  water: 2.0 },
  { date: '2024-01-28', calories: 2320, protein: 160, carbs: 278, fat: 74,  water: 2.8 },
  { date: '2024-01-30', calories: 2260, protein: 165, carbs: 255, fat: 72,  water: 2.5 },
];

// Resource 4: biometrics (body measurements over time)
export const mockBiometrics = [
  { date: '2024-01-01', weight: 78.5, bodyFat: 18.2, muscleMass: 61.2, restingHR: 62, sleepHours: 7.2, hrv: 58 },
  { date: '2024-01-08', weight: 78.1, bodyFat: 17.9, muscleMass: 61.4, restingHR: 61, sleepHours: 7.5, hrv: 61 },
  { date: '2024-01-15', weight: 77.8, bodyFat: 17.6, muscleMass: 61.7, restingHR: 60, sleepHours: 7.1, hrv: 63 },
  { date: '2024-01-22', weight: 77.4, bodyFat: 17.2, muscleMass: 62.0, restingHR: 59, sleepHours: 7.8, hrv: 65 },
  { date: '2024-01-29', weight: 77.2, bodyFat: 17.0, muscleMass: 62.2, restingHR: 58, sleepHours: 7.6, hrv: 67 },
];
