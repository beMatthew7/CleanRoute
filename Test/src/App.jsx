import { CircleHelpIcon, HeadsetIcon, LogOutIcon, SearchIcon, SettingsIcon, UserIcon, WalletIcon } from 'lucide-react'
import React from 'react'
import { Button ,Tooltip } from "flowbite-react";
import  { useState } from 'react';
import { motion , AnimatePresence  } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";


import Animated from './components/Animated';

const App = () => {
  return (
    <Router>
    
      <div className="h-screen overflow-hidden">
        <Animated />
      </div>
   </Router>
  )
}

export default App