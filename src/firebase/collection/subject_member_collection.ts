// import { Subject, SubjectMember } from '@/interface/subject';
// import firestore from '@react-native-firebase/firestore';
// import { db } from '../auth/config';
// import { SUBJECTS_COLLECTION, SUBJECT_MEMBERS_SUBCOLLECTION } from './subject_collection';

// export const getSubjectsForUser = async (userId: string): Promise<Subject[]> => {
//     console.log(`[getSubjectsForUser] 🚀 Starting fetch for userId: ${userId}`);
//     try {
//         console.log(`[getSubjectsForUser] 🔍 Querying collectionGroup: '${SUBJECT_MEMBERS_SUBCOLLECTION}'...`);

//         // Utilizing the exact Composite Index workaround built in your console
//         const memberQuerySnap = await db.collectionGroup(SUBJECT_MEMBERS_SUBCOLLECTION)
//             .where('userid', '==', userId)
//             .where('subjectid', '>=', '')
//             .get();

//         console.log(`[getSubjectsForUser] ✅ CollectionGroup query completed. Found ${memberQuerySnap.size} documents.`);

//         if (memberQuerySnap.empty) {
//             console.log('[getSubjectsForUser] 🚪 No memberships found. Returning empty array.');
//             return [];
//         }

//         const subjectIds = memberQuerySnap.docs.map(doc => {
//             const data = doc.data();
//             console.log(`   -> Found Membership Doc ID: ${doc.id} | links to subjectid: ${data.subjectid}`);
//             return data.subjectid;
//         });

//         const uniqueSubjectIds = [...new Set(subjectIds)];
//         console.log(`[getSubjectsForUser] 🧼 Unique subject count to fetch: ${uniqueSubjectIds.length}`);

//         console.log(`[getSubjectsForUser] 🏎️ Triggering concurrent document fetches...`);
//         const subjectPromises = uniqueSubjectIds.map(async (subjectId, index) => {
//             try {
//                 const subjectDoc = await db.collection(SUBJECTS_COLLECTION).doc(subjectId).get();

//                 if (!subjectDoc.exists) {
//                     console.warn(`   ⚠️ [Task ${index}] Document ${subjectId} does not exist in '${SUBJECTS_COLLECTION}'!`);
//                     return null;
//                 }

//                 const data = subjectDoc.data()!;
//                 console.log(`   ✅ [Task ${index}] Successfully retrieved: "${data.subjectname || 'Unnamed'}"`);

//                 return {
//                     subjectid: data.subjectid || subjectDoc.id,
//                     subjectname: data.subjectname || '',
//                     subjectcode: data.subjectcode || '',
//                     subjectdescription: data.subjectdescription || '',
//                     visibility: data.visibility || 'public',
//                     ownerid: data.ownerid || '',
//                     createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
//                     updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
//                 };
//             } catch (innerDocError) {
//                 console.error(`   ❌ [Task ${index}] Failed during fetch for ID ${subjectId}:`, innerDocError);
//                 return null;
//             }
//         });

//         const results = await Promise.all(subjectPromises);
//         const subjects = results.filter((s): s is Subject => s !== null);

//         const sortedSubjects = subjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
//         console.log(`[getSubjectsForUser] 🎉 Done! Returning ${sortedSubjects.length} subjects.`);
//         return sortedSubjects;

//     } catch (error: any) {
//         console.error('💥 [getSubjectsForUser] CRITICAL FAILURE caught in main try/catch block:');
//         console.error('Error Code:', error?.code);
//         console.error('Error Message:', error?.message);
//         throw error;
//     }
// };

// export const getSubjectMembers = async (subjectId: string): Promise<SubjectMember[]> => {
//     try {
//         const memberSnap = await db
//             .collection(SUBJECTS_COLLECTION)
//             .doc(subjectId)
//             .collection(SUBJECT_MEMBERS_SUBCOLLECTION)
//             .get();

//         return memberSnap.docs.map((doc) => {
//             const data = doc.data();
//             return {
//                 memberid: data.memberid || doc.id,
//                 subjectid: data.subjectid || subjectId,
//                 userid: data.userid || '',
//                 role: data.role || 'viewer',
//                 createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
//                 updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
//             };
//         });
//     } catch (error) {
//         console.error('Error fetching subject members:', error);
//         throw error;
//     }
// };

// export const addSubjectMember = async (
//     subjectId: string,
//     memberData: Omit<SubjectMember, 'memberid' | 'createdAt' | 'updatedAt'>
// ): Promise<string> => {
//     try {
//         const memberRef = db
//             .collection(SUBJECTS_COLLECTION)
//             .doc(subjectId)
//             .collection(SUBJECT_MEMBERS_SUBCOLLECTION)
//             .doc();

//         const now = new Date();
//         const newMember: SubjectMember = {
//             memberid: memberRef.id,
//             subjectid: subjectId,
//             userid: memberData.userid,
//             role: memberData.role,
//             createdAt: now,
//             updatedAt: now,
//         };

//         await memberRef.set({
//             memberid: newMember.memberid,
//             subjectid: newMember.subjectid,
//             userid: newMember.userid,
//             role: newMember.role,
//             createdAt: firestore.Timestamp.fromDate(newMember.createdAt),
//             updatedAt: firestore.Timestamp.fromDate(newMember.updatedAt),
//         });

//         return newMember.memberid;
//     } catch (error) {
//         console.error('Error adding subject member:', error);
//         throw error;
//     }
// };