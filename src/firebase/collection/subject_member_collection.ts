import { SubjectMember } from '@/interface/subject';
import firestore from '@react-native-firebase/firestore';
import { db } from '../auth/config';

const SUBJECTS_COLLECTION = 'subjects';
const SUBJECT_MEMBERS_SUBCOLLECTION = 'Subject_Members';

export const getSubjectMembers = async (subjectId: string): Promise<SubjectMember[]> => {
    try {
        const memberSnap = await db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_MEMBERS_SUBCOLLECTION)
            .get();

        return memberSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                memberid: data.memberid || doc.id,
                subjectid: data.subjectid || subjectId,
                userid: data.userid || '',
                role: data.role || 'viewer',
                createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as any).toDate() : new Date(),
            };
        });
    } catch (error) {
        console.error('Error fetching subject members:', error);
        throw error;
    }
};

export const addSubjectMember = async (
    subjectId: string,
    memberData: Omit<SubjectMember, 'memberid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const memberRef = db
            .collection(SUBJECTS_COLLECTION)
            .doc(subjectId)
            .collection(SUBJECT_MEMBERS_SUBCOLLECTION)
            .doc();

        const now = new Date();
        const newMember: SubjectMember = {
            memberid: memberRef.id,
            subjectid: subjectId,
            userid: memberData.userid,
            role: memberData.role,
            createdAt: now,
            updatedAt: now,
        };

        await memberRef.set({
            memberid: newMember.memberid,
            subjectid: newMember.subjectid,
            userid: newMember.userid,
            role: newMember.role,
            createdAt: firestore.Timestamp.fromDate(newMember.createdAt),
            updatedAt: firestore.Timestamp.fromDate(newMember.updatedAt),
        });

        return newMember.memberid;
    } catch (error) {
        console.error('Error adding subject member:', error);
        throw error;
    }
};
