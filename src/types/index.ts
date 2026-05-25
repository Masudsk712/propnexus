export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "manager" | "staff" | "tenant";
  phone?: string;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: "apartment" | "house" | "condo" | "commercial" | "townhouse";
  status: "occupied" | "vacant" | "maintenance" | "listed";
  units: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  image: string;
  description?: string;
  amenities?: string[];
  yearBuilt?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  unit: string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "hvac" | "structural" | "appliance" | "pest" | "other";
  priority: "low" | "medium" | "high" | "emergency";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignedTo?: string;
  requestedBy: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  amenityId: string;
  amenityName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  guestCount?: number;
  notes?: string;
}

export interface Amenity {
  id: string;
  propertyId: string;
  name: string;
  type: "gym" | "pool" | "clubhouse" | "bbq" | "playground" | "parking" | "rooftop" | "lounge" | "other";
  description: string;
  capacity: number;
  openTime: string;
  closeTime: string;
  requiresBooking: boolean;
  image: string;
  status: "available" | "maintenance" | "closed";
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  target: string;
  type: "booking" | "maintenance" | "property" | "payment" | "user" | "system";
  createdAt: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  revenueChange: number;
  occupancyChange: number;
  activeMaintenanceRequests: number;
  maintenanceChange: number;
  totalBookings: number;
  bookingChange: number;
  monthlyRevenue: { month: string; revenue: number }[];
  occupancyTrend: { month: string; rate: number }[];
  maintenanceByCategory: { category: string; count: number }[];
  revenueByProperty: { property: string; revenue: number }[];
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: NavItem[];
}