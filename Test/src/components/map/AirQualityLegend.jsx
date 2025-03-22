import React from 'react';

export const AirQualityLegend = () => {
  return (
    <div className="absolute bottom-16 left-4 bg-white p-2 rounded-md shadow-lg" style={{ zIndex: 999 }}>
      <h3 className="text-sm font-medium mb-1">Air Quality Index</h3>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00e400' }}></div>
        <span className="text-xs">Good (0-50)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffff00' }}></div>
        <span className="text-xs">Moderate (51-100)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff7e00' }}></div>
        <span className="text-xs">Unhealthy for Sensitive Groups (101-150)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff0000' }}></div>
        <span className="text-xs">Unhealthy (151-200)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#99004c' }}></div>
        <span className="text-xs">Very Unhealthy (201-300)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7e0023' }}></div>
        <span className="text-xs">Hazardous (300+)</span>
      </div>
    </div>
  );
};
