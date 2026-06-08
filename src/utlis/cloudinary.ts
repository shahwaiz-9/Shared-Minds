// Replace these with your actual Cloudinary values
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name_here';
const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset_name_here';

export const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    // 1. Prepare the form data
    const formData = new FormData();
    formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'upload.jpg',
    } as any);

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // 2. Perform the upload
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to upload image');
    }

    // 3. Return the secure URL
    return data.secure_url;
};