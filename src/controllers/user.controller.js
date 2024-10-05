import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

//generate access and refresh token
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and acess token");
    }
}

//register
const registerUser = asyncHandler( async (req, res) => {
    //get users details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary
    //create user object - create entry in db
    //remove password and refresh token from response
    //check for user creation 
    //return response


    //get users details from frontend
    const { username, email, fullname, password } = req.body;

    //validation - not empty
    if (
        [fullname, email, username, password].some( (field) => field?.trim() === "" )
    ) {
        throw new ApiError(400, "All field are required");
    }

    //check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    //check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    //check for user creation 
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succefully")
    )

})

//login
const loginUser = asyncHandler( async(req, res) => {
    //get credintial from user
    //check if user exists or not
    //check if password match or not in database
    //generate access and refresh token
    //send cookies

    const { email, password, username } = req.body;

    if(!(username || email)){
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
         $or: [{username}, {email}]
    });

    if(!user){
        throw new ApiError(404, "User doesn't exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

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
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

//logout
const logoutUser = asyncHandler( async(req, res) => {
    //clear refreshToken
    //clear cookie
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken){
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedRefreshToken?._id);
        
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }
