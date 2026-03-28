import axios from 'axios';

// Vercel-dagi VITE_API_URL ni o'qiydi. 
// Agar u yerda xato bo'lsa yoki topilmasa, Render-dagi backend manzilingizni zaxira sifatida yozib qo'yamiz.
const baseURL = import.meta.env.VITE_API_URL || 'https://sarrof-backend.onrender.com/api';

const API = axios.create({
  baseURL: baseURL,
});

// Har bir so'rovga tokenni qo'shib yuborish (Interceptors)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;