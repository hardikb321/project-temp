'use client';



import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import { Map, MapControls, MapMarker, MarkerContent, MapPopup, type MapRef, useMap } from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  turbidity: number;
  ph: number;
  temperature: number;
  bod: number;
  conductivity?: number;
  aod?: number;
}

const ADDITIONAL_PARAMETERS = [
  { key: "conductivity", label: "Conductivity (μS/cm)", placeholder: "e.g., 500" },
  { key: "aod", label: "AOD", placeholder: "e.g., 0.5" },
] as const;

type AdditionalParamKey = typeof ADDITIONAL_PARAMETERS[number]["key"];

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

export function MyMap() {
  const mapRef = useRef<MapRef>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [tempPin, setTempPin] = useState<TempPin | null>(null);
const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [turbidity, setTurbidity] = useState<string>("");
  const [ph, setPh] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [bod, setBod] = useState<string>("");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [selectedAdditionalParams, setSelectedAdditionalParams] = useState<AdditionalParamKey[]>([]);
  const [conductivity, setConductivity] = useState<string>("");
  const [aod, setAod] = useState<string>("");

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
      setMarkers(markers.map(marker => 
        marker.id === editingMarkerId 
          ? { 
              ...marker, 
              latitude: lat, 
              longitude: lng, 
              turbidity: turb, 
              ph: phVal, 
              temperature: temp, 
              bod: bodVal,
              conductivity: condVal,
              aod: aodVal,
            }
          : marker
      ));
      setEditingMarkerId(null);
    } else {
      // Add new marker
      const newMarker: Marker = {
        id: Date.now().toString(),
        latitude: lat,
        longitude: lng,
        turbidity: turb,
        ph: phVal,
        temperature: temp,
        bod: bodVal,
        conductivity: condVal,
        aod: aodVal,
      };
      setMarkers([...markers, newMarker]);
    }
    setLatitude("");
    setLongitude("");
    setTurbidity("");
    setPh("");
    setTemperature("");
    setBod("");
    setConductivity("");
    setAod("");
    setSelectedAdditionalParams([]);
  };

const handleRemoveMarker = (id: string) => {
    setMarkers(markers.filter((marker) => marker.id !== id));
    if (editingMarkerId === id) {
      setEditingMarkerId(null);
      setLatitude("");
      setLongitude("");
      setTurbidity("");
      setPh("");
      setTemperature("");
      setBod("");
      setConductivity("");
      setAod("");
      setSelectedAdditionalParams([]);
    }
  };

  const handleEditMarker = (marker: Marker) => {
    setEditingMarkerId(marker.id);
    setLatitude(marker.latitude.toString());
    setLongitude(marker.longitude.toString());
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
    setConductivity("");
    setAod("");
    setSelectedAdditionalParams([]);
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
  }, []);

  return (
    <div className="flex gap-4 w-full">
      <Card className="flex-1 h-[500px] p-0 overflow-hidden">
        <Map ref={mapRef} center={[77.2090, 28.6139]} zoom={5}>
          <MapControls showLocate={true} />
          <MapClickHandler onMapClick={handleMapClick} />
          {markers.map((marker) => (
            <MapMarker
              key={marker.id}
              longitude={marker.longitude}
              latitude={marker.latitude}
              onClick={() => handleMarkerClick(marker)}
            >
              <MarkerContent>
                <div
                  className="relative h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-lg cursor-pointer"
                  title="Click to zoom"
                />
              </MarkerContent>
            </MapMarker>
          ))}
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
