

// import { getApps, initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';

// const firebaseConfig = {
//     apiKey: "AIzaSyBm3h-eCbqyBAk3AwTPFCX3Kt1Dx2dgvYU",
//     authDomain: "shared-minds-f3c3c.firebaseapp.com",
//     projectId: "shared-minds-f3c3c",
//     storageBucket: "shared-minds-f3c3c.firebasestorage.app",
//     messagingSenderId: "1067965030868",
//     appId: "1:1067965030868:web:987e146505730514a73641",
//     measurementId: "G-5Z233LMNT7"
// };


// const app =
//     getApps().length === 0
//         ? initializeApp(firebaseConfig)
//         : getApps()[0];

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app);


import authModule from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// import storage from '@react-native-firebase/storage';


export const auth = authModule();
export const db = firestore();
// export const storage = storage();