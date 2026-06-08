export interface Subject {
    subjectid: string,
    subjectname: string,
    subjectcode: string,
    subjectdescription: string,
    visibility: "public" | "private",
    ownerid: string,
    createdAt: Date,
    updatedAt: Date,
}


export interface SubjectMember {
    memberid: string,
    subjectid: string,
    userid: string,
    role: "owner" | "editor" | "viewer",
    createdAt: Date,
    updatedAt: Date,
}
