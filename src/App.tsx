import { useState, useRef } from "react";
import { MyMap, type Marker } from "./components/MyMap";
import { Toolbar } from "./components/Toolbar";
import type { MapRef } from "@/components/ui/map";

export default function Page() {
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

