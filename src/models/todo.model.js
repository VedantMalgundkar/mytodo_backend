import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const todoSchema = new Schema({
    todo:{
        type:String,
        required:true,
        trim:true
    },
    completed:{
        type:Boolean,
        default:false
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

todoSchema.plugin(mongooseAggregatePaginate)

export const Todo = mongoose.model("Todo",todoSchema)