import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import TopNavbar from './components/layout/TopNavbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MakeRequest from './pages/MakeRequest';
import ViewRequests from './pages/ViewRequests';
import Users from './pages/Users';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

type ScreenSize = 'small' | 'medium' | 'large';

function getScreenSize(): ScreenSize {
    if (window.innerWidth < 768) return 'small';
    if (window.innerWidth < 1024) return 'medium';
    return 'large';
}

function App() {
    const { user } = useAuth();
    const [screenSize, setScreenSize] = useState<ScreenSize>(getScreenSize());
    const [isSidebarOpen, setIsSidebarOpen] = useState(getScreenSize() === 'large');

    const handleResize = useCallback(() => {
        const newScreenSize = getScreenSize();
        setScreenSize(newScreenSize);
        // Adjust sidebar state based on screen size changes
        if (newScreenSize === 'large') {
            setIsSidebarOpen(true); // Always open on large screens
        } else {
            setIsSidebarOpen(false); // Default to closed on medium/small
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (user && screenSize !== 'large') {
            setIsSidebarOpen(false);
        }
    }, [user, screenSize]);

    const toggleSidebar = useCallback(() => {
        // Sidebar cannot be closed on large screens
        if (screenSize !== 'large') {
            setIsSidebarOpen(prevState => !prevState);
        }
    }, [screenSize]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && screenSize !== 'large' && isSidebarOpen) {
                toggleSidebar();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen, screenSize, toggleSidebar]);

    if (!user) {
        return (
            <div className="auth-container">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Login />} />
                </Routes>
            </div>
        );
    }
    
    const appContainerClasses = `app-container screen-${screenSize} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`;

    return (
        <div className={appContainerClasses}>
            <div className="mobile-overlay" onClick={toggleSidebar}></div>
            <TopNavbar 
                toggleSidebar={toggleSidebar} 
                isSidebarOpen={isSidebarOpen}
                screenSize={screenSize}
            />
            <Navbar 
                isSidebarOpen={isSidebarOpen}
                screenSize={screenSize}
                toggleSidebar={toggleSidebar} // Pass the toggle function
            />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Common Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

                    {/* Employee Routes */}
                    <Route path="/make-request" element={<ProtectedRoute roles={['employee']}><MakeRequest /></ProtectedRoute>} />
                    <Route path="/my-requests" element={<ProtectedRoute roles={['employee']}><ViewRequests /></ProtectedRoute>} />
                    
                    {/* Board & Admin Routes */}
                    <Route path="/requests" element={<ProtectedRoute roles={['admin', 'board_member']}><ViewRequests /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute roles={['admin', 'board_member']}><Users /></ProtectedRoute>} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
