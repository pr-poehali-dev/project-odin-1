import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { User } from "@/App"
import Icon from "@/components/ui/icon"

interface DashboardPageProps {
  user: User
  onLogout: () => void
}

type FolderKey = "attendance" | "debts" | "documents" | "survey" | null

const ATTENDANCE_DATA = [
  { name: "Алексеев Д.С.", oct: "✓", nov: "✓", dec: "—", jan: "✓", total: "3/4" },
  { name: "Борисова А.М.", oct: "✓", nov: "✓", dec: "✓", jan: "✓", total: "4/4" },
  { name: "Васильев К.О.", oct: "—", nov: "✓", dec: "—", jan: "—", total: "1/4" },
  { name: "Григорьев П.Е.", oct: "✓", nov: "—", dec: "✓", jan: "✓", total: "3/4" },
  { name: "Дмитриева С.В.", oct: "✓", nov: "✓", dec: "✓", jan: "—", total: "3/4" },
  { name: "Егоров Н.А.", oct: "—", nov: "—", dec: "✓", jan: "✓", total: "2/4" },
  { name: "Жукова Т.Р.", oct: "✓", nov: "✓", dec: "✓", jan: "✓", total: "4/4" },
]

const DEBTS_DATA = [
  { name: "Алексеев Д.С.", subject: "Математика", type: "Контрольная", deadline: "15.01.2025", status: "Не сдано" },
  { name: "Васильев К.О.", subject: "Физика", type: "Лабораторная", deadline: "20.01.2025", status: "Не сдано" },
  { name: "Васильев К.О.", subject: "История", type: "Реферат", deadline: "10.01.2025", status: "Просрочено" },
  { name: "Егоров Н.А.", subject: "Английский", type: "Тест", deadline: "25.01.2025", status: "Не сдано" },
]

const DOCUMENTS = [
  { name: "Алексеев Д.С.", date: "10.01.2025", reason: "Болезнь", status: "Принята", hasPhoto: true },
  { name: "Васильев К.О.", date: "05.12.2024", reason: "Семейные обстоятельства", status: "На рассмотрении", hasPhoto: true },
  { name: "Егоров Н.А.", date: "15.11.2024", reason: "Медицинские процедуры", status: "Принята", hasPhoto: false },
]

