import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { Todo } from "../models/todo.model.js"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {mongoose} from 'mongoose';

const createTodo = asyncHandler(async(req,res)=>{

    const {todo,completed} = req.body

    if (!todo){
        return new ApiError(400,"todo or userId is missing")
    }

    const newTodo = await Todo.create({
        todo,
        completed : completed||false,
        userId:req?.user?._id,
    })

    const createdTodo = await Todo.findById(newTodo._id)

    if (!createdTodo){
        return new ApiError(500,"Something went wrong while creating the todo")
    }
    
    return res.status(201)
    .json(new ApiResponse(201,createdTodo,"Todo created successfully."))
})

const updateTodo = asyncHandler(async(req,res)=>{
    const { todoId } = req.params
    
    const requestedTodo = await Todo.findById(todoId)

    if(!requestedTodo){
        return new ApiError(400,"todo not found") 
    }

    if (requestedTodo.userId.toString() !== req?.user._id.toString()){
        return new ApiError(403,"user is not authorized to update this todo.")
    }

    const {todo,completed} = req.body

    if (todo == undefined && completed == undefined) {
        return new ApiError(400,"Atleast one field is required.")
    }

    const newTodo = await Todo.findByIdAndUpdate(todoId,{
        todo,
        completed : completed||false,
    })

    const createdTodo = await Todo.findById(newTodo._id)
    
    if (!createdTodo){
        return new ApiError(500,"Something went wrong while updating the todo")
    }
    
    return res.status(201)
    .json(new ApiResponse(201,createdTodo,"Todo updated successfully."))
})

const deleteTodo = asyncHandler(async(req,res)=>{
    const { todoId } = req.params

    const requestedTodo = await Todo.findById(todoId)

    if(!requestedTodo){
        return new ApiError(400,"todo not found") 
    }

    if (requestedTodo.userId.toString() !== req.user?._id.toString()){
        return new ApiError(403,"user is not authorized to delete this todo.")
    }

    const deletedTodo = await Todo.findByIdAndDelete(todoId)

    if (!deletedTodo){
        return new ApiError(500,"Something went wrong while deleting the todo")
    }
    
    return res.status(201)
    .json(new ApiResponse(201,deletedTodo,"Todo deleted successfully."))
})

const getAllTodos = asyncHandler(async(req,res)=>{

    const { page = 1, 
        limit = 10,
        status ,
        query } = req.query;

    const pipeline = []

    if(query){
        pipeline.push({
            $search: {
                index: "search_todo",
                text: {
                    query:query,
                    path: "todo"
                }
            }
        })
    }

    pipeline.push(
        {
            $match: {
                "userId": req.user._id
            }
        }

    );


    if (status){
        if (status !== "all"){
            pipeline.push(
                {
                    $match: {
                      "completed":status === 'true'
                    }
                }
            );
        }

    }

    
    
    pipeline.push(
        {
            $sort: {
                "createdAt": 1
            }

        }
    );

    const todoAggregate = Todo.aggregate(pipeline)

    const options = {
        page: parseInt(page),
        limit: parseInt(limit,10)
    };

    const todos = await Todo.aggregatePaginate(todoAggregate,options)

    return res.status(200)
    .json(new ApiResponse(200,todos,"Todos fetched successfully."));
    
});

export {
    createTodo,
    updateTodo,
    deleteTodo,
    getAllTodos
}