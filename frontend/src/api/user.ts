import api from "@/util/authUtils";
import { getAuthToken } from "@/api/auth";

export const getDiscordStatus = async () => {
    return await api.get('/user/discord-status', {
        headers: { Authorization: `Bearer ${getAuthToken}` }
    });
}

export const getGoogleStatus = async () => {
    return await api.get('/user/google-status', {
        headers: { Authorization: `Bearer ${getAuthToken}` }
    });
}

export const postAuthentication = async (action: "login" | "register" | "verify", payload: any) => {
    return await api.post(`/user/${action}`, payload);
}
