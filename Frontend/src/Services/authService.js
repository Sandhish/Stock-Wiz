import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BACKEND_API}/api/auth`;

export const signup = async (formData) => {
  const response = await axios.post(`${API_URL}/signup`, formData);
  return response.data; 
};

export const login = async (formData) => {
  const response = await axios.post(`${API_URL}/login`, formData);
  return response.data;
};
