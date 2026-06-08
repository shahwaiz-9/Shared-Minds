export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    coverPhotoURL: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
}