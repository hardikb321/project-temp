import { useState, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { MyMap, type Marker } from "./components/MyMap";
import { Toolbar } from "./components/Toolbar";
import { AdminPage } from "./pages/AdminPage";
import type { MapRef } from "@/components/ui/map";

function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const handleHistoryItemClick = (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker && mapRef.current) {
      mapRef.current.flyTo({
        center: [marker.longitude, marker.latitude],
        zoom: 14,
        duration: 1500,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toolbar markerHistory={markers} onHistoryItemClick={handleHistoryItemClick} />
      <main className="flex-1 p-6">
        <MyMap markers={markers} onMarkersChange={setMarkers} mapRef={mapRef} />
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

