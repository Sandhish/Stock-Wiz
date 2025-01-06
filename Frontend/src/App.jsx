import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Context/ProtectedRoute';
import Signup from './Pages/Signup/Signup';
import Login from './Pages/Login/Login';
import Dashboard from './Pages/Dashboard/Dashboard';
import HomePage from './Pages/HomePage/HomePage';
import CryptoPage from './Pages/CryptoPage/CryptoPage';


const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            // <ProtectedRoute>
              <Dashboard />
            // </ProtectedRoute>
          } />
          <Route path="/" element={
            // <ProtectedRoute>
              <HomePage />
            // </ProtectedRoute>
          } />
          <Route path="/crypto/:symbol" element={
            // <ProtectedRoute>
              <CryptoPage />
            // </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
