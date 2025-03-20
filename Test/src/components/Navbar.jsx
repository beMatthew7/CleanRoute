import { CircleHelpIcon, HeadsetIcon, LogOutIcon, SearchIcon, SettingsIcon, UserIcon, WalletIcon } from 'lucide-react'
import React from 'react'
import { Button ,Tooltip } from "flowbite-react";
import  { useState } from 'react';
import { motion , AnimatePresence  } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";


const Navbar=()=>{
    return (  
        <div class="flex flex-row bg-gray-700 items-center  w-full justify-center overflow-auto">
       <Tooltip content="Money" placement="bottom"  className="p-4 flex items-center justify-center" style="light">
              <Link to="/subscription" className="flex items-center justify-center p-4 bg-gray-400 m-5 mx-20 rounded-3xl hover:rounded-2xl tranistion duration-400 hover:cursor-pointer ring-2 text-white hover:bg-gray-600"><WalletIcon /></Link>
       </Tooltip>

        <Tooltip content="Profile" placement="bottom"  className="p-4 flex items-center justify-center" style="light">
              <Link to="/profile" className="flex items-center justify-center p-4 bg-gray-400 m-5 mx-20 rounded-3xl hover:rounded-2xl tranistion duration-400 hover:cursor-pointer ring-2 text-white hover:bg-gray-600"><UserIcon/></Link>
        </Tooltip>

        <Tooltip content="Settings" placement="bottom"  className="p-4 flex items-center justify-center" style="light"> 
              <Link to="/settings" className="flex items-center justify-center p-4 bg-gray-400 m-5 mx-20 rounded-3xl hover:rounded-2xl tranistion duration-400 hover:cursor-pointer ring-2 text-white hover:bg-gray-600"><SettingsIcon/></Link>
        </Tooltip>

        <Tooltip content="Help" placement="bottom"  className="p-4 flex items-center justify-center" style="light">
              <Link  to="/help"  className="flex items-center justify-center p-4 bg-gray-400 m-5 mx-20 rounded-3xl hover:rounded-2xl tranistion duration-400 hover:cursor-pointer ring-2 text-white hover:bg-gray-600"><CircleHelpIcon/></Link>
        </Tooltip>
      </div>  
                
    )

}

export default Navbar;