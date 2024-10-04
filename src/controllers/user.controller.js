import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/apiResponse.js"

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
    const coverImageLocalPath = req.files?.cover[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
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

export { registerUser }