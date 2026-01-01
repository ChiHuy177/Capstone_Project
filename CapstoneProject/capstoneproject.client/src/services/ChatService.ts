import apiClient from '../utils/apiClient';

export const ChatService = () => ({
    getAllMessage: async () => {
        const result = await apiClient.get('api/chat/messages');
        if (result.status) {
            return result.data;
        }
    },

    countAllMessage: async () => {
        const result = await apiClient.get('api/chat/count');
        if (result.status) {
            return result.data;
        }
    },
});
