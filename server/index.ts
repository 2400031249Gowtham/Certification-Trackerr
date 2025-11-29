import express from "express"

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3000

app.use(express.json())

// Simple in-memory user store for demo purposes
const users: Record<string, any> = {
  admin: { id: "1", username: "admin", fullName: "Administrator", email: "admin@example.com", role: "admin" },
  john: { id: "2", username: "john", fullName: "John Doe", email: "john@example.com", role: "user" },
}

// Home
app.get("/", (_req, res) => {
  res.send("Server is running")
})

// Register endpoint - accepts { username, password, fullName, email }
app.post("/api/auth/register", (req, res) => {
  const { username, password, fullName, email } = req.body || {}
  if (!username || !password || !fullName || !email) {
    return res.status(400).json({ error: "Missing registration fields" })
  }

  if (users[username]) {
    return res.status(409).json({ error: "Username already exists" })
  }

  const id = String(Object.keys(users).length + 1)
  const user = { id, username, fullName, email, role: "user" }
  users[username] = user

  return res.status(201).json(user)
})

// Login endpoint - accepts { username, password }
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: "Missing login fields" })
  }

  // For demo, accept the known demo passwords: admin/admin123 and john/user123
  if ((username === "admin" && password === "admin123") || (username === "john" && password === "user123")) {
    const user = users[username]
    return res.json(user)
  }

  // Also allow any registered user with any password for demo purposes
  if (users[username]) {
    return res.json(users[username])
  }

  return res.status(401).json({ error: "Invalid credentials" })
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
