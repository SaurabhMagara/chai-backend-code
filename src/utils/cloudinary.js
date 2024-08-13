import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


//configured cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });


  //uploading images in cloudinary
const uploadCloudinary = async (localFilePath)=>{
    // console.log("starting");
    try {

        if(!localFilePath) return null;

        //upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        });

        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary");
        fs.unlinkSync(localFilePath);
        return response;
       
        
    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath); //remove file if upload file
        return;
    }
}

const destroyCloudinary = async(publicId)=>{
    if(!publicId) return null;
    try {
        const response = await cloudinary.uploader.destroy(publicId);
        console.log("deleting file on cloudinary.");
        return response;
    } catch (error) {
        console.log(err);
        return null;
    }
}

export { uploadCloudinary, destroyCloudinary };

