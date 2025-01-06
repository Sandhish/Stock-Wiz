import axios from 'axios';

const API_URL = 'http://localhost:5000/api/cryptos';

export const fetchCryptos = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    return [];
  }
};

export const fetchCryptoDetails = async (symbol) => {
  try {
    const response = await axios.get(`${API_URL}/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    return null;
  }
};
