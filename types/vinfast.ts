// Shared TypeScript Types cho VinFast Website
// Mirror với CarWebsiteVMWARE/src/types/vinfast.ts

export type CarSegment = 'all' | 'urban' | 'suv' | 'luxury' | 'commercial';

export interface IVinFastCar {
  id: string;
  name: string;
  slug: string;
  segment: CarSegment;
  segmentLabel: string;
  tagline: string;
  description: string;
  priceWithBattery: number;
  priceWithoutBattery: number;
  batteryRentMonthly?: number;
  rangePerCharge: string;
  maxPower: string;
  maxTorque: string;
  topSpeed: string;
  seats: number;
  airbags: number;
  fastChargingTime: string;
  dimensions: string;
  wheelbase: string;
  imageUrl: string;
  badge?: string;
  features: string[];
  depositUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IVinFastMotorbike {
  id: string;
  name: string;
  slug: string;
  price: number;
  rangePerCharge: string;
  topSpeed: string;
  batteryType: string;
  chargingTime: string;
  trunkCapacity: string;
  imageUrl: string;
  tagline: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IBannerSpec {
  label: string;
  value: string;
}

export interface IBannerItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  carImageUrl: string;
  badge?: string;
  price?: string;
  specs?: IBannerSpec[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IEcosystemItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  imageUrl: string;
  actionText: string;
  actionLink: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPromotionItem {
  id: string;
  title: string;
  highlight: string;
  description: string;
  tag: string;
  validUntil: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}
