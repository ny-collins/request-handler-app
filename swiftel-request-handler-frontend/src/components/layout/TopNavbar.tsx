import { useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

type ScreenSize = 'small' | 'medium' | 'large';

interface TopNavbarProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
    screenSize: ScreenSize;
}

// Helper to get a user-friendly title from the pathname
const getPageTitle = (pathname: string) => {
    const title = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';
    return title.charAt(0).toUpperCase() + title.slice(1);
};

const TopNavbar = ({ toggleSidebar, isSidebarOpen, screenSize }: TopNavbarProps) => {
    const location = useLocation();
    const pageTitle = getPageTitle(location.pathname);

    const showToggleButton = screenSize !== 'large';

    return (
        <header className="top-navbar">
            <div className="flex items-center gap-4">
                {showToggleButton ? (
                    <button onClick={toggleSidebar} className="hamburger-menu">
                        {isSidebarOpen ? <FiX /> : <FiMenu />}
                    </button>
                ) : (
                    <div className="w-8"></div> // Placeholder for alignment
                )}
                <h1 className="text-2xl font-bold text-primary">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-6">
                <NotificationBell />
            </div>
        </header>
    );
};

export default TopNavbar;
