import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type FolderKey = "attendance" | "debts" | "documents" | "survey" | null

const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

// Семестр: 09.02.2026 — 30.05.2026 (начало — понедельник чётной недели)
const SEMESTER_START = new Date(2026, 1, 9) // 9 февраля 2026

const STUDENTS = [
  "Бадминова Виктория Мингияновна",
  "Бурлакова Влада Владимировна",
  "Гандалоев Магомед Рубенович",
  "Гурьянова Евгения Михайловна",
  "Еремина Ирина Николаевна",
  "Замесина Алина Ильинична",
  "Кормилкина Юлия Владимировна",
  "Костоев Алихан Русланович",
  "Купцов Андрей Александрович",
  "Магомедов Ислам Альбертович",
  "Малютова Анна Олеговна",
  "Манджиева Саглара Дмитриевна",
  "Мустафаев Джабраил Расулович",
  "Муталипов Магомед Денисович",
  "Неймышев Глеб Владиславович",
  "Огиенко Анастасия Анатольевна",
  "Пономарев Артём Денисович",
  "Рамазанов Раджаб Аметханович",
  "Рудометкин Степан Михайлович",
  "Сальников Даниил Артемович",
  "Сафронова Айша Сайидовна",
  "Силантьев Александр Дмитриевич",
  "Утинова Самира Саматовна",
  "Федин Иван Олегович",
  "Ширшова Кира Павловна",
]

// null = присутствует (по умолчанию), false = неуваж, "excused" = уваж
type AttendanceVal = false | "excused" | null
type AttendanceState = Record<string, Record<number, Record<number, AttendanceVal>>>
type DisciplinesState = Record<number, [string, string, string]>
// Сохранённые записи: dayIdx -> { attendance snapshot, disciplines snapshot }
type SavedDayRecord = { attendance: Record<string, Record<number, AttendanceVal>>; disciplines: [string, string, string] }
type SavedRecords = Record<number, SavedDayRecord>

const initAttendance = (): AttendanceState => {
  const state: AttendanceState = {}
  STUDENTS.forEach((s) => {
    state[s] = {}
    DAYS.forEach((_, di) => {
      state[s][di] = { 0: null, 1: null, 2: null }
    })
  })
  return state
}

const initDisciplines = (): DisciplinesState => {
  const state: DisciplinesState = {}
  DAYS.forEach((_, di) => {
    state[di] = ["", "", ""]
  })
  return state
}

const INIT_DEBTS = [
  { name: "Гандалоев М.Р.", subject: "БЖД", type: "Контрольная", deadline: "18.02.2026", status: "Не сдано" },
  { name: "Костоев А.Р.", subject: "КП", type: "Проект", deadline: "04.03.2026", status: "Не сдано" },
  { name: "Магомедов И.А.", subject: "ИГПР", type: "Реферат", deadline: "21.03.2026", status: "Просрочено" },
  { name: "Силантьев А.Д.", subject: "КРПР", type: "Реферат", deadline: "07.04.2026", status: "Сдано" },
]
type DebtEntry = { name: string; subject: string; type: string; deadline: string; status: string }

const INIT_DOCUMENTS = [
  { name: "Бадминова В.М.", date: "10.01.2025", reason: "Болезнь", status: "Принята", hasPhoto: true },
]

type DocEntry = { name: string; date: string; reason: string; status: string; hasPhoto: boolean; fileUrl?: string; fileName?: string }

const CONTACTS = [
  { role: "Декан", name: "Гамбарова Анастасия Алексеевна", icon: "GraduationCap" },
  { role: "Методист", name: "Леднева Екатерина Александровна", icon: "ClipboardList" },
  { role: "Замдиректора по воспитательной работе", name: "Беляев Александр Сергеевич", icon: "Users" },
  { role: "Преподаватель БЖД", name: "Палади Александр Александрович", icon: "ShieldCheck" },
  { role: "Преподаватель конституционного права", name: "Дубровина Юлия Яковлевна", icon: "Scale" },
  { role: "Преподаватель истории государства и права", name: "Воронин Александр Викторович", icon: "BookOpen" },
]

