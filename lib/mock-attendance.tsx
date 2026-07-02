import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ClockStatus = "not_clocked_in" | "clocked_in" | "on_break";

export interface CompletedShift {
  employeeName: string;
  clockInTime: string;
  clockOutTime: string;
  totalBreakSeconds: number;
  unpaidBreakSeconds: number;
}

interface MockAttendanceState {
  status: ClockStatus;
  clockInTime: Date | null;
  breakStartTime: Date | null;
  totalBreakSeconds: number;
  lastShift: CompletedShift | null;
  clockIn: () => void;
  startBreak: () => void;
  endBreak: () => void;
  clockOut: () => CompletedShift | null;
  resetDemo: () => void;
}

const MockAttendanceContext = createContext<MockAttendanceState | null>(null);

function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export function MockAttendanceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ClockStatus>("not_clocked_in");
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [totalBreakSeconds, setTotalBreakSeconds] = useState(0);
  const [lastShift, setLastShift] = useState<CompletedShift | null>(null);

  const clockIn = useCallback(() => {
    setStatus("clocked_in");
    setClockInTime(new Date());
    setBreakStartTime(null);
    setTotalBreakSeconds(0);
  }, []);

  const startBreak = useCallback(() => {
    if (!clockInTime || status !== "clocked_in") return;
    setStatus("on_break");
    setBreakStartTime(new Date());
  }, [clockInTime, status]);

  const endBreak = useCallback(() => {
    if (!breakStartTime) return;
    setTotalBreakSeconds((current) => current + secondsBetween(breakStartTime, new Date()));
    setBreakStartTime(null);
    setStatus("clocked_in");
  }, [breakStartTime]);

  const clockOut = useCallback(() => {
    if (!clockInTime) return null;

    const now = new Date();
    const finalBreakSeconds = breakStartTime
      ? totalBreakSeconds + secondsBetween(breakStartTime, now)
      : totalBreakSeconds;

    const shift: CompletedShift = {
      employeeName: "John",
      clockInTime: clockInTime.toISOString(),
      clockOutTime: now.toISOString(),
      totalBreakSeconds: finalBreakSeconds,
      unpaidBreakSeconds: Math.min(finalBreakSeconds, 1800),
    };

    setLastShift(shift);
    setStatus("not_clocked_in");
    setClockInTime(null);
    setBreakStartTime(null);
    setTotalBreakSeconds(0);
    return shift;
  }, [breakStartTime, clockInTime, totalBreakSeconds]);

  const resetDemo = useCallback(() => {
    setStatus("not_clocked_in");
    setClockInTime(null);
    setBreakStartTime(null);
    setTotalBreakSeconds(0);
    setLastShift(null);
  }, []);

  const value = useMemo(
    () => ({
      status,
      clockInTime,
      breakStartTime,
      totalBreakSeconds,
      lastShift,
      clockIn,
      startBreak,
      endBreak,
      clockOut,
      resetDemo,
    }),
    [
      breakStartTime,
      clockIn,
      clockInTime,
      clockOut,
      endBreak,
      lastShift,
      resetDemo,
      startBreak,
      status,
      totalBreakSeconds,
    ],
  );

  return (
    <MockAttendanceContext.Provider value={value}>
      {children}
    </MockAttendanceContext.Provider>
  );
}

export function useMockAttendance() {
  const context = useContext(MockAttendanceContext);
  if (!context) {
    throw new Error("useMockAttendance must be used within MockAttendanceProvider");
  }
  return context;
}
