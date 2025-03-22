import React, { useState, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { TransportControls } from './TransportControls';

export const SearchBar = ({ 
  startAddress, setStartAddress,
  endAddress, setEndAddress,
  retryGeolocation, resetPoints,
  fetchRoute, loading, start, end,
  transportMode, setTransportMode,
  API_URL,
  setStart, setEnd // Add these explicitly
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState(null);
  
  // Search address functionality
  const searchAddress = async (query) => {
    if (!query || query.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_URL}/geocode`, {
        params: { query }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching for address:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounce search
  const debouncedSearch = useRef(
    debounce(searchAddress, 500)
  ).current;
  
  // Handle address input changes
  const handleStartAddressChange = (e) => {
    const value = e.target.value;
    setStartAddress(value);
    setActiveSearchField('start');
    debouncedSearch(value);
  };
  
  const handleEndAddressChange = (e) => {
    const value = e.target.value;
    setEndAddress(value);
    setActiveSearchField('end');
    debouncedSearch(value);
  };
  
  // Select from search results
  const selectSearchResult = (result) => {
    if (!result || !result.center) {
      console.error('Invalid search result:', result);
      return;
    }
    
    try {
      const [lng, lat] = result.center;
      
      if (activeSearchField === 'start') {
        console.log('Setting start location:', [lat, lng]);
        setStart([lat, lng]);
        setStartAddress(result.place_name);
      } else if (activeSearchField === 'end') {
        console.log('Setting end location:', [lat, lng]);
        setEnd([lat, lng]);
        setEndAddress(result.place_name);
      }
      
      setSearchResults([]);
      setActiveSearchField(null);
    } catch (err) {
      console.error('Error setting location from search result:', err);
    }
  };
  
  return (
    <div className="absolute top-4 left-16 w-80 md:w-96 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3">
        <div className="mb-2">
          <div className="flex justify-between items-center">
            <label htmlFor="start-address" className="block text-sm font-medium text-gray-700 mb-1">Start</label>
            <button
              onClick={retryGeolocation}
              className="text-xs text-blue-500 hover:text-blue-700"
              title="Try to get your current location again"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              My Location
            </button>
          </div>
          <input
            type="text"
            id="start-address"
            className="w-full p-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your starting point"
            value={startAddress}
            onChange={handleStartAddressChange}
            onClick={() => setActiveSearchField('start')}
          />
        </div>
        
        <div className="mb-2">
          <label htmlFor="end-address" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
          <input
            type="text"
            id="end-address"
            className="w-full p-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Where do you want to go?"
            value={endAddress}
            onChange={handleEndAddressChange}
            onClick={() => setActiveSearchField('end')}
          />
        </div>
        
        {/* Transport mode selector - now receiving proper props */}
        <TransportControls transportMode={transportMode} setTransportMode={setTransportMode} />
        
        {/* Search results dropdown */}
        {searchResults.length > 0 && activeSearchField && (
          <div className="absolute left-0 right-0 bg-white mt-0.5 rounded-md shadow-lg max-h-60 overflow-y-auto z-51">
            {searchResults.map((result, index) => (
              <div 
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => selectSearchResult(result)}
              >
                {result.place_name}
              </div>
            ))}
          </div>
        )}
        
        {isSearching && (
          <div className="text-center text-xs text-gray-500">Searching...</div>
        )}
        
        <div className="flex justify-between mt-2">
          <button 
            onClick={resetPoints}
            className="bg-gray-200 text-gray-700 px-2 py-1 text-sm rounded hover:bg-gray-300"
          >
            Reset
          </button>
          
          <button 
            onClick={fetchRoute}
            disabled={!start || !end || loading}
            className={`px-2 py-1 text-sm rounded ${!start || !end || loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {loading ? 'Loading...' : 'Get Route'}
          </button>
        </div>
      </div>
    </div>
  );
};
