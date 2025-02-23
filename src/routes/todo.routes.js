import { Router } from "express"
import { 
    createTodo,
    updateTodo,
    deleteTodo,
    getAllTodos
 } from "../controllers/todo.controller.js" 
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)


router.route("/").get(getAllTodos)
router.route("/add").post(createTodo)
router.route("/:todoId").patch(updateTodo)
router.route("/:todoId").delete(deleteTodo)

export default router