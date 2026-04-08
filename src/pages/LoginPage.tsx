import { useState } from "react"
import { motion } from "framer-motion"
import type { User } from "@/App"

const USERS: { firstName: string; lastName: string; code: string; group: string }[] = [
  { firstName: "Иван", lastName: "Петров", code: "SR-001", group: "ИСП-21" },
  { firstName: "Мария", lastName: "Сидорова", code: "SR-002", group: "ИСП-22" },
  { firstName: "Алексей", lastName: "Козлов", code: "SR-003", group: "ИСП-23" },
  { firstName: "Айша", lastName: "Сафронова", code: "12345", group: "ИСП-21" },
]

interface LoginPageProps {
  onLogin: (user: User) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = USERS.find(
      (u) =>
        u.firstName.toLowerCase() === firstName.trim().toLowerCase() &&
        u.lastName.toLowerCase() === lastName.trim().toLowerCase() &&
        u.code === code.trim()
    )
    if (found) {
      onLogin({ name: `${found.firstName} ${found.lastName}`, group: found.group })
    } else {
      setError("Неверные данные. Проверьте имя, фамилию и код доступа.")
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <div className="fixed inset-0 z-0" style={{ background: "linear-gradient(135deg, #f8f0f2 0%, #fff5f5 40%, #fce4e8 100%)" }} />

      <motion.div
        className="fixed z-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(128,0,32,0.18) 0%, transparent 70%)", filter: "blur(80px)", top: "-10%", left: "-10%" }}
        animate={{ x: [0, 80, 40, 0], y: [0, 60, 100, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed z-0 w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(180,30,60,0.12) 0%, transparent 70%)", filter: "blur(60px)", bottom: "0%", right: "-10%" }}
        animate={{ x: [0, -60, -20, 0], y: [0, -80, 30, 0], scale: [1, 0.85, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative z-10 w-full max-w-[380px]"
      >
        <div
          className="rounded-[28px] px-8 py-10"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.5), 0 8px 32px rgba(128,0,32,0.12), 0 32px 64px rgba(128,0,32,0.08)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 4px 16px rgba(128,0,32,0.35)" }}
            >
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Портал старосты</h1>
            <p className="text-sm text-gray-500 mt-1 text-center">Введите данные для входа</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setError("") }}
                placeholder="Иван"
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(128,0,32,0.15)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setError("") }}
                placeholder="Петров"
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(128,0,32,0.15)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Код доступа</label>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError("") }}
                placeholder="••••••"
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(128,0,32,0.15)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                }}
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white mt-2"
              style={{ background: "linear-gradient(135deg, #800020, #c0392b)", boxShadow: "0 4px 16px rgba(128,0,32,0.35), 0 1px 3px rgba(128,0,32,0.2)" }}
            >
              Войти
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">Код доступа выдаётся администрацией</p>
      </motion.div>
    </main>
  )
}
