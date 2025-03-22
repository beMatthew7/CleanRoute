import React from 'react';

export const TransportControls = ({ transportMode, setTransportMode }) => {
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
      <div className="flex space-x-1">
        <button 
          onClick={() => setTransportMode('foot-walking')}
          className={`flex-1 p-1 text-xs rounded ${transportMode === 'foot-walking' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Walking
        </button>
        <button 
          onClick={() => setTransportMode('cycling-regular')}
          className={`flex-1 p-1 text-xs rounded ${transportMode === 'cycling-regular' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Cycling
        </button>
        <button 
          onClick={() => setTransportMode('driving-car')}
          className={`flex-1 p-1 text-xs rounded ${transportMode === 'driving-car' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Driving
        </button>
      </div>
    </div>
  );
};
