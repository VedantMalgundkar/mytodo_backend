import dotenv from "dotenv"
dotenv.config({ path: './.env' });

console.log(process.env.PORT);

import connectDB from "./db/index.js";
import {app} from './app.js'

const PORT = process.env.PORT || 8000 

connectDB()
.then(async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log(`Error in listening: ${error}`);
        }
    })
.catch((error)=>{
    console.log(`MongoDB connection failed : ${error}`);
});
