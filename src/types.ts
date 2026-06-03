/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Teacher {
  teacher_id: string; // unique ID
  teacher_name: string;
  department: string;
}

export type ShiftType = 'Morning' | 'Afternoon' | 'Evening';

export interface AttendanceRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  department: string;
  shift: string; // e.g., 'ព្រឹក (Morning)', 'រសៀល (Afternoon)', 'យប់ (Evening)'
  check_in_time: string; // ISO String
  check_out_time: string | null; // ISO String or null
  signature: string; // Base64 image data of the signature
}
