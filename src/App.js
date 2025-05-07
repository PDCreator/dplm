import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import News from './pages/News';
import Places from './pages/Places';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './AuthContext';

function App() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return <div>Загрузка...</div>;

  const isLoggedIn = !!user;
  const isAdmin = user?.is_admin === 1;
  console.log(isAdmin, isLoggedIn)
  return (
    <Router>
      <Navbar
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        onLogout={logout}
      />
      <Routes>
        <Route path="/news" element={<News />} />
        <Route path="/places" element={<Places />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/admin" element={isLoggedIn && isAdmin ? <Admin /> : <Navigate to="/news" />} />
        <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/news" />} />
        <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/news" />} />
        <Route path="*" element={<Navigate to="/news" />} />
      </Routes>
    </Router>
  );
}

export default App;
