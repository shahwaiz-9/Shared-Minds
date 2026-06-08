// Firebase Social Auth configuration constants
// Plug in your credentials here to enable social authentication on iOS/Android (Expo Go).
// On Web, Firebase handles popup authentication natively without needing these client-side IDs.
export const SOCIAL_CONFIG = {
    google: {
        webClientId: "1067965030868-kf29j5ttpec4mou6ngms6sjcr9m7r0e7.apps.googleusercontent.com",     // e.g., "1067965030868-xxxxxxxx.apps.googleusercontent.com"
        iosClientId: "",     // iOS-specific OAuth client ID
        androidClientId: "", // Android-specific OAuth client ID
    },
    github: {
        clientId: "Ov23liWUtNZ17Pr3d89r",        // GitHub OAuth App Client ID
        clientSecret: "a0aa3f9d034afad72e3ad57da3b5ac3d04605678",    // Note: Exposing secret in client is for demo/development purposes.
    }
};
