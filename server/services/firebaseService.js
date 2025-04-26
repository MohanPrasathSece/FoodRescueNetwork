const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const bucket = admin.storage().bucket();

/**
 * Upload an image to Firebase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - URL of the uploaded file
 */
const uploadImage = async (fileBuffer, originalName, mimeType) => {
  try {
    // Create a unique filename
    const fileName = `${Date.now()}_${uuidv4()}_${originalName}`;
    const fileUpload = bucket.file(`donations/${fileName}`);

    // Upload the file
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: mimeType
      }
    });

    // Make the file publicly accessible
    await fileUpload.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Firebase:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - The URL of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteImage = async (imageUrl) => {
  try {
    // Extract the file path from the URL
    const filePathMatch = imageUrl.match(/storage\.googleapis\.com\/.*?\/(.+)/);
    if (!filePathMatch) {
      throw new Error('Invalid image URL format');
    }
    
    const filePath = filePathMatch[1];
    const file = bucket.file(filePath);
    
    // Delete the file
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting from Firebase:', error);
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
