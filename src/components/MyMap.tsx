'use client';



import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import * as turf from "@turf/turf";
import { Map, MapControls, MapMarker, MarkerContent, MapClusterLayer, MapPopup, type MapRef, useMap } from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export type MarkerColor = "red" | "blue" | "yellow" | "green";

export const MARKER_COLORS: { value: MarkerColor; label: string; bgClass: string }[] = [
  { value: "red", label: "Red", bgClass: "bg-red-500" },
  { value: "blue", label: "Blue", bgClass: "bg-blue-500" },
  { value: "yellow", label: "Yellow", bgClass: "bg-yellow-500" },
  { value: "green", label: "Green", bgClass: "bg-green-500" },
];

const MARKER_COLOR_HEX: Record<MarkerColor, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#22c55e",
};

const COLOR_INDEX: Record<MarkerColor, number> = {
  red: 0,
  blue: 1,
  yellow: 2,
  green: 3,
};

const MARKER_COLOR_HEX_ARRAY: [string, string, string, string] = [
  "#ef4444",
  "#3b82f6",
  "#eab308",
  "#22c55e",
];

export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  color?: MarkerColor;
  turbidity: number;
  ph: number;
  temperature: number;
  bod: number;
  conductivity?: number;
  aod?: number;
  timestamp: Date;
}

const ADDITIONAL_PARAMETERS = [
  { key: "conductivity", label: "Conductivity (μS/cm)", placeholder: "e.g., 500" },
  { key: "aod", label: "AOD", placeholder: "e.g., 0.5" },
] as const;

type AdditionalParamKey = typeof ADDITIONAL_PARAMETERS[number]["key"];

const COLORS: MarkerColor[] = ["red", "blue", "yellow", "green"];

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateSampleMarkers(count: number, centerLng: number, centerLat: number): Marker[] {
  const markers: Marker[] = [];
  const spreadLat = 0.4;
  const spreadLng = 0.4;
  for (let i = 0; i < count; i++) {
    const lat = centerLat + randomInRange(-spreadLat, spreadLat);
    const lng = centerLng + randomInRange(-spreadLng, spreadLng);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    markers.push({
      id: `sample-${Date.now()}-${i}`,
      latitude: lat,
      longitude: lng,
      color,
      turbidity: randomInRange(1, 25),
      ph: randomInRange(6, 8.5),
      temperature: randomInRange(15, 32),
      bod: randomInRange(1, 12),
      timestamp: new Date(),
    });
  }
  return markers;
}

interface TempPin {
  latitude: number;
  longitude: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMapClick = (e: any) => {
      // Use right-click (contextmenu) to add a temporary pin
      if (e.preventDefault) e.preventDefault();
      if (e.originalEvent?.preventDefault) e.originalEvent.preventDefault();
      const { lng, lat } = e.lngLat;
      onMapClick(lat, lng);
    };

    map.on("contextmenu", handleMapClick);

    return () => {
      map.off("contextmenu", handleMapClick);
    };
  }, [map, isLoaded, onMapClick]);

  return null;
}

interface MyMapProps {
  markers: Marker[];
  onMarkersChange: (markers: Marker[]) => void;
  mapRef?: React.RefObject<MapRef>;
}

