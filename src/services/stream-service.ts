import { StreamChat } from 'stream-chat';

const apiKey = import.meta.env.VITE_STREAM_API_KEY || 'YOUR_STREAM_API_KEY';
const userId = import.meta.env.VITE_STREAM_USER_ID || 'user_1';
const userToken = import.meta.env.VITE_STREAM_USER_TOKEN || 'YOUR_STREAM_USER_TOKEN';

export const chatClient = StreamChat.getInstance(apiKey);

export const connectUser = async () => {
    if (chatClient.userID) return; // Already connected

    try {
        await chatClient.connectUser(
            {
                id: userId,
                name: 'John Doe',
                image: 'https://getstream.io/random_svg/?id=user_1&name=John+Doe',
            },
            userToken
        );
        console.log('Stream Chat user connected successfully');
    } catch (error) {
        console.error('Error connecting to Stream Chat:', error);
    }
};

export const disconnectUser = async () => {
    await chatClient.disconnectUser();
    console.log('Stream Chat user disconnected');
};
