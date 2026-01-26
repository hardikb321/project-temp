"use client";

import { useState, useRef, useEffect } from "react";
import { User, X, History, Mail, Phone, Award as IdCard } from "lucide-react";

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

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  userId: string;
}

interface ProfileDropdownProps {
  user: UserProfile;
  history: MarkerHistory[];
}

export function ProfileDropdown({ user, history }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
        aria-label="Profile"
      >
        <User className="h-5 w-5 text-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg">Profile</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Details */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">Water Quality Analyst</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">ID: {user.userId}</span>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Input History</h4>
              <span className="text-xs text-muted-foreground">({history.length} entries)</span>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data points recorded yet
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-muted/50 rounded-md text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>
                        pH: {entry.ph} | Turb: {entry.turbidity} NTU
                      </span>
                      <span>{formatTime(entry.timestamp)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Temp: {entry.temperature}°C | BOD: {entry.bod} mg/L
                      {entry.conductivity !== undefined && ` | Cond: ${entry.conductivity}`}
                      {entry.aod !== undefined && ` | AOD: ${entry.aod}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
