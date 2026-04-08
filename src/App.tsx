import { useState } from "react"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"

export interface User {
  name: string
  group: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return <DashboardPage user={user} onLogout={() => setUser(null)} />
}

export default App
