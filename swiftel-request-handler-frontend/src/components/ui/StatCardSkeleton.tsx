import React from 'react';

const StatCardSkeleton: React.FC = () => {
  return (
    <div className="stat-card skeleton-card">
      <div className="stat-card-icon skeleton-icon"></div>
      <div className="stat-card-info">
        <h3 className="skeleton-text skeleton-text-short"></h3>
        <p className="skeleton-text skeleton-text-long"></p>
      </div>
    </div>
  );
};

export default StatCardSkeleton;