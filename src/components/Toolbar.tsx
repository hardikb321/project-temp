import { Link } from "react-router-dom";
import { ProfileDropdown } from "./ProfileDropdown";
import type { Marker } from "./MyMap";

type MarkerHistory = Marker;

interface ToolbarProps {
  markerHistory?: MarkerHistory[];
  onHistoryItemClick?: (markerId: string) => void;
}

// Mock user data - replace with actual user data from your auth system
const mockUser = {
  name: "Hardik Sharma",
  email: "hardik.sharma@example.com",
  phone: "+91 98765 43210",
  userId: "WQA-2024-0042",
};

export function Toolbar({ markerHistory = [], onHistoryItemClick }: ToolbarProps) {
  return (
    <header className="w-full border-b border-border bg-card">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-lg">Water Quality Monitor</div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
          <ProfileDropdown user={mockUser} history={markerHistory} onHistoryItemClick={onHistoryItemClick} />
        </div>
      </div>
    </header>
  );
}
