import axios from "axios";


const apiClient = axios.create({
    baseURL: 'https://localhost:5026/',
    timeout: 10000,
    withCredentials: true,
});


export default apiClient;