export function MyMap({ markers, onMarkersChange, mapRef: externalMapRef }: MyMapProps) {
  const internalMapRef = useRef<MapRef>(null);
  const mapRef = externalMapRef || internalMapRef;
  const [tempPin, setTempPin] = useState<TempPin | null>(null);
const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [turbidity, setTurbidity] = useState<string>("");
  const [ph, setPh] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [bod, setBod] = useState<string>("");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [markerColor, setMarkerColor] = useState<MarkerColor>("red");
  const [selectedAdditionalParams, setSelectedAdditionalParams] = useState<AdditionalParamKey[]>([]);
  const [conductivity, setConductivity] = useState<string>("");
  const [aod, setAod] = useState<string>("");
  const [selectedClusterPoint, setSelectedClusterPoint] = useState<{
    coordinates: [number, number];
    marker: Marker;
  } | null>(null);
  const [samplePointIds, setSamplePointIds] = useState<Set<string>>(new Set());

  const handleAddSamplePoints = useCallback(() => {
    const centerLng = 77.209;
    const centerLat = 28.614;
    const newMarkers = generateSampleMarkers(50, centerLng, centerLat);
    onMarkersChange([...markers, ...newMarkers]);
    setSamplePointIds((prev) => {
      const next = new Set(prev);
      newMarkers.forEach((m) => next.add(m.id));
      return next;
    });
  }, [markers, onMarkersChange]);

  const handleDeleteSamplePoints = useCallback(() => {
    const idsToRemove = samplePointIds;
    onMarkersChange(markers.filter((m) => !idsToRemove.has(m.id)));
    setSamplePointIds(new Set());
  }, [markers, onMarkersChange, samplePointIds]);

  const markersGeoJSON = React.useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [marker.longitude, marker.latitude],
      },
      properties: {
        id: marker.id,
        color: marker.color ?? "red",
        colorIndex: COLOR_INDEX[marker.color ?? "red"],
        colorHex: MARKER_COLOR_HEX[marker.color ?? "red"],
        turbidity: marker.turbidity,
        ph: marker.ph,
        temperature: marker.temperature,
        bod: marker.bod,
        conductivity: marker.conductivity,
        aod: marker.aod,
        timestamp: marker.timestamp.toISOString(),
      },
    })),
  }), [markers]);

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid latitude and longitude values");
      return;
    }

    if (lat < -90 || lat > 90) {
      alert("Latitude must be between -90 and 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      alert("Longitude must be between -180 and 180");
      return;
    }

    // Enforce minimum 20m distance between points
    const newPoint = turf.point([lng, lat]);
    const tooClose = markers.some((marker) => {
      // When editing, ignore the marker being edited in distance check
      if (editingMarkerId && marker.id === editingMarkerId) return false;
      const existingPoint = turf.point([marker.longitude, marker.latitude]);
      const distanceMeters = turf.distance(newPoint, existingPoint, { units: "meters" });
      return distanceMeters < 20;
    });

    if (tooClose) {
      alert("Points must be at least 20 meters apart. Please choose a different location.");
      return;
    }

const turb = parseFloat(turbidity);
    const phVal = parseFloat(ph);
    const temp = parseFloat(temperature);
    const bodVal = parseFloat(bod);

    if (isNaN(turb) || isNaN(phVal) || isNaN(temp) || isNaN(bodVal)) {
      alert("Please enter valid values for all water quality parameters");
      return;
    }

    // Parse optional parameters
    const condVal = conductivity ? parseFloat(conductivity) : undefined;
    const aodVal = aod ? parseFloat(aod) : undefined;

    if (selectedAdditionalParams.includes("conductivity") && (conductivity === "" || isNaN(condVal!))) {
      alert("Please enter a valid value for Conductivity");
      return;
    }
    if (selectedAdditionalParams.includes("aod") && (aod === "" || isNaN(aodVal!))) {
      alert("Please enter a valid value for AOD");
      return;
    }

    if (editingMarkerId) {
      // Update existing marker
       const updatedMarkers = markers.map(marker => 
         marker.id === editingMarkerId 
           ? { 
               ...marker, 
               latitude: lat, 
               longitude: lng, 
               color: markerColor,
               turbidity: turb, 
               ph: phVal, 
               temperature: temp, 
               bod: bodVal,
               conductivity: condVal,
               aod: aodVal,
             }
           : marker
       );
       onMarkersChange(updatedMarkers);
       setEditingMarkerId(null);
     } else {
       // Add new marker
       const newMarker: Marker = {
         id: Date.now().toString(),
         latitude: lat,
         longitude: lng,
         color: markerColor,
         turbidity: turb,
         ph: phVal,
         temperature: temp,
         bod: bodVal,
         conductivity: condVal,
         aod: aodVal,
         timestamp: new Date(),
       };
       const updatedMarkers = [...markers, newMarker];
       onMarkersChange(updatedMarkers);
     }
    setLatitude("");
    setLongitude("");
    setTurbidity("");
    setPh("");
    setTemperature("");
    setBod("");
    setMarkerColor("red");
    setConductivity("");
    setAod("");
    setSelectedAdditionalParams([]);
    setTempPin(null);
  };

  const handleRemoveMarker = (id: string) => {
    const updatedMarkers = markers.filter((marker) => marker.id !== id);
    onMarkersChange(updatedMarkers);
    if (samplePointIds.has(id)) {
      setSamplePointIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    if (editingMarkerId === id) {
      setEditingMarkerId(null);
      setLatitude("");
      setLongitude("");
      setTurbidity("");
      setPh("");
      setTemperature("");
      setBod("");
      setMarkerColor("red");
      setConductivity("");
      setAod("");
      setSelectedAdditionalParams([]);
    }
    setSelectedClusterPoint(null);
  };

  const handleEditMarker = (marker: Marker) => {
    setEditingMarkerId(marker.id);
    setLatitude(marker.latitude.toString());
    setLongitude(marker.longitude.toString());
    setMarkerColor(marker.color ?? "red");
    setTurbidity(marker.turbidity.toString());
    setPh(marker.ph.toString());
    setTemperature(marker.temperature.toString());
    setBod(marker.bod.toString());
    
    // Set additional params if they exist
    const additionalParams: AdditionalParamKey[] = [];
    if (marker.conductivity !== undefined) {
      additionalParams.push("conductivity");
      setConductivity(marker.conductivity.toString());
    } else {
      setConductivity("");
    }
    if (marker.aod !== undefined) {
      additionalParams.push("aod");
      setAod(marker.aod.toString());
    } else {
      setAod("");
    }
    setSelectedAdditionalParams(additionalParams);
  };

  const handleCancelEdit = () => {
    setEditingMarkerId(null);
    setLatitude("");
    setLongitude("");
    setTurbidity("");
    setPh("");
    setTemperature("");
    setBod("");
    setMarkerColor("red");
    setConductivity("");
    setAod("");
    setSelectedAdditionalParams([]);
    setSelectedClusterPoint(null);
  };

  const toggleAdditionalParam = (paramKey: AdditionalParamKey) => {
    setSelectedAdditionalParams(prev => 
      prev.includes(paramKey) 
        ? prev.filter(p => p !== paramKey)
        : [...prev, paramKey]
    );
  };

  const handleMarkerClick = (marker: Marker) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [marker.longitude, marker.latitude],
        zoom: 14,
        duration: 1500,
      });
    }
  };


  const handleMapClick = useCallback((lat: number, lng: number) => {
    setTempPin({ latitude: lat, longitude: lng });
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setSelectedClusterPoint(null);
  }, []);

  return (
    <div className="flex gap-4 w-full">
      <Card className="flex-1 h-[500px] p-0 overflow-hidden">
        <Map ref={mapRef} center={[77.2090, 28.6139]} zoom={5}>
          <MapControls showLocate={true} />
          <MapClickHandler onMapClick={handleMapClick} />

          {markers.length > 0 && (
            <MapClusterLayer
              data={markersGeoJSON}
              clusterRadius={60}
              clusterMaxZoom={14}
              clusterColorByMajority
              clusterColorMap={MARKER_COLOR_HEX_ARRAY}
              pointColor="#3b82f6"
              pointColorProperty="colorHex"
              onPointClick={(feature, coordinates) => {
                const markerId = feature.properties?.id;
                const marker = markers.find((m) => m.id === markerId);
                if (marker) {
                  setSelectedClusterPoint({ coordinates, marker });
                }
              }}
              onClusterClick={(clusterId, coordinates, pointCount) => {
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: coordinates,
                    zoom: Math.min(mapRef.current.getZoom() + 2, 14),
                    duration: 1000,
                  });
                }
              }}
            />
          )}

          {tempPin && (
            <>
              <MapMarker
                longitude={tempPin.longitude}
                latitude={tempPin.latitude}
              >
                <MarkerContent>
                  <div
                    className="relative h-6 w-6 rounded-full border-2 border-white bg-blue-500 shadow-lg"
                    title="Temporary pin"
                  />
                </MarkerContent>
              </MapMarker>
              <MapPopup
                longitude={tempPin.longitude}
                latitude={tempPin.latitude}
                closeButton={true}
                onClose={() => setTempPin(null)}
              >
                <div className="text-sm">
                  <p className="font-medium mb-1">Coordinates</p>
                  <p className="text-xs">
                    <span className="font-medium">Lat:</span> {tempPin.latitude.toFixed(6)}
                  </p>
                  <p className="text-xs">
                    <span className="font-medium">Lng:</span> {tempPin.longitude.toFixed(6)}
                  </p>
                </div>
              </MapPopup>
            </>
          )}

          {selectedClusterPoint && (
            <MapPopup
              key={`${selectedClusterPoint.coordinates[0]}-${selectedClusterPoint.coordinates[1]}`}
              longitude={selectedClusterPoint.coordinates[0]}
              latitude={selectedClusterPoint.coordinates[1]}
              onClose={() => setSelectedClusterPoint(null)}
              closeOnClick={false}
              focusAfterOpen={false}
              closeButton
            >
              <div className="space-y-2 p-2">
                <p className="text-sm font-semibold">Water Quality Data</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="font-medium">Turbidity:</span>
                    <br />
                    {selectedClusterPoint.marker.turbidity} NTU
                  </div>
                  <div>
                    <span className="font-medium">pH:</span>
                    <br />
                    {selectedClusterPoint.marker.ph}
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span>
                    <br />
                    {selectedClusterPoint.marker.temperature}°C
                  </div>
                  <div>
                    <span className="font-medium">BOD:</span>
                    <br />
                    {selectedClusterPoint.marker.bod} mg/L
                  </div>
                  {selectedClusterPoint.marker.conductivity != null && (
                    <div>
                      <span className="font-medium">Conductivity:</span>
                      <br />
                      {selectedClusterPoint.marker.conductivity} μS/cm
                    </div>
                  )}
                  {selectedClusterPoint.marker.aod != null && (
                    <div>
                      <span className="font-medium">AOD:</span>
                      <br />
                      {selectedClusterPoint.marker.aod}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      handleEditMarker(selectedClusterPoint.marker);
                      setSelectedClusterPoint(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleRemoveMarker(selectedClusterPoint.marker.id);
                      setSelectedClusterPoint(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </MapPopup>
          )}
        </Map>
      </Card>

<Card className="w-96 h-fit">
        <CardHeader>
          <CardTitle>{editingMarkerId ? "Edit Marker" : "Add Marker"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMarker} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-medium">
                  Latitude
                </label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 28.6139"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-medium">
                  Longitude
                </label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 77.2090"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marker color</label>
              <div className="flex gap-2">
                {MARKER_COLORS.map(({ value, label, bgClass }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMarkerColor(value)}
                    className={`h-8 w-8 rounded-full border-2 shadow-sm transition-all ${bgClass} ${
                      markerColor === value ? "border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "border-white hover:scale-105"
                    }`}
                    title={label}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Red, Blue, Yellow, Green</p>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-3 text-muted-foreground">Water Quality Parameters</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="turbidity" className="text-sm font-medium">
                    Turbidity (NTU)
                  </label>
                  <Input
                    id="turbidity"
                    type="number"
                    step="any"
                    placeholder="e.g., 5.2"
                    value={turbidity}
                    onChange={(e) => setTurbidity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ph" className="text-sm font-medium">
                    pH Level
                  </label>
                  <Input
                    id="ph"
                    type="number"
                    step="any"
                    min="0"
                    max="14"
                    placeholder="e.g., 7.0"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="temperature" className="text-sm font-medium">
                    Temperature (°C)
                  </label>
                  <Input
                    id="temperature"
                    type="number"
                    step="any"
                    placeholder="e.g., 25.5"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bod" className="text-sm font-medium">
                    BOD (mg/L)
                  </label>
                  <Input
                    id="bod"
                    type="number"
                    step="any"
                    placeholder="e.g., 3.0"
                    value={bod}
                    onChange={(e) => setBod(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Additional Parameters</p>
                <div className="relative">
                  <select
                    className="appearance-none bg-transparent border border-input rounded-md px-3 py-1.5 pr-8 text-sm cursor-pointer hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleAdditionalParam(e.target.value as AdditionalParamKey);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Add Parameter</option>
                    {ADDITIONAL_PARAMETERS.filter(param => !selectedAdditionalParams.includes(param.key)).map((param) => (
                      <option key={param.key} value={param.key}>
                        {param.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>
              
              {selectedAdditionalParams.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedAdditionalParams.map((paramKey) => {
                    const param = ADDITIONAL_PARAMETERS.find(p => p.key === paramKey);
                    return (
                      <span
                        key={paramKey}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                      >
                        {param?.label.split(" ")[0]}
                        <button
                          type="button"
                          onClick={() => toggleAdditionalParam(paramKey)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3l6 6M9 3l-6 6" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {selectedAdditionalParams.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedAdditionalParams.includes("conductivity") && (
                    <div className="space-y-2">
                      <label htmlFor="conductivity" className="text-sm font-medium">
                        Conductivity (μS/cm)
                      </label>
                      <Input
                        id="conductivity"
                        type="number"
                        step="any"
                        placeholder="e.g., 500"
                        value={conductivity}
                        onChange={(e) => setConductivity(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {selectedAdditionalParams.includes("aod") && (
                    <div className="space-y-2">
                      <label htmlFor="aod" className="text-sm font-medium">
                        AOD
                      </label>
                      <Input
                        id="aod"
                        type="number"
                        step="any"
                        placeholder="e.g., 0.5"
                        value={aod}
                        onChange={(e) => setAod(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingMarkerId ? "Update Marker" : "Add Marker"}
              </Button>
              {editingMarkerId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="bg-transparent">
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Test data</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddSamplePoints}>
                Add 50 random points
              </Button>
              {samplePointIds.size > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={handleDeleteSamplePoints}>
                  Delete sample points ({samplePointIds.size})
                </Button>
              )}
            </div>
          </div>

{markers.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">
                Markers ({markers.length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    className="text-xs p-3 bg-muted rounded space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMarker(marker)}
                          className={`h-6 px-2 ${editingMarkerId === marker.id ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMarker(marker.id)}
                          className="h-6 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <span>Turbidity: {marker.turbidity} NTU</span>
                      <span>pH: {marker.ph}</span>
                      <span>Temp: {marker.temperature}°C</span>
                      <span>BOD: {marker.bod} mg/L</span>
                      {marker.conductivity !== undefined && (
                        <span>Cond: {marker.conductivity} μS/cm</span>
                      )}
                      {marker.aod !== undefined && (
                        <span>AOD: {marker.aod}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
