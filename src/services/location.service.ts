import { apiService } from './api';
import type { Region, City, Zone, PaginationParams, PaginationInfo } from '../types';

export interface RegionResponse {
  data: Region[];
  pagination: PaginationInfo;
}

export interface CityResponse {
  data: (City & { region: { id: string; name: string; code: string } | null })[];
  pagination: PaginationInfo;
}

export interface ZoneResponse {
  data: (Zone & {
    city: {
      id: string;
      name: string;
      code: string;
      region: { id: string; name: string; code: string } | null;
    } | null;
  })[];
  pagination: PaginationInfo;
}

export interface DropdownOption {
  id: string;
  name: string;
  code: string;
}

export interface CreateRegionDto {
  name: string;
  code: string;
}

export interface UpdateRegionDto {
  name?: string;
  code?: string;
}

export interface CreateCityDto {
  regionId: string;
  name: string;
  code: string;
}

export interface UpdateCityDto {
  regionId?: string;
  name?: string;
  code?: string;
}

export interface CreateZoneDto {
  cityId: string;
  name: string;
  code: string;
}

export interface UpdateZoneDto {
  cityId?: string;
  name?: string;
  code?: string;
}

export const locationService = {
  // Regions
  getRegions: async (params?: PaginationParams) => {
    const response = await apiService.getPaginated<Region>('/locations/regions', params);
    return response as unknown as RegionResponse;
  },

  getRegionById: async (id: string) => {
    return apiService.get<Region>(`/locations/regions/${id}`);
  },

  createRegion: async (data: CreateRegionDto) => {
    return apiService.post<Region>('/locations/regions', data);
  },

  updateRegion: async (id: string, data: UpdateRegionDto) => {
    return apiService.put<Region>(`/locations/regions/${id}`, data);
  },

  deleteRegion: async (id: string) => {
    return apiService.delete(`/locations/regions/${id}`);
  },

  getRegionsDropdown: async () => {
    return apiService.get<DropdownOption[]>('/locations/regions/dropdown');
  },

  // Cities
  getCities: async (params?: PaginationParams & { regionId?: string }) => {
    const response = await apiService.getPaginated<City>('/locations/cities', params);
    return response as unknown as CityResponse;
  },

  getCityById: async (id: string) => {
    return apiService.get<City>(`/locations/cities/${id}`);
  },

  createCity: async (data: CreateCityDto) => {
    return apiService.post<City>('/locations/cities', data);
  },

  updateCity: async (id: string, data: UpdateCityDto) => {
    return apiService.put<City>(`/locations/cities/${id}`, data);
  },

  deleteCity: async (id: string) => {
    return apiService.delete(`/locations/cities/${id}`);
  },

  getCitiesDropdown: async (regionId?: string) => {
    return apiService.get<DropdownOption[]>('/locations/cities/dropdown', { regionId });
  },

  // Zones
  getZones: async (params?: PaginationParams & { cityId?: string; regionId?: string }) => {
    const response = await apiService.getPaginated<Zone>('/locations/zones', params);
    return response as unknown as ZoneResponse;
  },

  getZoneById: async (id: string) => {
    return apiService.get<Zone>(`/locations/zones/${id}`);
  },

  createZone: async (data: CreateZoneDto) => {
    return apiService.post<Zone>('/locations/zones', data);
  },

  updateZone: async (id: string, data: UpdateZoneDto) => {
    return apiService.put<Zone>(`/locations/zones/${id}`, data);
  },

  deleteZone: async (id: string) => {
    return apiService.delete(`/locations/zones/${id}`);
  },

  getZonesDropdown: async (cityId?: string) => {
    return apiService.get<DropdownOption[]>('/locations/zones/dropdown', { cityId });
  },
};
