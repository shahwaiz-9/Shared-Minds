



export interface Conversation {
    chatid: string;
    subjectid: string;
    senderid: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}



export interface Message {

    messageId: string;
    senderId: string;
    senderType: "user" | "assistant";
    message: string;
    createdAt: Date;

}