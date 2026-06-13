/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Users, 
  Search, 
  FileDown, 
  FileText,
  Printer, 
  Trash2, 
  LogOut, 
  LogIn, 
  BookOpen, 
  Award,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { Teacher, AttendanceRecord } from './types';
import SignaturePad from './components/SignaturePad';

// LocalStorage Keys
const TEACHERS_STORAGE_KEY = 'teacher_attendance_teachers';
const RECORDS_STORAGE_KEY = 'teacher_attendance_records';

// Pre-populated Teachers for Khmer environment authenticity
const INITIAL_TEACHERS: Teacher[] = [
  { teacher_id: 'TCH-001', teacher_name: 'លោកគ្រូ គឹម សេង', department: 'ដេប៉ាតឺម៉ង់ ព័ត៌មានវិទ្យា' },
  { teacher_id: 'TCH-002', teacher_name: 'អ្នកគ្រូ ចាន់ ស្រីនី', department: 'ដេប៉ាតឺម៉ង់ ភាសាបរទេស' },
  { teacher_id: 'TCH-003', teacher_name: 'លោកគ្រូ សុខ ជា', department: 'ដេប៉ាតឺម៉ង់ វិទ្យាសាស្ត្រ' },
  { teacher_id: 'TCH-004', teacher_name: 'អ្នកគ្រូ សុភ័ក្រ ទេវី', department: 'ដេប៉ាតឺម៉ង់ គណិតវិទ្យា' }
];

