import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation failed
        return null;
    }
}

const deleteFromCloudinaryAfterUpdation = async (oldFilePublicID) => {
    try {
      if (!oldFilePublicID) {
        return null;
      }

      // Using promise-based approach for the Cloudinary API
      const response = await cloudinary.uploader.destroy(oldFilePublicID);
      
      if (response.result !== 'ok') {
        console.log("Failed to delete old avatar", response);
        return null;  // You could throw an error here if deletion is critical
      }
  
      console.log("Old avatar deleted successfully", response);
      return response;
      
    } catch (error) {
      console.error("Something went wrong deleting old avatar", error);
      return null; // Or throw new Error("Failed to delete old avatar") based on how you want to handle it
    }
  };
  

export {uploadOnCloudinary, deleteFromCloudinaryAfterUpdation};