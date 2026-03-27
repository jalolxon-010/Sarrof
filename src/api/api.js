import axios from 'axios';

// Backend bilan bog'lanish uchun asosiy sozlamalar
const API = axios.create({
  // Backend serveringiz manzili (odatda 3000-portda bo'ladi)
  baseURL: 'http://localhost:3000/api', 
});

// Agar foydalanuvchi login qilgan bo'lsa, har bir so'rovga tokenni qo'shib yuborish
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;