// Pre-populated Attendance records for preview demonstration
const getMockRecords = (teachers: Teacher[]): AttendanceRecord[] => {
  const today = new Date();
  
  // Create ISO strings for today at specific times
  const timeStr = (hours: number, minutes: number) => {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Helper mock base64 transparent tiny signature line to look authentic
  const mockSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAeCAYAAADuC6A5AAAABmJLR0QA/wD/AP+gvaeTAAAAZElEQVRoge3PsQ0AIAwEsf9PzMAUijRB29yViLu7e3f8uRcgDJEGSIOkAdIgaYA0SBogDZIbSBogDZIbSAOkQdIAaZA0SBogDZIbSAOkQdIAaZA0QA65N0AaJA2QBkmDpwFiyAc7rCkB0b0eLwAAAABJRU5ErkJggg==';

  return [
    {
      id: 'REC-101',
      teacher_id: teachers[0].teacher_id,
      teacher_name: teachers[0].teacher_name,
      department: teachers[0].department,
      shift: 'ព្រឹក (Morning)',
      check_in_time: timeStr(7, 5),
      check_out_time: timeStr(11, 2),
      signature: mockSig
    },
    {
      id: 'REC-102',
      teacher_id: teachers[1].teacher_id,
      teacher_name: teachers[1].teacher_name,
      department: teachers[1].department,
      shift: 'រសៀល (Afternoon)',
      check_in_time: timeStr(13, 0),
      check_out_time: null, // Active
      signature: mockSig
    },
    {
      id: 'REC-103',
      teacher_id: teachers[2].teacher_id,
      teacher_name: teachers[2].teacher_name,
      department: teachers[2].department,
      shift: 'ព្រឹក (Morning)',
      check_in_time: timeStr(7, 12),
      check_out_time: timeStr(11, 0),
      signature: mockSig
    }
  ];
};

export default function App() {
  // -------------------------------------------------------------
  // Khmer OS Font Selector State
  // -------------------------------------------------------------
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem('teacher_attendance_font') || 'font-khmer-os-battambang';
  });

  useEffect(() => {
    localStorage.setItem('teacher_attendance_font', selectedFont);
  }, [selectedFont]);

  // -------------------------------------------------------------
  // Khmer OS Font Sizing State
  // -------------------------------------------------------------
  const [selectedFontSize, setSelectedFontSize] = useState<string>(() => {
    return localStorage.getItem('teacher_attendance_font_size') || 'khmer-size-12';
  });

  useEffect(() => {
    localStorage.setItem('teacher_attendance_font_size', selectedFontSize);
  }, [selectedFontSize]);

  // -------------------------------------------------------------
  // Dynamic Live Clock & Date States
  // -------------------------------------------------------------
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Khmer Dates
  const getKhmerDateString = (date: Date) => {
    const days = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const months = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    return `ថ្ងៃ${days[date.getDay()]} ទី${date.getDate()} ខែ${months[date.getMonth()]} ឆ្នាំ${date.getFullYear()}`;
  };

  // Format Custom YYYY-MM-DD strings to beautiful Khmer dates
  const getKhmerDateStringForCustom = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const days = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
      const months = [
        'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 
        'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
      ];
      const d = new Date(year, month, day);
      return `ថ្ងៃ${days[d.getDay()]} ទី${toKhmerNum(day)} ខែ${months[month]} ឆ្នាំ${toKhmerNum(year)}`;
    } catch {
      return dateStr;
    }
  };

  // Convert Gregorian system number to Khmer number
  const toKhmerNum = (num: number | string): string => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num.toString().split('').map(digit => {
      const parsed = parseInt(digit, 10);
      return !isNaN(parsed) ? khmerDigits[parsed] : digit;
    }).join('');
  };

  const getFormatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // -------------------------------------------------------------
  // Local Storage Initialization
  // -------------------------------------------------------------
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const cached = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch { return INITIAL_TEACHERS; }
    }
    return INITIAL_TEACHERS;
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const cached = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch { return getMockRecords(INITIAL_TEACHERS); }
    }
    return getMockRecords(INITIAL_TEACHERS);
  });

  useEffect(() => {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Maintain refs for teachers and records to avoid stale state in periodic ticks or timers
  const teachersRef = useRef(teachers);
  const recordsRef = useRef(records);

  useEffect(() => {
    teachersRef.current = teachers;
  }, [teachers]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  // Automatic Daily Backup at 9:00 PM (21:00) if active in tab
  useEffect(() => {
    const hours = liveTime.getHours();
    const minutes = liveTime.getMinutes();
    
    if (hours === 21 && minutes === 0) {
      const todayStr = liveTime.toDateString();
      const lastBackup = localStorage.getItem('last_auto_backup_date');
      
      if (lastBackup !== todayStr) {
        localStorage.setItem('last_auto_backup_date', todayStr);
        
        // Trigger auto-backup download
        const backupData = {
          backup_timestamp: new Date().toISOString(),
          teachers: teachersRef.current,
          records: recordsRef.current
        };
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateFormatted = new Date().toISOString().split('T')[0];
        link.download = `Teacher_Attendance_Backup_${dateFormatted}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  }, [liveTime]);

  // -------------------------------------------------------------
  // Form States & State Management
  // -------------------------------------------------------------
  
  // Register Teacher form states
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherDept, setNewTeacherDept] = useState('');
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState('');

  // Attendance logging states
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedShift, setSelectedShift] = useState('ព្រឹក (Morning)');
  const [tempSignature, setTempSignature] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState('');
  const [sigPadKey, setSigPadKey] = useState(0); // To force re-render/reset signature pad
  const [showPdfGuide, setShowPdfGuide] = useState(false);

  // Tooltip state for Teacher List hover details
  const [hoveredTeacher, setHoveredTeacher] = useState<Teacher | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  // Search & Filter state for Report Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState('ទាំងអស់ (All)');
  const [filterDate, setFilterDate] = useState('ថ្ងៃនេះ (Today)');
  const [customFilterDate, setCustomFilterDate] = useState<string>(() => {
    const todayObj = new Date();
    const year = todayObj.getFullYear();
    const month = String(todayObj.getMonth() + 1).padStart(2, '0');
    const day = String(todayObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Dynamic descriptive date label for banners and reports
  const getDisplayDateLabel = () => {
    if (filterDate === 'ថ្ងៃនេះ (Today)') {
      return 'ថ្ងៃនេះ (Today)';
    } else if (filterDate === 'ទាំងអស់ (All)') {
      return 'ប្រវត្តិសរុប (All History)';
    } else {
      return getKhmerDateStringForCustom(customFilterDate) || customFilterDate;
    }
  };

  // Selected details for Active Checked-In status detection
  const selectedTeacherRecord = records.find(
    rec => rec.teacher_id === selectedTeacherId && rec.check_out_time === null
  );

  // -------------------------------------------------------------
  // Core Business Actions
  // -------------------------------------------------------------

  // 1. Register a new teacher
  const handleRegisterTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) {
      alert('សូមបញ្ចូលឈ្មោះគ្រូ! (Please enter a teacher name)');
      return;
    }
    const cleanDept = newTeacherDept.trim() || 'ដេប៉ាតឺម៉ង់ទូទៅ';
    const newId = `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
    
    const nextTeacher: Teacher = {
      teacher_id: newId,
      teacher_name: newTeacherName.trim(),
      department: cleanDept
    };

    setTeachers(prev => [...prev, nextTeacher]);
    setNewTeacherName('');
    setNewTeacherDept('');
    setTeacherSuccessMsg(`បានចុះឈ្មោះ ${nextTeacher.teacher_name} ជោគជ័យ!`);
    
    // Clear notification after 4 seconds
    setTimeout(() => setTeacherSuccessMsg(''), 4000);
  };

  // 2. Check In/Out Log submission
  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttendanceError('');
    setAttendanceSuccess('');

    if (!selectedTeacherId) {
      setAttendanceError('សូមជ្រើសរើសលោកគ្រូ-អ្នកគ្រូ! (Please select a teacher)');
      return;
    }

    if (!tempSignature) {
      setAttendanceError('សូមគូរហត្ថលេខាបញ្ជាក់វត្តមាន! (Please draw a signature)');
      return;
    }

    const currentTeacher = teachers.find(t => t.teacher_id === selectedTeacherId);
    if (!currentTeacher) {
      setAttendanceError('រកមិនឃើញគ្រូនេះទេ! (Teacher not found)');
      return;
    }

    // Determine Mode: Check-In or Check-Out
    if (selectedTeacherRecord) {
      // PERFORM CHECK-OUT
      const updatedRecords = records.map(rec => {
        if (rec.id === selectedTeacherRecord.id) {
          return {
            ...rec,
            check_out_time: new Date().toISOString(),
            signature: tempSignature // update with sign-out signature or keep existing
          };
        }
        return rec;
      });

      setRecords(updatedRecords);
      setAttendanceSuccess(`បានកត់ត្រាម៉ោងចេញសម្រាប់ ${currentTeacher.teacher_name} ជោគជ័យ! (Checked out successfully)`);
    } else {
      // PERFORM CHECK-IN
      // Guard Check: Is already checked in today on the SAME shift?
      const alreadyCheckedInOnShift = records.some(rec => {
        if (rec.teacher_id === selectedTeacherId && rec.shift === selectedShift) {
          const recDate = new Date(rec.check_in_time).toDateString();
          const todayDate = new Date().toDateString();
          return recDate === todayDate;
        }
        return false;
      });

      if (alreadyCheckedInOnShift) {
        setAttendanceError(`លោកគ្រូ-អ្នកគ្រូបានកត់ត្រាវត្តមានវេននេះរួចរាល់ហើយសម្រាប់ថ្ងៃនេះ! (Already checked in to this shift today)`);
        return;
      }

      const newRecord: AttendanceRecord = {
        id: `REC-${Date.now()}`,
        teacher_id: currentTeacher.teacher_id,
        teacher_name: currentTeacher.teacher_name,
        department: currentTeacher.department,
        shift: selectedShift,
        check_in_time: new Date().toISOString(),
        check_out_time: null,
        signature: tempSignature
      };

      setRecords(prev => [newRecord, ...prev]);
      setAttendanceSuccess(`បានកត់ត្រាម៉ោងចូលសម្រាប់ ${currentTeacher.teacher_name} ជោគជ័យ! (Checked in successfully)`);
    }

    // Reset logging state
    setSelectedTeacherId('');
    setTempSignature('');
    setSigPadKey(prev => prev + 1); // Refresh the canvas
  };

  // 3. Quick Check Out Action directly from listing
  const handleQuickCheckOut = (recordId: string) => {
    const updatedRecords = records.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          check_out_time: new Date().toISOString()
        };
      }
      return rec;
    });
    setRecords(updatedRecords);
  };

  // 4. Force Delete Record (Admin/Management task)
  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបបញ្ជីវត្តមាននេះមែនទេ? (Are you sure you want to delete this record?)')) {
      setRecords(prev => prev.filter(rec => rec.id !== recordId));
    }
  };

  // 5. Delete Teacher
  const handleDeleteTeacher = (teacherId: string) => {
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    if (!teacher) return;

    if (window.confirm(`តើអ្នកពិតជាចង់លុបគ្រូឈ្មោះ "${teacher.teacher_name}" មែនទេ? វានឹងមិនលុបប្រវត្តិកត់ត្រាវត្តមានចាស់ៗឡើយ។ (Are you sure you want to delete teacher "${teacher.teacher_name}"?)`)) {
      setTeachers(prev => prev.filter(t => t.teacher_id !== teacherId));
      if (selectedTeacherId === teacherId) {
        setSelectedTeacherId('');
      }
    }
  };

  // Helper: retrieve teacher checkout/attendance statistics for hover popup
  const getTeacherStats = (teacherId: string) => {
    const tRecords = records.filter(r => r.teacher_id === teacherId);
    const count = tRecords.length;
    let lastDate = 'មិនធ្លាប់មានទិន្នន័យ (Never)';
    if (count > 0) {
      // Sort records descending to get the most recent one
      const sorted = [...tRecords].sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime());
      const lastRecDate = new Date(sorted[0].check_in_time);
      lastDate = getKhmerDateString(lastRecDate);
    }
    return { count, lastDate };
  };

  // -------------------------------------------------------------
  // Statistics Calculations
  // -------------------------------------------------------------
  const today = new Date().toDateString();
  const todayRecords = records.filter(rec => new Date(rec.check_in_time).toDateString() === today);
  const activeClasses = todayRecords.filter(rec => rec.check_out_time === null);
  const completedClasses = todayRecords.filter(rec => rec.check_out_time !== null);

  // -------------------------------------------------------------
  // Search & Filtering Execution
  // -------------------------------------------------------------
  const filteredRecords = records.filter(rec => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === '' || 
      rec.teacher_name.toLowerCase().includes(query) || 
      rec.department.toLowerCase().includes(query) ||
      rec.teacher_id.toLowerCase().includes(query);

    // 2. Shift Filter
    const matchesShift = filterShift === 'ទាំងអស់ (All)' || rec.shift.includes(filterShift.split(' ')[0]);

    // 3. Date Filter
    let matchesDate = true;
    if (filterDate === 'ថ្ងៃនេះ (Today)') {
      matchesDate = new Date(rec.check_in_time).toDateString() === today;
    } else if (filterDate === 'ជ្រើសរើសថ្ងៃ (Custom)') {
      const recordLocal = new Date(rec.check_in_time);
      const year = recordLocal.getFullYear();
      const month = String(recordLocal.getMonth() + 1).padStart(2, '0');
      const day = String(recordLocal.getDate()).padStart(2, '0');
      const recDateStrStr = `${year}-${month}-${day}`;
      matchesDate = recDateStrStr === customFilterDate;
    }

    return matchesSearch && matchesShift && matchesDate;
  });

  // Export functions (Simulated clean output/Print option)
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setShowPdfGuide(true);
    // Wait slightly to let the UI update and user read the header alert if they see it, then trigger native print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleExportCSV = () => {
    const displayDate = getDisplayDateLabel();
    // Basic CSV composition with BOM for correct Khmer OS Font encoding
    const headers = 'ល.រ (No.),លេខសម្គាល់គ្រូ (Teacher ID),ឈ្មោះគ្រូ (Name),ដេប៉ាតឺម៉ង់ (Department),វេនបង្រៀន (Shift),ម៉ោងចូល (Check-In Time),ម៉ោងចេញ (Check-Out Time)\n';
    const csvContent = filteredRecords.map((rec, index) => {
      const checkInLocal = new Date(rec.check_in_time).toLocaleString('km-KH');
      const checkOutLocal = rec.check_out_time ? new Date(rec.check_out_time).toLocaleString('km-KH') : 'កំពុងបង្រៀន (Active)';
      return `"${index + 1}","${rec.teacher_id}","${rec.teacher_name}","${rec.department}","${rec.shift}","${checkInLocal}","${checkOutLocal}"`;
    }).join('\n');

    // Prepend UTF-8 BOM \uFEFF so Excel identifies Khmer font symbols correctly
    const blob = new Blob(['\uFEFF' + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Teacher_Attendance_Report_${filterShift.replace(/\s+/g, '_')}_${displayDate.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const displayDate = getDisplayDateLabel();
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Teacher Attendance</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; }
          th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-family: Arial, sans-serif; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 10px; font-family: Arial, sans-serif; font-size: 13px; }
          .title-khmer { font-size: 20px; font-weight: bold; text-align: center; color: #0f172a; margin-bottom: 5px; }
          .title-english { font-size: 12px; text-align: center; color: #64748b; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; }
          .meta-info { font-size: 12px; font-weight: bold; color: #334155; margin-bottom: 15px; border: none !important; }
        </style>
      </head>
      <body>
        <div class="title-khmer">របាយការណ៍សន្លឹកវត្តមាន និងចុះហត្ថលេខាគ្រូបង្រៀន</div>
        <div class="title-english">Teacher Attendance and Signature Tracking Sheet</div>
        
        <table class="meta-info">
          <tr>
            <td style="border: none !important;"><strong>កាលបរិច្ឆេទរបាយការណ៍ / Date Range:</strong> ${displayDate}</td>
            <td style="border: none !important;"><strong>វេនបង្រៀនដែលជ្រើសរើស / Shift Filter:</strong> ${filterShift}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>ល.រ (No.)</th>
              <th>លេខសម្គាល់គ្រូ (Teacher ID)</th>
              <th>ឈ្មោះលោកគ្រូ-អ្នកគ្រូ (Teacher Name)</th>
              <th>ដេប៉ាតឺម៉ង់ (Department)</th>
              <th>វេនបង្រៀន (Shift)</th>
              <th>ម៉ោងចូល (Check-In)</th>
              <th>ម៉ោងចេញ (Check-Out)</th>
              <th>ហត្ថលេខា (Signature)</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredRecords.forEach((rec, index) => {
      const checkInLocal = new Date(rec.check_in_time).toLocaleString('km-KH');
      const checkOutLocal = rec.check_out_time ? new Date(rec.check_out_time).toLocaleString('km-KH') : 'កំពុងបង្រៀន (Active)';
      const sigImg = rec.signature ? `<img src="${rec.signature}" width="80" height="28" style="vertical-align: middle; object-fit: contain;" />` : 'គ្មានហត្ថលេខា (No)';
      excelTemplate += `
        <tr>
          <td>${index + 1}</td>
          <td>${rec.teacher_id}</td>
          <td>${rec.teacher_name}</td>
          <td>${rec.department}</td>
          <td>${rec.shift}</td>
          <td>${checkInLocal}</td>
          <td>${checkOutLocal}</td>
          <td style="text-align: center;">${sigImg}</td>
        </tr>
      `;
    });

    excelTemplate += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Teacher_Attendance_Report_${filterShift.replace(/\s+/g, '_')}_${displayDate.replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    const displayDate = getDisplayDateLabel();
    let wordTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4 portrait;
            margin: 1in 1in 1in 1in;
          }
          body {
            font-family: 'Khmer OS Battambang', 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            color: #000000;
          }
          .header-text {
            text-align: center;
            font-weight: bold;
            font-size: 16pt;
            color: #1e3a8a;
          }
          .sub-header-text {
            text-align: center;
            font-size: 10pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            border: 1px solid #cbd5e1; 
            margin-top: 20px;
          }
          th { 
            background-color: #f1f5f9; 
            color: #1e3a8a; 
            font-weight: bold; 
            border: 1px solid #94a3b8; 
            padding: 8px 6px; 
            font-size: 10pt;
            text-align: left;
          }
          td { 
            border: 1px solid #cbd5e1; 
            padding: 8px 6px; 
            font-size: 9.5pt;
          }
          .meta-info-table {
            width: 100%;
            margin-top: 15px;
            font-size: 10pt;
          }
          .meta-info-table td {
            border: none !important;
            padding: 3px 0px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header-text">របាយការណ៍សន្លឹកវត្តមាន និងចុះហត្ថលេខាគ្រូបង្រៀន</div>
        <div class="sub-header-text">Teacher Attendance & Signature Tracking Report</div>
        
        <table class="meta-info-table">
          <tr>
            <td style="width: 50%;">កាលបរិច្ឆេទរបាយការណ៍ / Date Range: ${displayDate}</td>
            <td style="width: 50%; text-align: right;">វេនបង្រៀន / Shift: ${filterShift}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">ល.រ</th>
              <th style="width: 13%;">លេខកូដគ្រូ</th>
              <th style="width: 25%;">ឈ្មោះលោកគ្រូ-អ្នកគ្រូ</th>
              <th style="width: 20%;">ដេប៉ាតឺម៉ង់</th>
              <th style="width: 12%;">វេនបង្រៀន</th>
              <th style="width: 13%;">ម៉ោងចូល</th>
              <th style="width: 12%;">ហត្ថលេខា</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredRecords.forEach((rec, index) => {
      const checkInLocal = new Date(rec.check_in_time).toLocaleString('km-KH');
      const sigImg = rec.signature ? `<img src="${rec.signature}" width="80" height="28" style="vertical-align: middle; object-fit: contain;" />` : 'គ្មានហត្ថលេខា';
      wordTemplate += `
        <tr>
          <td>${index + 1}</td>
          <td>${rec.teacher_id}</td>
          <td>${rec.teacher_name}</td>
          <td>${rec.department}</td>
          <td>${rec.shift}</td>
          <td>${checkInLocal}</td>
          <td style="text-align: center;">${sigImg}</td>
        </tr>
      `;
    });

    wordTemplate += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([wordTemplate], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Teacher_Attendance_Report_${filterShift.replace(/\s+/g, '_')}_${displayDate.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const displayDate = getDisplayDateLabel();
    const cleanRecords = filteredRecords.map((rec) => ({
      attendance_id: rec.id,
      teacher_id: rec.teacher_id,
      teacher_name: rec.teacher_name,
      department: rec.department,
      shift: rec.shift,
      check_in_time: rec.check_in_time,
      check_out_time: rec.check_out_time || null,
      signature_data_url: rec.signature || null
    }));
    const dataStr = JSON.stringify(cleanRecords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Teacher_Attendance_Report_${filterShift.replace(/\s+/g, '_')}_${displayDate.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="app-root-pane" className={`min-h-screen bg-slate-50 text-slate-800 antialiased pb-20 transition-all duration-300 ${selectedFont} ${selectedFontSize}`}>
      
      {/* -------------------------------------------------------------
          Header Bar: Clean & High-Contrast
         ------------------------------------------------------------- */}
      <header id="app-header" className="bg-slate-900 text-white shadow-xl border-b border-slate-800 sticky top-0 z-40">
        <div id="header-container" className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div id="header-branding" className="flex items-center gap-3">
            <div id="header-logo-badge" className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 id="app-title-khmer" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងចុះហត្ថលេខាគ្រូបង្រៀន
              </h1>
              <p id="app-title-english" className="text-xs text-indigo-300 font-mono tracking-wider uppercase mt-0.5">
                Teacher Attendance & Signature Tracking System
              </p>
            </div>
          </div>

          <div id="header-right-controls" className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* ជ្រើសរើស Font Khmer OS */}
            <div id="header-font-selector" className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-indigo-300 font-bold hidden xl:inline">អក្សរយូនីកូដ / Font Unicode:</span>
              <select
                id="font-select-picker"
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="bg-slate-950 text-white font-semibold text-xs py-1 px-2 rounded border border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="font-khmer-os-battambang" className="font-khmer-os-battambang">Khmer OS Battambang (លំនាំដើម)</option>
                <option value="font-khmer-os-siemreap" className="font-khmer-os-siemreap">Khmer OS Siemreap</option>
                <option value="font-khmer-os-classic" className="font-khmer-os-classic">Khmer OS Classic (បុរាណ)</option>
                <option value="font-khmer-os-metalchrieng" className="font-khmer-os-metalchrieng">Khmer OS Metal Chrieng (ជ្រៀង)</option>
                <option value="font-khmer-os-nokora" className="font-khmer-os-nokora">Khmer OS Siemreap Serif (Nokora)</option>
                <option value="font-khmer-modern-kantumruy" className="font-khmer-modern-kantumruy">Kantumruy Pro (Modern)</option>
              </select>
            </div>

            {/* ជ្រើសរើសទំហំអក្សរ / Font Size Selector */}
            <div id="header-font-size-selector" className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-indigo-300 font-bold hidden xl:inline">ទំហំអក្សរ / Size:</span>
              <select
                id="font-size-select-picker"
                value={selectedFontSize}
                onChange={(e) => setSelectedFontSize(e.target.value)}
                className="bg-slate-950 text-white font-semibold text-xs py-1 px-1 rounded border border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-center"
              >
                <option value="khmer-size-11">ទំហំ ១១ (11px)</option>
                <option value="khmer-size-12">ទំហំ ១២ (12px - ស្ដង់ដារ)</option>
                <option value="khmer-size-13">ទំហំ ១៣ (13px)</option>
                <option value="khmer-size-14">ទំហំ ១៤ (14px)</option>
                <option value="khmer-size-15">ទំហំ ១៥ (15px)</option>
                <option value="khmer-size-16">ទំហំ ១៦ (16px)</option>
                <option value="khmer-size-18">ទំហំ ១៨ (18px)</option>
              </select>
            </div>

            {/* Dynamic Live Clock Workspace widget */}
            <div id="header-clock" className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
              <div className="text-right">
                <div id="live-time-display" className="text-sm font-mono font-bold text-amber-300 leading-none">
                  {getFormatTime(liveTime)}
                </div>
                <div id="live-date-display" className="text-[9px] text-slate-300 font-medium mt-0.5 whitespace-nowrap">
                  {getKhmerDateString(liveTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="app-main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* -------------------------------------------------------------
            Top Dashboard Cards Summary Panel
           ------------------------------------------------------------- */}
        <section id="statistics-summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div id="stat-total-teachers" className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">គ្រូបង្រៀនសរុប / Total Teachers</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{toKhmerNum(teachers.length)} នាក់</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">គ្រូបង្រៀនក្នុងប្រព័ន្ធ | Active accounts</p>
            </div>
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div id="stat-active-classes" className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">កំពុងបង្រៀន / Active Classes</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{toKhmerNum(activeClasses.length)} នាក់</h3>
              <p className="text-[11px] text-amber-600/80 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block"></span>
                មិនទាន់ចុះម៉ោងចេញ | Checked in
              </p>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <LogIn className="w-6 h-6" />
            </div>
          </div>

          <div id="stat-checked-out" className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">បានបញ្ចប់ថ្នាក់ / Completed</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{toKhmerNum(completedClasses.length)} នាក់</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">កត់ត្រាម៉ោងចេញរួច | Checked out today</p>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div id="stat-today-logged" className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">វត្តមានថ្ងៃនេះ / Attendance Today</p>
              <h3 className="text-2xl font-bold text-indigo-900 mt-1">{toKhmerNum(todayRecords.length)} នាក់/ដង</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">កត់ត្រាសរុបថ្ងៃនេះ | Logs of today</p>
            </div>
            <div className="p-3.5 bg-indigo-50/80 text-indigo-900 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

        </section>

        {/* -------------------------------------------------------------
            Splitting Screen: Interactive Logger & Directory
           ------------------------------------------------------------- */}
        <div id="interactive-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Check-In/Out Logging and Register (Span 5) */}
          <div id="logger-column" className="lg:col-span-5 flex flex-col gap-8">
            
            {/* CARD 1: ATTENDANCE ENTRY FORM */}
            <div id="card-attendance-logging" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-700 to-slate-800 px-6 py-4.5 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-300" />
                  ចុះហត្ថលេខាវត្តមាន (Log Attendance)
                </h2>
                <p className="text-[11px] text-slate-100/80 mt-0.5">
                  សូមជ្រើសរើសឈ្មោះ វេនបង្រៀន និងចុះហត្ថលេខាបញ្ជាក់
                </p>
              </div>

              <form onSubmit={handleAttendanceSubmit} className="p-6 flex flex-col gap-5">
                
                {/* 1. SELECT TEACHER */}
                <div id="field-teacher-select" className="flex flex-col gap-1.5">
                  <label htmlFor="teacher-dropdown" className="text-xs font-bold text-slate-700 flex justify-between">
                    <span>លោកគ្រូ-អ្នកគ្រូ (Select Teacher) *</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: TCH-XXX</span>
                  </label>
                  <select
                    id="teacher-dropdown"
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      setAttendanceError('');
                      setAttendanceSuccess('');
                    }}
                    className="w-full bg-slate-50 border border-slate-350 hover:border-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm transition-colors text-slate-800 font-sans"
                  >
                    <option value="">-- សូមជ្រើសរើសគ្រូបង្រៀន (Select Teacher) --</option>
                    {teachers.map(tch => (
                      <option key={tch.teacher_id} value={tch.teacher_id}>
                        {tch.teacher_name} ({tch.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* DYNAMIC ATTENDANCE STATUS BADGE FOR SELECTED TEACHER */}
                {selectedTeacherId && (
                  <div id="selected-teacher-badge" className="p-3.5 rounded-lg border text-xs">
                    {selectedTeacherRecord ? (
                      <div className="text-amber-800 bg-amber-50/60 border-amber-200">
                        <p className="font-bold flex items-center gap-1.5 text-amber-700">
                          <LogIn className="w-4 h-4 animate-bounce" />
                          កំពុងស្ថិតក្នុងថ្នាក់បង្រៀន! (Currently Active)
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          បានកត់ត្រាម៉ោងចូលនៅម៉ោង <strong>{new Date(selectedTeacherRecord.check_in_time).toLocaleTimeString('km-KH')}</strong> វេន <strong>{selectedTeacherRecord.shift}</strong>។ ចុះហត្ថលេខាខាងក្រោមដើម្បី <strong>កត់ត្រាម៉ោងចេញ (Check Out)</strong>។
                        </p>
                      </div>
                    ) : (
                      <div id="eligible-check-in" className="text-indigo-800 bg-indigo-50/50 border-indigo-150">
                        <p className="font-bold flex items-center gap-1.5 text-indigo-700">
                          <CheckCircle className="w-4 h-4" />
                          អាចកត់ត្រាម៉ោងចូលបាន (Available for Check-In)
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          លោកគ្រូ-អ្នកគ្រូមិនទាន់មានម៉ោងចូលសម្រាប់ពេលនេះទេ ។ សូមជ្រើសរើសវេនបង្រៀន និងចុះហត្ថលេខាដើម្បី <strong>កត់ត្រាម៉ោងចូល (Check In)</strong>។
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CHOOSE SHIFT (Only visible if doing Check-In) */}
                {!selectedTeacherRecord && (
                  <div id="field-shift-select" className="flex flex-col gap-1.5">
                    <label id="shift-label" className="text-xs font-bold text-slate-700">
                      វេនបង្រៀន (Teaching Shift) *
                    </label>
                    <div id="shift-radio-group" className="grid grid-cols-3 gap-2">
                      {[
                        { text: 'ព្រឹក (Morning)', val: 'ព្រឹក (Morning)', time: '7am - 11am' },
                        { text: 'រសៀល (Afternoon)', val: 'រសៀល (Afternoon)', time: '1pm - 5pm' },
                        { text: 'យប់ (Evening)', val: 'យប់ (Evening)', time: '5:30pm - 8:30pm' }
                      ].map(item => (
                        <label 
                          key={item.val} 
                          className={`flex flex-col items-center justify-center border p-2.5 rounded-lg cursor-pointer transition-all text-center ${
                            selectedShift === item.val 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="shift"
                            value={item.val}
                            checked={selectedShift === item.val}
                            onChange={() => setSelectedShift(item.val)}
                            className="sr-only"
                          />
                          <span className="text-xs font-bold">{item.text.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{item.time}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SIGNATURE PAD WITH SEPARATE KEY TO RE-RENDER IF CLEARED */}
                <div id="field-signature-pad" className="flex flex-col gap-1.5">
                  <label id="signature-pad-label" className="text-xs font-bold text-slate-700 flex justify-between">
                    <span>ហត្ថលេខាគ្រូ (Teacher's Signature) *</span>
                    <span className="text-[11px] text-amber-600 font-bold">តម្រូវឱ្យចុះហត្ថលេខា</span>
                  </label>
                  <SignaturePad
                    key={sigPadKey}
                    onSave={(dataUrl) => setTempSignature(dataUrl)}
                    onClear={() => setTempSignature('')}
                    placeholder={
                      selectedTeacherRecord 
                        ? 'ចុះហត្ថលេខាដើម្បីកត់ត្រាម៉ោងចេញ (Sign to Check-out)' 
                        : 'ចុះហត្ថលេខាដើម្បីកត់ត្រាម៉ោងចូល (Sign to Check-in)'
                    }
                  />
                </div>

                {/* ERROR & SUCCESS MESSAGES */}
                {attendanceError && (
                  <div id="attendance-error-box" className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                    {attendanceError}
                  </div>
                )}
                {attendanceSuccess && (
                  <div id="attendance-success-box" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                    {attendanceSuccess}
                  </div>
                )}

                {/* SUBMIT LOG BUTTON */}
                <button
                  id="submit-log-btn"
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] cursor-pointer ${
                    selectedTeacherRecord
                      ? 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
                  }`}
                >
                  {selectedTeacherRecord ? (
                    <>
                      <LogOut className="w-5 h-5" />
                      កត់ត្រាម៉ោងចេញឥឡូវនេះ (Check Out Now)
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      កត់ត្រាម៉ោងចូលឥឡូវនេះ (Check In Now)
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* CARD 2: REGISTER TEACHER */}
            <div id="card-register-teacher" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2 bg-slate-550">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  ចុះឈ្មោះគ្រូថ្មី (Register New Teacher)
                </h2>
              </div>

              <form onSubmit={handleRegisterTeacher} className="p-6 flex flex-col gap-4">
                <div id="form-field-teacher-name" className="flex flex-col gap-1.5">
                  <label htmlFor="teacher-name-input" className="text-xs font-bold text-slate-600">
                    ឈ្មោះលោកគ្រូ-អ្នកគ្រូ (Teacher Full Name) *
                  </label>
                  <input
                    id="teacher-name-input"
                    type="text"
                    required
                    placeholder="ឧ. លោកគ្រូ អ៊ុំ សាវឌី"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div id="form-field-teacher-dept" className="flex flex-col gap-1.5">
                  <label htmlFor="teacher-dept-input" className="text-xs font-bold text-slate-600">
                    ដេប៉ាតឺម៉ង់ ឬកម្រិតថ្នាក់ (Department / Level)
                  </label>
                  <input
                    id="teacher-dept-input"
                    type="text"
                    placeholder="ឧ. ដេប៉ាតឺម៉ង់ ព័ត៌មានវិទ្យា"
                    value={newTeacherDept}
                    onChange={(e) => setNewTeacherDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {teacherSuccessMsg && (
                  <div id="teacher-success-box" className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium">
                    {teacherSuccessMsg}
                  </div>
                )}

                <button
                  id="register-teacher-submit-btn"
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + បន្ថែមគ្រូថ្មី (Add Teacher)
                </button>
              </form>

              {/* Collapsible/Direct table of Teacher Accounts */}
              <div id="teacher-list-subpanel" className="px-6 pb-6 pt-2 border-t border-slate-100 relative">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>បញ្ជីគ្រូទាំងអស់ ({toKhmerNum(teachers.length)})</span>
                </h3>
                <div id="teachers-mini-list" className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {teachers.map((tch) => (
                    <div 
                      key={tch.teacher_id} 
                      className="p-2 sm:p-2.5 flex justify-between items-center bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer group"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parentEl = document.getElementById('teacher-list-subpanel');
                        const parentRect = parentEl?.getBoundingClientRect();
                        if (parentRect) {
                          setTooltipPos({
                            top: rect.top - parentRect.top,
                            left: rect.left - parentRect.left + (rect.width / 2)
                          });
                        }
                        setHoveredTeacher(tch);
                      }}
                      onMouseLeave={() => setHoveredTeacher(null)}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-850 group-hover:text-indigo-600 transition-colors uppercase">{tch.teacher_name}</div>
                        <div className="text-[10px] text-slate-500">{tch.department} | {tch.teacher_id}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(tch.teacher_id)}
                        className="p-1 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Floating Tooltip Summary Card */}
                {hoveredTeacher && (() => {
                  const stats = getTeacherStats(hoveredTeacher.teacher_id);
                  return (
                    <div 
                      className="absolute z-50 bg-slate-900 border border-slate-700/80 text-white rounded-xl shadow-xl p-3 pointer-events-none transition-all duration-150 ease-out flex flex-col gap-1.5 w-64 -translate-x-1/2 -translate-y-[calc(100%+8px)]"
                      style={{ 
                        top: `${tooltipPos.top}px`, 
                        left: `${tooltipPos.left}px`,
                        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.45)'
                      }}
                    >
                      {/* Triangle Pointer */}
                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/80 rotate-45"></div>
                      
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800 text-[10px] font-bold text-indigo-400">
                        <Award className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ស្ថិតិនៃការកត់ត្រាវត្តមាន (Attendance Stats)</span>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 text-[10px] text-slate-300">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans">គ្រូ (Teacher):</span>
                          <span className="font-bold text-white font-sans">{hoveredTeacher.teacher_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans">វត្តមានសរុប (Total Present):</span>
                          <span className="font-bold text-emerald-400 font-sans border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 rounded">
                            {toKhmerNum(stats.count)} ដង
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5 pt-1.5 border-t border-slate-800">
                          <div className="text-slate-400 text-[9px] font-sans">វត្តមានចុងក្រោយ (Last Checked-In):</div>
                          <div className="font-bold text-amber-300 text-[9.5px] leading-tight mt-0.5">
                            {stats.lastDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>

          {/* Right Block: Attendance Reports Sheet (Span 7) */}
          <div id="report-column" className="lg:col-span-7 flex flex-col gap-8">
            
            <div id="card-attendance-reports" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50">
                <div>
                  <h2 id="report-title" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    របាយការណ៍សន្លឹកវត្តមានគ្រូបង្រៀន (Attendance Sheet)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    បញ្ជីសកម្មភាពចុះម៉ោងចូល-ម៉ោងចេញ និងហត្ថលេខារបស់គ្រូ
                  </p>
                </div>

                {/* Print and Export Buttons */}
                <div id="report-actions" className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                  <button
                    id="export-csv-btn"
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Export currently filtered list to CSV (Khmer font compatible)"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV (BOM)</span>
                  </button>
                  <button
                    id="export-excel-btn"
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Export currently filtered list to Excel (.xls) spreadsheet"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Excel (.xls)</span>
                  </button>
                  <button
                    id="export-json-btn"
                    type="button"
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Export currently filtered list to JSON format for IT database integration"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-600" />
                    <span>JSON</span>
                  </button>
                  <button
                    id="export-word-btn"
                    type="button"
                    onClick={handleExportWord}
                    className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Export currently filtered list to Microsoft Word (.doc)"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-700" />
                    <span>Word (.doc)</span>
                  </button>
                  <button
                    id="export-pdf-btn"
                    type="button"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Save currently filtered list as high-resolution PDF document"
                  >
                    <Printer className="w-3.5 h-3.5 text-rose-700" />
                    <span>PDF</span>
                  </button>
                  <button
                    id="print-btn"
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md"
                    title="Print report (optimized print style sheet)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>ព្រីន (Print)</span>
                  </button>
                </div>
              </div>

              {/* PDF Guide Notice Alert (only shown transiently/interactively, hidden during print) */}
              {showPdfGuide && (
                <div id="pdf-guide-notice" className="no-print bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-950 font-medium">
                  <div className="p-1 bg-amber-100 rounded text-amber-700 mt-0.5 animate-bounce">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 font-sans font-bold">
                    <p className="font-extrabold text-amber-900 mb-0.5">
                      របៀបរក្សាទុកជា PDF / How to Save as PDF:
                    </p>
                    <p className="text-amber-800 leading-relaxed text-[11px]">
                      👉 ក្នុងផ្ទាំងលោតព្រីន (Print menu) សូមជ្រើសរើស <strong>Destination (គោលដៅ)</strong> ទៅជា <strong>Save as PDF (រក្សាទុកជា PDF)</strong> រួចចុចប៊ូតុង <strong>Save</strong> ជាការស្រេច។ វិធីនេះធានាគំលាតទំព័រ និងអក្សរខ្មែរស្អាតឥតខ្ចោះ។
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowPdfGuide(false)}
                    className="text-amber-600 hover:text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px] bg-amber-100 border border-amber-200 hover:bg-amber-150 transition-colors cursor-pointer self-start"
                  >
                    បិទ (Close)
                  </button>
                </div>
              )}

              {/* Search & Filter Controls */}
              <div id="filter-controls-pnl" className="bg-slate-100/50 p-4 border-b border-slate-205 flex flex-col md:flex-row gap-3">
                
                {/* Search query field */}
                <div id="search-control" className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ស្វែងរកតាមឈ្មោះ ផ្នែក ឬ ID... (Search...)"
                    className="w-full bg-white border border-slate-300 pl-9 pr-3 py-1.5 text-xs rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Filter combo-boxes */}
                <div id="filter-selects" className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 hidden sm:inline">វេន:</span>
                    <select
                      id="shift-filter-select"
                      value={filterShift}
                      onChange={(e) => setFilterShift(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs focus:border-indigo-500"
                    >
                      <option value="ទាំងអស់ (All)">វេនទាំងអស់ (All Shifts)</option>
                      <option value="ព្រឹក (Morning)">ព្រឹក (Morning)</option>
                      <option value="រសៀល (Afternoon)">រសៀល (Afternoon)</option>
                      <option value="យប់ (Evening)">យប់ (Evening)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-slate-500 hidden sm:inline">កាលបរិច្ឆេទ:</span>
                    <select
                      id="date-filter-select"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs focus:border-indigo-500 font-semibold cursor-pointer"
                    >
                      <option value="ថ្ងៃនេះ (Today)">ថ្ងៃនេះ (Today)</option>
                      <option value="ទាំងអស់ (All)">ប្រវត្តិសរុប (All History)</option>
                      <option value="ជ្រើសរើសថ្ងៃ (Custom)">ជ្រើសរើសថ្ងៃ (Custom Date...)</option>
                    </select>

                    {filterDate === 'ជ្រើសរើសថ្ងៃ (Custom)' && (
                      <input
                        id="custom-date-filter-picker"
                        type="date"
                        value={customFilterDate}
                        onChange={(e) => setCustomFilterDate(e.target.value)}
                        className="bg-white border text-slate-800 border-indigo-300 rounded-lg py-0.5 px-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                      />
                    )}
                  </div>
                </div>

              </div>

              {/* Dynamic Filter Status Banner */}
              <div id="filter-banner" className="bg-indigo-50/70 border-b border-indigo-100/50 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-950 font-semibold self-stretch">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>កំពុងបង្ហាញ៖ <strong className="text-indigo-800">{getDisplayDateLabel()}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>វេនបង្រៀន៖ <strong className="text-indigo-800">{filterShift}</strong></span>
                </div>
                <div className="text-[11px] text-slate-500 font-bold">
                  រកឃើញទិន្នន័យ៖ <span className="text-indigo-600 font-bold">{toKhmerNum(filteredRecords.length)} កត់ត្រា (Records)</span>
                </div>
              </div>

              {/* THE REPORT SPREADSHEET TABLE */}
              <div id="attendance-table-viewport" className="overflow-x-auto">
                <table id="attendance-report-table" className="min-w-full divide-y divide-slate-150">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        ល.រ (No.)
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        ឈ្មោះលោកគ្រូ-អ្នកគ្រូ (Name)
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        វេនបង្រៀន (Shift)
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        ម៉ោងចូល (Check-In)
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        ម៉ោងចេញ (Check-Out)
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        ហត្ថលេខា (Signature)
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">
                        សកម្មភាព (Actions)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="w-8 h-8 text-slate-300" />
                            <span>មិនទាន់មានការចុះឈ្មោះវត្តមានឡើយ ឬរកមិនឃើញទិន្នន័យ (No records match the filter)</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec, index) => {
                        const checkInDate = new Date(rec.check_in_time);
                        const checkOutDate = rec.check_out_time ? new Date(rec.check_out_time) : null;
                        
                        // Calculate elapsed time for active teachers
                        const elapsedMs = checkOutDate ? 0 : (liveTime.getTime() - checkInDate.getTime());
                        const elapsedHours = elapsedMs / (1000 * 60 * 60);
                        const hasForgottenCheckOut = !checkOutDate && elapsedHours > 4;

                        // Helper formatted duration
                        const getElapsedTimeFormatted = (ms: number) => {
                          const totalMinutes = Math.floor(ms / (1000 * 60));
                          const hrs = Math.floor(totalMinutes / 60);
                          const mins = totalMinutes % 60;
                          return `${toKhmerNum(hrs)}ម៉ោង ${toKhmerNum(mins)}នាទី`;
                        };
                        
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            
                            {/* លេខរៀង (Serial Number) */}
                            <td className="px-4 py-3 text-xs whitespace-nowrap font-mono font-bold text-slate-500">
                              {toKhmerNum(index + 1)}
                            </td>

                            {/* ឈ្មោះគ្រូ + ដេប៉ាតឺម៉ង់ (Teacher Details) */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-xs font-bold text-slate-900">
                                {rec.teacher_name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {rec.department} • <span className="font-mono">{rec.teacher_id}</span>
                              </div>
                            </td>

                            {/* វេនបង្រៀន (Shift) */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.shift.includes('ព្រឹក') 
                                  ? 'bg-sky-55 text-sky-800 border border-sky-100' 
                                  : rec.shift.includes('រសៀល')
                                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                  : 'bg-slate-900 text-white'
                              }`}>
                                {rec.shift.split(' ')[0]}
                              </span>
                            </td>

                            {/* ម៉ោងចូល (Check-In) */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="text-xs font-bold text-slate-800 font-mono">
                                {checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {checkInDate.toLocaleDateString('km-KH', { month: 'short', day: 'numeric' })}
                              </div>
                            </td>

                            {/* ម៉ោងចេញ (Check-Out) */}
                            <td className="px-4 py-3 text-center">
                              {checkOutDate ? (
                                <>
                                  <div className="text-xs font-bold text-slate-800 font-mono">
                                    {checkOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    {checkOutDate.toLocaleDateString('km-KH', { month: 'short', day: 'numeric' })}
                                  </div>
                                </>
                              ) : hasForgottenCheckOut ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 animate-pulse shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                    <span>កំពុងបង្រៀន {toKhmerNum('> ៤ម៉ោង')}</span>
                                  </span>
                                  <div className="text-[9px] text-rose-600 bg-rose-50/70 p-1.5 rounded border border-rose-150 max-w-[170px] whitespace-normal text-center leading-tight font-sans font-bold flex flex-col items-center gap-0.5">
                                    <span className="flex items-center gap-1 text-rose-700 font-extrabold uppercase text-[7px] tracking-wider">
                                      <AlertTriangle className="w-3 h-3 text-rose-600 animate-bounce" />
                                      អាចភ្លេចកត់ម៉ោងចេញ
                                    </span>
                                    <span>ចូលបង្រៀនបាន៖ {getElapsedTimeFormatted(elapsedMs)} ហើយ</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                    កំពុងបង្រៀន (Active)
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    រយៈពេល៖ {getElapsedTimeFormatted(elapsedMs)}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* ហត្ថលេខា (Signature Base64 Preview) */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {rec.signature ? (
                                <div className="group relative inline-block">
                                  <img
                                    src={rec.signature}
                                    alt="ហត្ថលេខា"
                                    className="h-7 w-20 object-contain mx-auto border border-slate-200 bg-white rounded shadow-xs cursor-zoom-in hover:scale-110 active:scale-150 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="sr-only">Signed</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-red-500">គ្មានហត្ថលេខា</span>
                              )}
                            </td>

                            {/* សកម្មភាព (Actions) */}
                            <td className="px-4 py-3 text-right whitespace-nowrap text-xs font-medium">
                              <div className="flex items-center justify-end gap-1.5">
                                {!rec.check_out_time && (
                                  <button
                                    onClick={() => handleQuickCheckOut(rec.id)}
                                    className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200 rounded text-[10px] font-bold transition-all cursor-pointer"
                                    title="Check out now"
                                  >
                                    កត់ម៉ោងចេញ (Check Out)
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary Indicator */}
              <div className="bg-slate-50 px-6 py-4 text-xs text-slate-500 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="font-sans">
                  បង្ហាញទិន្នន័យចំនួន <strong>{toKhmerNum(filteredRecords.length)}</strong> កត់ត្រា ក្នុងចំណោម <strong>{toKhmerNum(records.length)}</strong> កត់ត្រាសរុប
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  * ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិក្នុងឧបករណ៍ | Autostored to browser local storage
                </span>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
