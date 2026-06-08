import { readAsStringAsync } from 'expo-file-system/legacy';

const CLOUDINARY_CLOUD_NAME = 'dlbdj8sb6';
const CLOUDINARY_UPLOAD_PRESET = 'Shared Minds';

export const uploadToCloudinary = async (imageUri: string, publicId?: string): Promise<string> => {
    try {
        // 1. Get the file as a base64 string
        const base64 = await readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // 2. Format as a Data URI (Cloudinary requires this for base64 uploads)
        const base64Uri = `data:image/jpeg;base64,${base64}`;

        // 3. Prepare the JSON payload
        const payload = {
            file: base64Uri,
            upload_preset: CLOUDINARY_UPLOAD_PRESET,
            public_id: publicId, // Optional: cloud name/path identifier
        };


        // 4. Send as JSON (No FormData needed)
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to upload image');
        }

        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary Base64 upload error:', error);
        throw error;
    }
};