const CONTACTS = [
  { role: "Декан", name: "Смирнова Елена Ивановна", icon: "GraduationCap" },
  { role: "Методист", name: "Козырева Наталья Павловна", icon: "ClipboardList" },
  { role: "Зам. по воспитательной работе", name: "Морозов Андрей Витальевич", icon: "Users" },
  { role: "Преподаватель математики", name: "Лебедев Игорь Сергеевич", icon: "BookOpen" },
  { role: "Преподаватель физики", name: "Орлова Светлана Николаевна", icon: "Atom" },
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

export function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [openFolder, setOpenFolder] = useState<FolderKey>(null)
  const [showMessages, setShowMessages] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [messageContact, setMessageContact] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sentMessages, setSentMessages] = useState<{ to: string; text: string }[]>([])

  const handleSendMessage = () => {
    if (messageContact && messageText.trim()) {
      setSentMessages((prev) => [...prev, { to: messageContact, text: messageText.trim() }])
      setMessageText("")
      setMessageContact(null)
    }
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
            <p className="text-xs text-gray-500">Группа {user.group}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowMessages(true); setShowProfile(false) }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 8px rgba(128,0,32,0.1)" }}
          >
            <Icon name="MessageCircle" size={18} className="text-[#800020]" />
            {sentMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                style={{ background: "#800020" }}>{sentMessages.length}</span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowProfile(true); setShowMessages(false) }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 8px rgba(128,0,32,0.1)" }}
          >
            <Icon name="User" size={18} className="text-[#800020]" />
          </motion.button>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="relative z-10 px-6 pt-2 pb-10">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {folders.map((folder, i) => (
            <motion.button
              key={folder.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenFolder(folder.key)}
              className="relative rounded-[22px] p-5 text-left overflow-hidden"
              style={glassCard}
            >
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-end sm:items-center justify-center px-4 pb-4"
            style={{ background: "rgba(60,0,15,0.25)", backdropFilter: "blur(4px)" }}
            onClick={() => { setOpenFolder(null); setShowMessages(false); setShowProfile(false); setMessageContact(null) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[24px]"
              style={{ ...glassCard, background: "rgba(255,255,255,0.75)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Attendance */}
              {openFolder === "attendance" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="CalendarCheck" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Посещаемость — {user.group}</h2>
                    </div>
                    <button onClick={() => setOpenFolder(null)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                          <th className="text-left pb-3 pr-4 font-semibold">Студент</th>
                          <th className="text-center pb-3 px-2 font-semibold">Окт</th>
                          <th className="text-center pb-3 px-2 font-semibold">Ноя</th>
                          <th className="text-center pb-3 px-2 font-semibold">Дек</th>
                          <th className="text-center pb-3 px-2 font-semibold">Янв</th>
                          <th className="text-center pb-3 pl-4 font-semibold">Итого</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ATTENDANCE_DATA.map((row) => (
                          <tr key={row.name} className="hover:bg-red-50/40 transition-colors">
                            <td className="py-2.5 pr-4 font-medium text-gray-800 text-[13px]">{row.name}</td>
                            {[row.oct, row.nov, row.dec, row.jan].map((v, i) => (
                              <td key={i} className="text-center px-2">
                                <span className={`text-xs font-bold ${v === "✓" ? "text-green-600" : "text-red-400"}`}>{v}</span>
                              </td>
                            ))}
                            <td className="text-center pl-4 text-[12px] font-semibold text-[#800020]">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-4">✓ — присутствовал, — — отсутствовал</p>
                </div>
              )}

              {/* Debts */}
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
                    {DEBTS_DATA.map((row, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: row.status === "Просрочено" ? "rgba(220,38,38,0.1)" : "rgba(128,0,32,0.08)" }}>
                          <Icon name="BookX" size={15} className={row.status === "Просрочено" ? "text-red-500" : "text-[#800020]"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800">{row.name}</p>
                          <p className="text-[12px] text-gray-500">{row.subject} — {row.type}</p>
                          <p className="text-[11px] text-gray-400">Срок: {row.deadline}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${row.status === "Просрочено" ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {openFolder === "documents" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Icon name="FileImage" size={20} className="text-[#800020]" />
                      <h2 className="text-lg font-bold text-gray-800">Объяснительные</h2>
                    </div>
                    <button onClick={() => setOpenFolder(null)}><Icon name="X" size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="space-y-3">
                    {DOCUMENTS.map((doc, i) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[13px] font-semibold text-gray-800">{doc.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${doc.status === "Принята" ? "bg-green-100 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500 mb-1">Причина: {doc.reason}</p>
                        <p className="text-[11px] text-gray-400 mb-3">Дата: {doc.date}</p>
                        {doc.hasPhoto ? (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                            style={{ background: "rgba(128,0,32,0.05)", border: "1px dashed rgba(128,0,32,0.2)" }}>
                            <Icon name="ImageIcon" size={16} className="text-[#800020]" />
                            <span className="text-[12px] text-[#800020] font-medium">Просмотреть документ</span>
                          </div>
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

              {/* Survey */}
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
                    <iframe
                      src="https://forms.yandex.ru/u/your-form-id/"
                      width="100%"
                      height="400"
                      className="block"
                      title="Анкета предложений"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3 text-center">Вставьте ссылку на Яндекс Форму в настройках</p>
                </div>
              )}

              {/* Messages */}
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
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Введите ваше сообщение..."
                        rows={4}
                        className="w-full rounded-xl px-4 py-3 text-sm text-gray-800 outline-none resize-none mb-3"
                        style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(128,0,32,0.15)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendMessage}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 4px 16px rgba(128,0,32,0.3)" }}
                      >
                        <Icon name="Send" size={16} />
                        Отправить
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* Profile */}
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
                    <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Группа {user.group}</p>
                    <span className="mt-3 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(128,0,32,0.08)", color: "#800020" }}>星 Специальная роль</span>

                    <div className="w-full mt-6 p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(128,0,32,0.08)" }}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-gray-500">Роль</span>
                        <span className="font-semibold text-gray-800">Голова группы</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-gray-500">Группа</span>
                        <span className="font-semibold text-gray-800">{user.group}</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onLogout}
                      className="mt-5 w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: "rgba(128,0,32,0.06)", color: "#800020", border: "1px solid rgba(128,0,32,0.15)" }}
                    >
                      <Icon name="LogOut" size={16} />
                      Выйти
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}