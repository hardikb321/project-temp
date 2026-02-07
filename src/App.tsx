import { useState, useRef, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { MyMap, type Marker } from "./components/MyMap";
import { Toolbar } from "./components/Toolbar";
import { AdminPage } from "./pages/AdminPage";
import type { MapRef } from "@/components/ui/map";
import type { WaterType } from "@/types";

const initialMarkersByType: Record<WaterType, Marker[]> = {
  ponds: [],
  river: [],
  lake: [],
};

function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [activeWaterType, setActiveWaterType] = useState<WaterType>("ponds");
  const [markersByType, setMarkersByType] = useState<Record<WaterType, Marker[]>>(initialMarkersByType);

  const markers = markersByType[activeWaterType];

  const setMarkers = useCallback(
    (next: Marker[] | ((prev: Marker[]) => Marker[])) => {
      setMarkersByType((prev) => ({
        ...prev,
        [activeWaterType]: typeof next === "function" ? next(prev[activeWaterType]) : next,
      }));
    },
    [activeWaterType]
  );

  const handleHistoryItemClick = useCallback(
    (markerId: string) => {
      const marker = markers.find((m) => m.id === markerId);
      if (marker && mapRef.current) {
        mapRef.current.flyTo({
          center: [marker.longitude, marker.latitude],
          zoom: 14,
          duration: 1500,
        });
      }
    },
    [markers]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toolbar
        activeWaterType={activeWaterType}
        onWaterTypeChange={setActiveWaterType}
        markerHistory={markers}
        onHistoryItemClick={handleHistoryItemClick}
      />
      <main className="flex-1 p-6">
        <MyMap
          markers={markers}
          onMarkersChange={setMarkers}
          mapRef={mapRef}
          waterType={activeWaterType}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

