import apiClient from '../utils/apiClient';

export default class ChatService {
    static async getAllMessage() {
        const result = await apiClient.get('api/chat/messages');
        if (result.status) {
            return result.data;
        }
    }

    static async countAllMessage() {
        const result = await apiClient.get('api/chat/count');
        if (result.status) {
            return result.data;
        }
    }
}
