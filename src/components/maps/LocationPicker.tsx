import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 19.076,
  lng: 72.8777,
};

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
  onAddressChange?: (address: string) => void;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  address,
  onAddressChange,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [mapCenter, setMapCenter] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter
  );
  const [isSearching, setIsSearching] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition({ lat: latitude, lng: longitude });
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        onLocationChange(lat, lng);

        // Reverse geocode to get address
        if (window.google && onAddressChange) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onAddressChange(results[0].formatted_address);
            }
          });
        }
      }
    },
    [onLocationChange, onAddressChange]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !window.google) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: searchQuery }, (results, status) => {
      setIsSearching(false);
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        onLocationChange(lat, lng);

        if (onAddressChange) {
          onAddressChange(results[0].formatted_address);
        }
      }
    });
  }, [searchQuery, onLocationChange, onAddressChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPosition({ lat, lng });
          setMapCenter({ lat, lng });
          onLocationChange(lat, lng);

          // Reverse geocode
          if (window.google && onAddressChange) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                onAddressChange(results[0].formatted_address);
              }
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [onLocationChange, onAddressChange]);

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-yellow-50 text-yellow-800">
          <p className="text-sm font-medium">Google Maps API Key Not Configured</p>
          <p className="text-xs mt-1">
            Add VITE_GOOGLE_MAPS_API_KEY to your environment variables to enable the map interface.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="manual-lat">Latitude</Label>
            <Input
              id="manual-lat"
              type="number"
              step="any"
              value={latitude || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onLocationChange(lat, longitude || 0);
                }
              }}
              placeholder="e.g., 19.0760"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-lng">Longitude</Label>
            <Input
              id="manual-lng"
              type="number"
              step="any"
              value={longitude || ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onLocationChange(latitude || 0, lng);
                }
              }}
              placeholder="e.g., 72.8777"
            />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 text-red-800">
        <p className="text-sm">Failed to load Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-lg bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
        <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable
            onDragEnd={(e) => {
              if (e.latLng) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setMarkerPosition({ lat, lng });
                onLocationChange(lat, lng);

                // Reverse geocode
                if (window.google && onAddressChange) {
                  const geocoder = new window.google.maps.Geocoder();
                  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                      onAddressChange(results[0].formatted_address);
                    }
                  });
                }
              }
            }}
          />
        )}
      </GoogleMap>

      {/* Coordinates Display */}
      {markerPosition && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong>Lat:</strong> {markerPosition.lat.toFixed(6)}
          </span>
          <span>
            <strong>Lng:</strong> {markerPosition.lng.toFixed(6)}
          </span>
        </div>
      )}

      {/* Address from geocoding */}
      {address && (
        <div className="text-sm">
          <span className="text-muted-foreground">Address: </span>
          <span>{address}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Click on the map to select a location, or drag the marker to adjust. You can also search for an address or use your current location.
      </p>
    </div>
  );
}
