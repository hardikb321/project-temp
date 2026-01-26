import { ProfileDropdown } from "./ProfileDropdown";

interface MarkerHistory {
  id: string;
  latitude: number;
  longitude: number;
  turbidity: number;
  ph: number;
  temperature: number;
  bod: number;
  conductivity?: number;
  aod?: number;
  timestamp: Date;
}

interface ToolbarProps {
  markerHistory?: MarkerHistory[];
}

// Mock user data - replace with actual user data from your auth system
const mockUser = {
  name: "Hardik Sharma",
  email: "hardik.sharma@example.com",
  phone: "+91 98765 43210",
  userId: "WQA-2024-0042",
};

export function Toolbar({ markerHistory = [] }: ToolbarProps) {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-lg">Water Quality Monitor</div>
        </div>
        
        <div className="flex items-center gap-4">
          <ProfileDropdown user={mockUser} history={markerHistory} />
        </div>
      </div>
    </header>
  );
}
