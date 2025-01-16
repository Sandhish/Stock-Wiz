import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Context/ProtectedRoute';
import Login from './Pages/Login/Login';
import UserPage from './Pages/UserPage/UserPage';
import CryptoDetail from './Components/CryptoDetail/CryptoDetail';
import Signup from './Pages/Login/Signup';
import Portfolio from './Pages/Portfolio/Portfolio';
import DepositFunds from './Components/AddingFund/AddingFund';


const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route path="/portfolio" element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          } />

          <Route path="/crypto/:symbol" element={
            <ProtectedRoute>
              <CryptoDetail />
            </ProtectedRoute>
          } />

          <Route path="/funds" element={
            <ProtectedRoute>
              <DepositFunds />
            </ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
