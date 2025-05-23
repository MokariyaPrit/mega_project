import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import userRoutes from "./src/routes/user.routes.js"

const app = express()

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes
app.use("/api/v1/users", userRoutes)




export { app }
