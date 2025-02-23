import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; 

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    
    const {fullName,email,password} = req.body

    if ([fullName,email,password].some((field)=>field?.trim() === "")){
        throw new ApiError(400,"All Fields are required")
    }

    const existedUser = await User.findOne({email});

    if (existedUser){
        throw new ApiError(409,"User with email or username already exsists")
    }

    const user = await User.create({
        fullName,
        email,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(201,createdUser,"User registered successfully."))

})

const loginUser = asyncHandler(async (req, res) =>{
    const {email, password} = req.body
    
    if (!email) {
        throw new ApiError(400, "email is required")
    }

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
        
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {...loggedInUser._doc, accessToken, refreshToken},
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refereshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try {   

        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user?._id)

        const options = {
            httpOnly: true,
            secure: true
        }
        
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,
            {
                accessToken,
                refreshToken
            },
            "Access token refreshed."
        ))
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token")
    }

})

const updatePasswordUser = asyncHandler(async(req,res)=>{
    const { oldPassword,newPassword } = req.body
    const user = await User.findById(req.user?._id)

    const result = await user.isPasswordCorrect(oldPassword)

    if (!result){
        throw new ApiError(404,"Password is incorrect.")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully."))

})

const updateDetailsUser = asyncHandler(async (req,res)=>{
    const {fullName,email} = req.body

    if (!fullName && !email){
        throw new ApiError(401,"Atleast one field shoud be there.")
    }

    const updateData = {}

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;

    const result = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        {new:true}
        ).select("-password -refreshToken");


    if(!result){
        throw new ApiError(401,error?.message|| "user updates failed")
    }

    res.status(200)
    .json(new ApiResponse(200,result,"data updated successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully."))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refereshAccessToken,
    updatePasswordUser,
    updateDetailsUser,
    getCurrentUser,
}