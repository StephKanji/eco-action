'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  radius: number
  onChange: (lat: number, lng: number) => void
  onRadiusChange: (radius: number) => void
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({
  lat, lng, radius, onChange, onRadiusChange
}: LocationPickerProps) {
  const center: [number, number] = lat && lng ? [lat, lng] : [-1.2921, 36.8219]

  // Strict Mode mounts this component twice in dev; rendering MapContainer
  // only after a real, settled mount avoids Leaflet initializing against
  // a DOM node that gets torn down by the phantom first mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-3">
      <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
        {mounted ? (
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
            <ClickHandler onChange={onChange} />
            {lat && lng && (
              <>
                <Marker position={[lat, lng]} icon={icon} />
                <Circle
                  center={[lat, lng]}
                  radius={radius * 1000}
                  pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.1 }}
                />
              </>
            )}
          </MapContainer>
        ) : (
          <div className="h-full w-full bg-gray-100 animate-pulse" />
        )}
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Radius: {radius} km
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={radius}
          onChange={e => onRadiusChange(parseFloat(e.target.value))}
          className="w-full accent-green-600"
        />
      </div>
      {lat && lng && (
        <p className="text-xs text-gray-400">
          📍 {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
      {!lat && !lng && (
        <p className="text-xs text-gray-400">Click on the map to set a location</p>
      )}
    </div>
  )
}