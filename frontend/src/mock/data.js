// src/mock/data.js
// Static mock data — Davis will replace with real API calls

export const mockStats = {
  totalMachines: 8,
  activeBookings: 3,
  utilisation: 42,
  avgWaitTime: 12,
}

export const mockBookings = [
  { id: 'WL-001', user: 'Alice',   machine: 'Washer A2', time: '2025-05-15 14:00', status: 'pending',   cycleType: 'normal'   },
  { id: 'WL-002', user: 'Brian',   machine: 'Dryer B1',  time: '2025-05-15 14:30', status: 'active',    cycleType: 'heavy'    },
  { id: 'WL-003', user: 'Carmen',  machine: 'Washer A1', time: '2025-05-15 15:00', status: 'completed', cycleType: 'delicate' },
  { id: 'WL-004', user: 'Dennis',  machine: 'Washer A3', time: '2025-05-15 15:00', status: 'pending',   cycleType: 'normal'   },
  { id: 'WL-005', user: 'Emily',   machine: 'Dryer B2',  time: '2025-05-15 16:00', status: 'cancelled', cycleType: 'normal'   },
  { id: 'WL-006', user: 'Thabo',   machine: 'Washer A2', time: '2025-05-15 17:00', status: 'active',    cycleType: 'delicate' },
  { id: 'WL-007', user: 'Amara',   machine: 'Dryer B1',  time: '2025-05-15 17:30', status: 'pending',   cycleType: 'heavy'    },
  { id: 'WL-008', user: 'Sipho',   machine: 'Washer A3', time: '2025-05-15 18:00', status: 'completed', cycleType: 'normal'   },
]

export const mockMachines = [
  { id: '1', name: 'Washer A1', location: 'Block A', status: 'available' },
  { id: '2', name: 'Washer A2', location: 'Block A', status: 'in_use',     progress: 28, timeLeft: 22 },
  { id: '3', name: 'Washer A3', location: 'Block A', status: 'available' },
  { id: '4', name: 'Dryer B1',  location: 'Block B', status: 'maintenance' },
  { id: '5', name: 'Dryer B2',  location: 'Block B', status: 'in_use',     progress: 71, timeLeft: 8  },
  { id: '6', name: 'Washer C1', location: 'Block C', status: 'available' },
  { id: '7', name: 'Washer C2', location: 'Block C', status: 'in_use',     progress: 45, timeLeft: 15 },
  { id: '8', name: 'Dryer C1',  location: 'Block C', status: 'maintenance' },
]

export const mockChartData = [
  { hour: '07:00', bookings: 1 },
  { hour: '08:00', bookings: 3 },
  { hour: '09:00', bookings: 5 },
  { hour: '10:00', bookings: 4 },
  { hour: '11:00', bookings: 6 },
  { hour: '12:00', bookings: 8 },
  { hour: '13:00', bookings: 7 },
  { hour: '14:00', bookings: 9 },
  { hour: '15:00', bookings: 6 },
  { hour: '16:00', bookings: 5 },
  { hour: '17:00', bookings: 4 },
  { hour: '18:00', bookings: 3 },
]

export const CYCLE_TYPES = [
  { value: 'normal',   label: 'Normal',   duration: '45 min', desc: 'Everyday laundry'          },
  { value: 'delicate', label: 'Delicate', duration: '60 min', desc: 'Gentle wash for delicates'  },
  { value: 'heavy',    label: 'Heavy',    duration: '30 min', desc: 'Heavy-duty fabrics'         },
]
