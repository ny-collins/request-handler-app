import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {
    return (
        <div className="stat-card">
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-info">
                <h3>{title}</h3>
                <p>{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
