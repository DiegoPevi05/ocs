import { join, dirname } from 'path';
import { unlink } from "fs/promises";
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storageDir = process.env.NODE_ENV === "production" ? join(__dirname,"..", 'storage','users') : join(__dirname,"..","..", 'storage','users');

export async function deleteUserProfileImage(imageUrl:string|null) {
  try {
    if(!imageUrl) return { success:false, message:"no image provided" }
    // Extract filename from URL
    const filename = imageUrl.split("/").pop();

    if(!filename) return { success:false, message:"filename not found" };
    // Construct full file path
    const filePath = join(storageDir, filename);

    // Delete the file
    await unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
    
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, message: "Error deleting file", error };
  }
}
