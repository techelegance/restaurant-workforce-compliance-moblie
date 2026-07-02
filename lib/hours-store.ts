import { create } from "zustand";

export type ComplianceStatus = "compliant" | "missing_break" | "overtime" | "day_off";

export interface DayRecord {
  id: string;
  date: string;
  dayLabel: string;
  clockIn: string;
  clockOut: string;
  workedSeconds: number;
  breakSeconds: number;
  overtimeSeconds: number;
  status: ComplianceStatus;
}

export interface WeekSummary {
  label: string;
  startDate: string;
  endDate: string;
  totalWorked: number;
  totalOvertime: number;
  days: DayRecord[];
}

export interface HoursFormValues {
  date: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: string;
}

export type HoursFormErrors = Partial<Record<keyof HoursFormValues, string>>;

export interface ValidationResult {
  valid: boolean;
  errors: HoursFormErrors;
}

interface HoursStore {
  records: DayRecord[];
  validateRecord: (values: HoursFormValues, editingId?: string) => ValidationResult;
  createRecord: (values: HoursFormValues) => ValidationResult;
  updateRecord: (id: string, values: HoursFormValues) => ValidationResult;
  deleteRecord: (id: string) => boolean;
}

const OVERTIME_THRESHOLD = 28800;
const REQUIRED_BREAK_SECONDS = 1800;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toTimeLabel(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = (hour24 % 12 || 12).toString().padStart(2, "0");
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

function parseTimeToMinutes(value: string) {
  const match = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

function getWorkedSeconds(clockIn: string, clockOut: string, breakMinutes: string) {
  const start = parseTimeToMinutes(clockIn);
  const end = parseTimeToMinutes(clockOut);
  const parsedBreakMinutes = Number(breakMinutes);
  if (start === null || end === null || Number.isNaN(parsedBreakMinutes)) return 0;

  const grossMinutes = end > start ? end - start : end + 1440 - start;
  return Math.max(0, Math.round((grossMinutes - parsedBreakMinutes) * 60));
}

function getStatus(workedSeconds: number, breakSeconds: number): ComplianceStatus {
  if (workedSeconds <= 0) return "day_off";
  if (workedSeconds > OVERTIME_THRESHOLD) return "overtime";
  if (workedSeconds >= 21600 && breakSeconds < REQUIRED_BREAK_SECONDS) return "missing_break";
  return "compliant";
}

function buildRecord(values: HoursFormValues, id = `hours-${Date.now()}`): DayRecord {
  const date = new Date(`${values.date}T00:00:00`);
  const workedSeconds = getWorkedSeconds(values.clockIn, values.clockOut, values.breakMinutes);
  const breakSeconds = Math.max(0, Number(values.breakMinutes)) * 60;
  const overtimeSeconds = Math.max(0, workedSeconds - OVERTIME_THRESHOLD);

  return {
    id,
    date: values.date,
    dayLabel: DAY_NAMES[date.getDay()],
    clockIn: toTimeLabel(parseTimeToMinutes(values.clockIn) ?? 0),
    clockOut: toTimeLabel(parseTimeToMinutes(values.clockOut) ?? 0),
    workedSeconds,
    breakSeconds,
    overtimeSeconds,
    status: getStatus(workedSeconds, breakSeconds),
  };
}

function validateValues(
  values: HoursFormValues,
  records: DayRecord[],
  editingId?: string,
): ValidationResult {
  const errors: HoursFormErrors = {};

  if (!isValidDateKey(values.date)) {
    errors.date = "ใช้รูปแบบ YYYY-MM-DD";
  } else if (records.some((record) => record.date === values.date && record.id !== editingId)) {
    errors.date = "วันนี้มี record แล้ว";
  }

  if (parseTimeToMinutes(values.clockIn) === null) {
    errors.clockIn = "ใช้รูปแบบ HH:mm";
  }

  if (parseTimeToMinutes(values.clockOut) === null) {
    errors.clockOut = "ใช้รูปแบบ HH:mm";
  }

  const parsedBreakMinutes = Number(values.breakMinutes);
  if (!Number.isFinite(parsedBreakMinutes) || parsedBreakMinutes < 0) {
    errors.breakMinutes = "ต้องเป็นตัวเลข 0 ขึ้นไป";
  }

  if (!errors.clockIn && !errors.clockOut && !errors.breakMinutes) {
    const workedSeconds = getWorkedSeconds(values.clockIn, values.clockOut, values.breakMinutes);
    if (workedSeconds <= 0) {
      errors.clockOut = "เวลาเลิกงานต้องมากกว่าเวลาพัก";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function makeInitialRecords(): DayRecord[] {
  const today = new Date();
  const values: HoursFormValues[] = [];

  for (let offset = 1; offset <= 5; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    values.push({
      date: toDateKey(date),
      clockIn: offset % 2 === 0 ? "08:30" : "09:00",
      clockOut: offset === 3 ? "18:15" : "17:30",
      breakMinutes: offset === 2 ? "15" : "45",
    });
  }

  return values.map((value, index) => buildRecord(value, `seed-${index}`));
}

export function buildWeeks(records: DayRecord[]): WeekSummary[] {
  const now = new Date();

  return [0, 1, 2].map((weekOffset) => {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() - weekOffset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const days = records
      .filter((record) => {
        const date = new Date(`${record.date}T00:00:00`);
        return date >= start && date <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalWorked = days.reduce((sum, day) => sum + day.workedSeconds, 0);
    const totalOvertime = days.reduce((sum, day) => sum + day.overtimeSeconds, 0);

    const fmt = (date: Date) =>
      `${date.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()]}`;

    return {
      label: weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Last Week" : `${fmt(start)} - ${fmt(end)}`,
      startDate: toDateKey(start),
      endDate: toDateKey(end),
      totalWorked,
      totalOvertime,
      days,
    };
  });
}

export const useHoursStore = create<HoursStore>((set, get) => ({
  records: makeInitialRecords(),
  validateRecord: (values, editingId) => validateValues(values, get().records, editingId),
  createRecord: (values) => {
    const result = validateValues(values, get().records);
    if (!result.valid) return result;

    const record = buildRecord(values);
    set((state) => ({ records: [...state.records, record] }));
    return result;
  },
  updateRecord: (id, values) => {
    const result = validateValues(values, get().records, id);
    if (!result.valid) return result;

    set((state) => ({
      records: state.records.map((record) => (record.id === id ? buildRecord(values, id) : record)),
    }));
    return result;
  },
  deleteRecord: (id) => {
    const exists = get().records.some((record) => record.id === id);
    if (!exists) return false;

    set((state) => ({ records: state.records.filter((record) => record.id !== id) }));
    return true;
  },
}));
