import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="not-found-container">
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </div>
    );
};

export default NotFound;
