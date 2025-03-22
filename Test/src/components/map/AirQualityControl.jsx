import React from 'react';

export const AirQualityControl = ({ 
  showAirSensors, 
  toggleAirSensors, 
  loadingAirSensors,
  // Add new props for healthy route
  useHealthyRoute,
  toggleHealthyRoute,
  loadingHealthyRoute,
  canShowHealthyRoute
}) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col space-y-2">
      <button
        onClick={toggleAirSensors}
        disabled={loadingAirSensors}
        className={`${
          showAirSensors ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
        } text-white font-bold py-2 px-4 rounded shadow-lg transition-colors duration-200`}
      >
        {loadingAirSensors ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <span>{showAirSensors ? 'Hide Air Quality' : 'Show Air Quality'}</span>
        )}
      </button>
      
      {/* Always show the Healthy Route button if start and end points exist */}
      {canShowHealthyRoute && (
        <button 
          onClick={toggleHealthyRoute}
          disabled={loadingHealthyRoute}
          className={`${
            useHealthyRoute ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
          } text-white font-bold py-2 px-4 rounded shadow-lg transition-colors duration-200 flex items-center justify-center`}
        >
          {loadingHealthyRoute ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              {useHealthyRoute ? 'Hide Healthy Route' : 'Find Healthy Route'}
            </>
          )}
        </button>
      )}
    </div>
  );
};
