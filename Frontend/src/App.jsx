import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Context/ProtectedRoute';
import Login from './Pages/Login/Login';
import HomePage from './Pages/HomePage/HomePage';
import CryptoDetail from './Components/CryptoDetail/CryptoDetail';
import Signup from './Pages/Login/Signup';


const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            // <ProtectedRoute>
              <HomePage />
            // </ProtectedRoute>
          } />
          <Route path="/crypto/:symbol" element={
            // <ProtectedRoute>
              <CryptoDetail />
            // </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
