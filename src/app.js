import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit:"1mb"}))
app.use(express.urlencoded({extended:true,limit:"1mb"}))
app.use(cookieParser())

// import routes
import userRouter from "./routes/user.routes.js"
import todoRouter from "./routes/todo.routes.js"

app.use("/auth",userRouter)
app.use("/todos",todoRouter)

export {app}