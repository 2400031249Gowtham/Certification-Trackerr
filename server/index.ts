import express from "express"

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3000

app.use(express.json())

// Home
app.get("/", (_req, res) => {
  res.send("Server running - all data stored in browser localStorage")
})

// Note: All auth and certification data is stored in browser localStorage only.
// No backend persistence. See client/src/lib/localAuth.ts and client/src/lib/localData.ts

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
  console.log(`All data is stored in browser localStorage - no backend persistence`)
})