const folders = [
  { key: "attendance" as FolderKey, label: "Посещаемость", icon: "CalendarCheck", desc: "Учёт посещаемости группы" },
  { key: "debts" as FolderKey, label: "Задолженности", icon: "AlertCircle", desc: "Список академических долгов" },
  { key: "documents" as FolderKey, label: "Объяснительные", icon: "FileImage", desc: "Фото и подтверждения" },
  { key: "survey" as FolderKey, label: "Анкета предложений", icon: "MessageSquare", desc: "Форма обратной связи" },
]

const glassCard = {
  background: "rgba(255,255,255,0.5)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.5), 0 4px 20px rgba(128,0,32,0.08), 0 16px 40px rgba(128,0,32,0.06)",
  border: "1px solid rgba(255,255,255,0.6)",
}

export function DashboardPage() {
  const [openFolder, setOpenFolder] = useState<FolderKey>(null)
  const [showMessages, setShowMessages] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [messageContact, setMessageContact] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sentMessages, setSentMessages] = useState<{ to: string; text: string }[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - SEMESTER_START.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(0, diff)
  })
  const [attendance, setAttendance] = useState<AttendanceState>(initAttendance)
  const [disciplines, setDisciplines] = useState<DisciplinesState>(initDisciplines)
  const [savedRecords, setSavedRecords] = useState<SavedRecords>({})
  const [documents, setDocuments] = useState<DocEntry[]>(INIT_DOCUMENTS)
  const [debts, setDebts] = useState<DebtEntry[]>(INIT_DEBTS)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [newDoc, setNewDoc] = useState<DocEntry>({ name: "", date: "", reason: "", status: "На рассмотрении", hasPhoto: false })
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null)
  const [showSemesterStats, setShowSemesterStats] = useState(false)

  const handleSendMessage = () => {
    if (messageContact && messageText.trim()) {
      setSentMessages((prev) => [...prev, { to: messageContact, text: messageText.trim() }])
      setMessageText("")
      setMessageContact(null)
    }
  }

  const toggleAttendance = (student: string, lessonIdx: number) => {
    setAttendance((prev) => {
      const cur = prev[student][selectedDay][lessonIdx]
      // null (присутствует) → false (неуваж) → "excused" (уваж) → null
      const next: AttendanceVal = cur === null ? false : cur === false ? "excused" : null
      return {
        ...prev,
        [student]: {
          ...prev[student],
          [selectedDay]: { ...prev[student][selectedDay], [lessonIdx]: next },
        },
      }
    })
  }

  const saveDay = () => {
    const snap: Record<string, Record<number, AttendanceVal>> = {}
    STUDENTS.forEach(s => {
      snap[s] = { ...attendance[s][selectedDay] }
    })
    setSavedRecords(prev => ({
      ...prev,
      [`${selectedWeek}-${selectedDay}`]: { attendance: snap, disciplines: disciplines[selectedDay] },
    }))
  }

  // Подсчёт пропусков из сохранённых записей
  const countAbsencesSaved = (student: string) => {
    let unexcused = 0, excused = 0
    Object.values(savedRecords).forEach(rec => {
      const stuRec = rec.attendance[student]
      if (!stuRec) return
      rec.disciplines.forEach((disc, li) => {
        if (disc.trim()) {
          if (stuRec[li] === false) unexcused++
          if (stuRec[li] === "excused") excused++
        }
      })
    })
    return { unexcused, excused }
  }

  // Подсчёт пропусков за текущий день (не сохранённый)
  const countDayAbsences = () => {
    let unexcused = 0, excused = 0
    STUDENTS.forEach(student => {
      [0, 1, 2].forEach(li => {
        const disc = disciplines[selectedDay][li]
        if (disc.trim()) {
          const v = attendance[student][selectedDay][li]
          if (v === false) unexcused++
          if (v === "excused") excused++
        }
      })
    })
    return { unexcused, excused }
  }

  const weekDate = useMemo(() => {
    const d = new Date(SEMESTER_START)
    d.setDate(d.getDate() + selectedWeek * 7 + selectedDay)
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
  }, [selectedWeek, selectedDay])

  const isEvenWeek = (selectedWeek + 1) % 2 === 0

  const setDiscipline = (dayIdx: number, lessonIdx: number, value: string) => {
    setDisciplines((prev) => {
      const arr = [...prev[dayIdx]] as [string, string, string]
      arr[lessonIdx] = value
      return { ...prev, [dayIdx]: arr }
    })
  }

  const getAttendanceSymbol = (val: AttendanceVal) => {
    if (val === false) return { sym: "Н", cls: "text-red-500 bg-red-50" }
    if (val === "excused") return { sym: "У", cls: "text-blue-500 bg-blue-50" }
    return { sym: "·", cls: "text-gray-200 bg-gray-50" }
  }

  const countPresent = (student: string) => {
    let absent = 0, total = 0
    DAYS.forEach((_, di) => {
      [0, 1, 2].forEach((li) => {
        const disc = disciplines[di][li]
        if (disc.trim()) {
          total++
          if (attendance[student][di][li] !== null) absent++
        }
      })
    })
    const present = total - absent
    return total > 0 ? `${present}/${total}` : "—"
  }

  const getAbsenceColor = (unexcused: number) => {
    if (unexcused === 0) return "text-gray-400"
    if (unexcused >= 36) return "text-red-600 font-bold"
    if (unexcused >= 20) return "text-orange-500 font-bold"
    return "text-green-600 font-semibold"
  }

  const exportExcel = () => {
    const rows = STUDENTS.map((s, i) => {
      const { unexcused, excused } = countAbsencesSaved(s)
      return { "№": i + 1, "Студент": s, "Неуваж. пропуски": unexcused, "Уваж. пропуски": excused, "Итого пропусков": unexcused + excused }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Пропуски")
    XLSX.writeFile(wb, "пропуски_семестр.xlsx")
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("Propuski za semestr", 14, 16)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Gruppa: ИСП-21`, 14, 24)
    autoTable(doc, {
      startY: 30,
      head: [["#", "Student", "Neuvazh.", "Uvazh.", "Vsego"]],
      body: STUDENTS.map((s, i) => {
        const { unexcused, excused } = countAbsencesSaved(s)
        return [i + 1, s, unexcused, excused, unexcused + excused]
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [128, 0, 32] },
    })
    doc.save("propuski_semestr.pdf")
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0" style={{ background: "linear-gradient(135deg, #f8f0f2 0%, #fff5f5 40%, #fce4e8 100%)" }} />

      <motion.div className="fixed z-0 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(128,0,32,0.15) 0%, transparent 70%)", filter: "blur(80px)", top: "-15%", left: "-10%" }}
        animate={{ x: [0, 80, 40, 0], y: [0, 60, 100, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="fixed z-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(192,57,43,0.12) 0%, transparent 70%)", filter: "blur(60px)", bottom: "0%", right: "-10%" }}
        animate={{ x: [0, -60, -20, 0], y: [0, -80, 30, 0], scale: [1, 0.85, 1.1, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 4px 12px rgba(128,0,32,0.3)" }}>
            <span className="text-lg">🎓</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800">Портал старосты</h1>
            <p className="text-xs text-gray-500">Группа ИСП-21</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowMessages(true); setShowProfile(false) }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 8px rgba(128,0,32,0.1)" }}>
            <Icon name="MessageCircle" size={18} className="text-[#800020]" />
            {sentMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                style={{ background: "#800020" }}>{sentMessages.length}</span>
            )}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowProfile(true); setShowMessages(false) }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 8px rgba(128,0,32,0.1)" }}>
            <Icon name="User" size={18} className="text-[#800020]" />
          </motion.button>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="relative z-10 px-6 pt-2 pb-10">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {folders.map((folder, i) => (
            <motion.button key={folder.key}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
              onClick={() => setOpenFolder(folder.key)}
              className="relative rounded-[22px] p-5 text-left overflow-hidden"
              style={glassCard}>
              <div className="absolute inset-x-0 top-0 h-[40%] pointer-events-none"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)", borderRadius: "22px 22px 0 0" }} />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg, rgba(128,0,32,0.1), rgba(192,57,43,0.08))", border: "1px solid rgba(128,0,32,0.12)" }}>
                <Icon name={folder.icon} size={22} className="text-[#800020]" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon name="FolderOpen" size={13} className="text-[#800020] opacity-60" />
                <h3 className="text-[13px] font-bold text-gray-800">{folder.label}</h3>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">{folder.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {(openFolder || showMessages || showProfile) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-end sm:items-center justify-center px-2 pb-2 sm:px-4 sm:pb-4"
            style={{ background: "rgba(60,0,15,0.25)", backdropFilter: "blur(4px)" }}
            onClick={() => { setOpenFolder(null); setShowMessages(false); setShowProfile(false); setMessageContact(null) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[24px]"
              style={{ ...glassCard, background: "rgba(255,255,255,0.82)" }}
              onClick={(e) => e.stopPropagation()}
            >

              {/* ===== ATTENDANCE ===== */}
              {openFolder === "attendance" && (
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="CalendarCheck" size={20} className="text-[#800020]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-gray-800">Посещаемость — ИСП-21</h2>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSemesterStats(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                        style={{ background: "rgba(128,0,32,0.08)", color: "#800020" }}
                      >
                        <Icon name="BarChart2" size={13} />
                        Пропуски за семестр
                      </button>
                      <button onClick={() => setOpenFolder(null)}><Icon name="X" size={20} className="text-gray-400" /></button>
                    </div>
                  </div>

                  {/* Week selector + date badge */}
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(128,0,32,0.04)", border: "1px solid rgba(128,0,32,0.1)" }}>
                    <button onClick={() => setSelectedWeek(w => Math.max(0, w - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                      <Icon name="ChevronLeft" size={16} className="text-[#800020]" />
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-[11px] font-semibold text-[#800020]">{isEvenWeek ? "Чётная неделя" : "Нечётная неделя"} · Неделя {selectedWeek + 1}</div>
                      <div className="text-[13px] font-bold text-gray-800">{weekDate}</div>
                    </div>
                    <button onClick={() => setSelectedWeek(w => w + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                      <Icon name="ChevronRight" size={16} className="text-[#800020]" />
                    </button>
                  </div>

                  {/* Day selector */}
                  <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                    {DAY_SHORT.map((d, i) => (
                      <button key={i} onClick={() => setSelectedDay(i)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                        style={selectedDay === i
                          ? { background: "linear-gradient(135deg, #800020, #c0392b)", color: "#fff", boxShadow: "0 2px 8px rgba(128,0,32,0.3)" }
                          : { background: "rgba(128,0,32,0.06)", color: "#800020", border: "1px solid rgba(128,0,32,0.12)" }}>
                        {d}
                      </button>
                    ))}
                  </div>

                  {/* Discipline inputs */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[0, 1, 2].map((li) => (
                      <div key={li}>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{li + 1}-я пара</label>
                        <input
                          value={disciplines[selectedDay][li]}
                          onChange={(e) => setDiscipline(selectedDay, li, e.target.value)}
                          placeholder="Дисциплина"
                          className="w-full rounded-xl px-3 py-2 text-[12px] text-gray-800 outline-none"
                          style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(128,0,32,0.15)" }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Day summary */}
                  {(() => { const { unexcused, excused } = countDayAbsences(); return (unexcused + excused) > 0 ? (
                    <div className="flex gap-3 mb-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-red-50 text-red-500">
                        <Icon name="UserX" size={12} /> Неуваж.: {unexcused}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-500">
                        <Icon name="UserCheck" size={12} /> Уваж.: {excused}
                      </div>
                    </div>
                  ) : null })()}

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(128,0,32,0.08)" }}>
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr style={{ background: "rgba(128,0,32,0.05)" }}>
                          <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-600 w-8">#</th>
                          <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-600">Студент</th>
                          {[0, 1, 2].map((li) => (
                            <th key={li} className="text-center px-2 py-2.5 text-[11px] font-semibold text-gray-600 min-w-[70px]">
                              <div>{li + 1}-я пара</div>
                              {disciplines[selectedDay][li] && (
                                <div className="text-[9px] font-normal text-[#800020] truncate max-w-[70px]">{disciplines[selectedDay][li]}</div>
                              )}
                            </th>
                          ))}
                          <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-red-500">Н</th>
                          <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-blue-500">У</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STUDENTS.map((student, si) => {
                          const dayUnexcused = [0,1,2].filter(li => disciplines[selectedDay][li].trim() && attendance[student][selectedDay][li] === false).length
                          const dayExcused = [0,1,2].filter(li => disciplines[selectedDay][li].trim() && attendance[student][selectedDay][li] === "excused").length
                          return (
                            <tr key={student} className="border-t border-gray-100 hover:bg-red-50/30 transition-colors">
                              <td className="px-3 py-2 text-[11px] text-gray-400">{si + 1}</td>
                              <td className="px-3 py-2 text-[12px] font-medium text-gray-800 whitespace-nowrap">
                                {student}
                                {student === "Сафронова Айша Сайидовна" && (
                                  <span className="ml-1.5 text-[10px] text-[#800020] font-semibold">(ст-та)</span>
                                )}
                              </td>
                              {[0, 1, 2].map((li) => {
                                const val = attendance[student][selectedDay][li]
                                const { sym, cls } = getAttendanceSymbol(val)
                                return (
                                  <td key={li} className="text-center px-2 py-2">
                                    <button onClick={() => toggleAttendance(student, li)}
                                      className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-all ${cls}`}
                                      title="· присутствует → Н неуваж. → У уваж.">
                                      {sym}
                                    </button>
                                  </td>
                                )
                              })}
                              <td className="text-center px-2 py-2 text-[12px] text-red-500 font-semibold">
                                {dayUnexcused > 0 ? dayUnexcused : "—"}
                              </td>
                              <td className="text-center px-2 py-2 text-[12px] text-blue-500 font-semibold">
                                {dayExcused > 0 ? dayExcused : "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Save button */}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400">· присутствует · Н неуваж. · У уваж.</p>
                    <button
                      onClick={saveDay}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all"
                      style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 2px 10px rgba(128,0,32,0.3)" }}
                    >
                      <Icon name="Save" size={14} />
                      Сохранить
                    </button>
                  </div>
                </div>
              )}

              {/* ===== DEBTS ===== */}
              {openFolder === "debts" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="AlertCircle" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Задолженности</h2>
                    </div>
                    <button onClick={() => setOpenFolder(null)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="space-y-3">
                    {debts.map((row, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: row.status === "Просрочено" ? "rgba(220,38,38,0.1)" : row.status === "Сдано" ? "rgba(22,163,74,0.1)" : "rgba(128,0,32,0.08)" }}>
                          <Icon name={row.status === "Сдано" ? "BookCheck" : "BookX"} size={15} className={row.status === "Просрочено" ? "text-red-500" : row.status === "Сдано" ? "text-green-600" : "text-[#800020]"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800">{row.name}</p>
                          <p className="text-[12px] text-gray-500">{row.subject} — {row.type}</p>
                          <p className="text-[11px] text-gray-400">Срок: {row.deadline}</p>
                        </div>
                        <select
                          value={row.status}
                          onChange={e => setDebts(prev => prev.map((d, j) => j === i ? { ...d, status: e.target.value } : d))}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 border-0 outline-none cursor-pointer ${row.status === "Просрочено" ? "bg-red-100 text-red-600" : row.status === "Сдано" ? "bg-green-100 text-green-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          <option value="Не сдано">Не сдано</option>
                          <option value="Сдано">Сдано</option>
                          <option value="Просрочено">Просрочено</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== DOCUMENTS ===== */}
              {openFolder === "documents" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="FileImage" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Объяснительные</h2>
                    </div>
                    <button onClick={() => setOpenFolder(null)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>

                  {/* Кнопка добавления */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAddDoc(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white transition-colors"
                      style={{ background: "#800020" }}
                    >
                      <Icon name="FilePlus" size={14} />
                      Добавить объяснительную
                    </button>
                  </div>

                  {/* Форма объяснительной */}
                  {showAddDoc && (
                    <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(128,0,32,0.15)" }}>
                      <p className="text-[13px] font-bold text-gray-700">Новая объяснительная</p>
                      <select
                        value={newDoc.name}
                        onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))}
                        className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none"
                      >
                        <option value="">— ФИО студента —</option>
                        {STUDENTS.map(s => <option key={s} value={s.split(" ").slice(0, 2).map((w, i) => i === 0 ? w : w[0] + ".").join(" ")}>{s}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Дата (DD.MM.YYYY)"
                        value={newDoc.date}
                        onChange={e => setNewDoc(d => ({ ...d, date: e.target.value }))}
                        className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Причина"
                        value={newDoc.reason}
                        onChange={e => setNewDoc(d => ({ ...d, reason: e.target.value }))}
                        className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none"
                      />
                      <select
                        value={newDoc.status}
                        onChange={e => setNewDoc(d => ({ ...d, status: e.target.value }))}
                        className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none"
                      >
                        <option>На рассмотрении</option>
                        <option>Принята</option>
                        <option>Отклонена</option>
                      </select>
                      {/* Прикрепить файл */}
                      <label className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-red-50"
                        style={{ background: attachedFile ? "rgba(22,163,74,0.06)" : "rgba(128,0,32,0.05)", border: `1px dashed ${attachedFile ? "rgba(22,163,74,0.4)" : "rgba(128,0,32,0.2)"}` }}>
                        <Icon name={attachedFile ? "FileCheck" : "Paperclip"} size={15} className={attachedFile ? "text-green-600" : "text-[#800020]"} />
                        <span className={`text-[12px] font-medium ${attachedFile ? "text-green-600" : "text-[#800020]"}`}>
                          {attachedFile ? attachedFile.name : "Прикрепить файл или фото"}
                        </span>
                        {attachedFile && (
                          <button type="button" onClick={e => { e.preventDefault(); setAttachedFile(null) }} className="ml-auto">
                            <Icon name="X" size={12} className="text-gray-400" />
                          </button>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const url = URL.createObjectURL(file)
                            setAttachedFile({ url, name: file.name })
                          }}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!newDoc.name || !newDoc.date) return
                            setDocuments(prev => [...prev, {
                              ...newDoc,
                              hasPhoto: !!attachedFile,
                              fileUrl: attachedFile?.url,
                              fileName: attachedFile?.name,
                            }])
                            setNewDoc({ name: "", date: "", reason: "", status: "На рассмотрении", hasPhoto: false })
                            setAttachedFile(null)
                            setShowAddDoc(false)
                          }}
                          className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white"
                          style={{ background: "#800020" }}
                        >Сохранить</button>
                        <button
                          onClick={() => { setShowAddDoc(false); setAttachedFile(null) }}
                          className="px-4 py-2 rounded-xl text-[12px] font-semibold text-gray-500 bg-gray-100"
                        >Отмена</button>
                      </div>
                    </div>
                  )}

                  {/* Список объяснительных */}
                  <div className="space-y-3">
                    {documents.map((doc, i) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[13px] font-semibold text-gray-800">{doc.name}</p>
                          <select
                            value={doc.status}
                            onChange={e => setDocuments(prev => prev.map((d, j) => j === i ? { ...d, status: e.target.value } : d))}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${doc.status === "Принята" ? "bg-green-100 text-green-600" : doc.status === "Отклонена" ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-600"}`}
                          >
                            <option value="На рассмотрении">На рассмотрении</option>
                            <option value="Принята">Принята</option>
                            <option value="Отклонена">Отклонена</option>
                          </select>
                        </div>
                        <p className="text-[12px] text-gray-500 mb-1">Причина: {doc.reason}</p>
                        <p className="text-[11px] text-gray-400 mb-3">Дата: {doc.date}</p>
                        {doc.hasPhoto ? (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ background: "rgba(128,0,32,0.05)", border: "1px dashed rgba(128,0,32,0.2)" }}>
                            <Icon name="Paperclip" size={16} className="text-[#800020]" />
                            <span className="text-[12px] text-[#800020] font-medium truncate">{doc.fileName || "Просмотреть документ"}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg"
                            style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.1)" }}>
                            <Icon name="FileX" size={16} className="text-gray-400" />
                            <span className="text-[12px] text-gray-400">Документ не прикреплён</span>
                          </div>
                        )}
                      </div>
                    ))}


                  </div>
                </div>
              )}

              {/* ===== SURVEY ===== */}
              {openFolder === "survey" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="MessageSquare" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Анкета предложений</h2>
                    </div>
                    <button onClick={() => setOpenFolder(null)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">Поделитесь идеями по улучшению работы корпуса старост. Анкета анонимна.</p>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(128,0,32,0.1)" }}>
                    <iframe src="https://forms.yandex.ru/u/69d6a3b99029021e51760e14" width="100%" height="400" className="block" title="Анкета предложений" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3 text-center">Вставьте ссылку на Яндекс Форму в настройках</p>
                </div>
              )}

              {/* ===== MESSAGES ===== */}
              {showMessages && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="MessageCircle" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Сообщения</h2>
                    </div>
                    <button onClick={() => setShowMessages(false)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>
                  {!messageContact ? (
                    <div className="space-y-2">
                      <p className="text-[12px] text-gray-400 mb-3 uppercase tracking-wide font-semibold">Выберите получателя</p>
                      {CONTACTS.map((c) => (
                        <motion.button key={c.name} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setMessageContact(c.name)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                          style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgba(128,0,32,0.1), rgba(192,57,43,0.07))" }}>
                            <Icon name={c.icon} size={16} className="text-[#800020]" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-800">{c.name}</p>
                            <p className="text-[11px] text-gray-500">{c.role}</p>
                          </div>
                          <Icon name="ChevronRight" size={16} className="text-gray-300 ml-auto" />
                        </motion.button>
                      ))}
                      {sentMessages.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide font-semibold">Отправленные</p>
                          {sentMessages.map((m, i) => (
                            <div key={i} className="p-3 rounded-xl mb-2" style={{ background: "rgba(128,0,32,0.05)", border: "1px solid rgba(128,0,32,0.1)" }}>
                              <p className="text-[11px] text-[#800020] font-semibold">{m.to}</p>
                              <p className="text-[12px] text-gray-600 mt-0.5">{m.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button onClick={() => setMessageContact(null)} className="flex items-center gap-1 text-[12px] text-[#800020] mb-4 hover:opacity-70">
                        <Icon name="ChevronLeft" size={14} /> Назад
                      </button>
                      <p className="text-[13px] font-semibold text-gray-700 mb-3">Кому: {messageContact}</p>
                      <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Введите ваше сообщение..." rows={4}
                        className="w-full rounded-xl px-4 py-3 text-sm text-gray-800 outline-none resize-none mb-3"
                        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(128,0,32,0.15)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }} />
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSendMessage}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 4px 16px rgba(128,0,32,0.3)" }}>
                        <Icon name="Send" size={16} /> Отправить
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* ===== PROFILE ===== */}
              {showProfile && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Личный кабинет</h2>
                    </div>
                    <button onClick={() => setShowProfile(false)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                      style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 4px 20px rgba(128,0,32,0.3)" }}>
                      <Icon name="User" size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Портал старосты</h3>
                    <p className="text-sm text-gray-500 mt-1">Группа ИСП-21</p>
                    <span className="mt-3 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(128,0,32,0.08)", color: "#800020" }}>Староста</span>
                    <div className="w-full mt-6 p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-gray-500">Роль</span>
                        <span className="font-semibold text-gray-800">Староста</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-gray-500">Группа</span>
                        <span className="font-semibold text-gray-800">ИСП-21</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SEMESTER STATS MODAL ===== */}
      <AnimatePresence>
        {showSemesterStats && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowSemesterStats(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[24px] p-6"
              style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 8px 40px rgba(128,0,32,0.18)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="BarChart2" size={20} className="text-[#800020]" />
                  <h2 className="text-base font-bold text-gray-800">Пропуски за семестр</h2>
                </div>
                <button onClick={() => setShowSemesterStats(false)}><Icon name="X" size={20} className="text-gray-400" /></button>
              </div>
              {/* Export buttons */}
              <div className="flex gap-2 mb-4">
                <button onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white transition-colors"
                  style={{ background: "#1a7a4a" }}>
                  <Icon name="FileSpreadsheet" size={14} /> Excel
                </button>
                <button onClick={exportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white transition-colors"
                  style={{ background: "#800020" }}>
                  <Icon name="FileText" size={14} /> PDF
                </button>
              </div>
              <div className="flex gap-3 mb-3 text-[11px] font-semibold flex-wrap">
                <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> 1–19 неуваж.</span>
                <span className="flex items-center gap-1 text-orange-500"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> 20–35</span>
                <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> 36+</span>
                <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Уваж.</span>
              </div>
              <div className="space-y-2">
                {STUDENTS.map((student, si) => {
                  const { unexcused, excused } = countAbsencesSaved(student)
                  const numColor = getAbsenceColor(unexcused)
                  return (
                    <div key={student} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(128,0,32,0.04)", border: "1px solid rgba(128,0,32,0.07)" }}>
                      <span className="text-[11px] text-gray-400 w-5 text-right flex-shrink-0">{si + 1}</span>
                      <span className="flex-1 text-[12px] font-medium text-gray-800 truncate">{student}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className={`text-[14px] ${numColor}`}>{unexcused || 0}</div>
                          <div className="text-[9px] text-gray-400">неуваж</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[14px] text-blue-500 font-semibold">{excused || 0}</div>
                          <div className="text-[9px] text-gray-400">уваж</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}