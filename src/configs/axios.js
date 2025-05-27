import axios from 'axios';

const baseURL = import.meta.env.VITE_BASE_URL;

if (!baseURL) {
    console.error("Url chưa được thiết lập trong .env");
}

const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 30000,
});

axiosInstance.interceptors.request.use(
    config =>
    {
        const token = localStorage.getItem('access_token');
        if (!config.url.includes('auth/login')&& !config.url.includes('auth/o365'))
        {
            if (token)
            {
                config.headers.Authorization = `Bearer ${token}`;
            }
            else
            {
                localStorage.removeItem('access_token');
                localStorage.removeItem('username');
                localStorage.removeItem('user');
                sessionStorage.clear();
                window.location.href = '/not-found';
                console.log('Token not found');
            }
        }
        return config;
    },
    error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    response => response,
    error =>
    {
        if (error.response)
        {
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
