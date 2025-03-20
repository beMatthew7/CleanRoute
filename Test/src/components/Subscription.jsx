import{motion} from "framer-motion";
import { Button ,Tooltip } from "flowbite-react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { CircleHelpIcon, HeadsetIcon, LogOutIcon, SearchIcon, SettingsIcon, UserIcon, WalletIcon } from 'lucide-react'


const Subscription = () => {
    return (

      <motion.div 
      className="flex justify-center items-center h-screen w-full bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }} 
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
      >
        <div className="flex flex-row items-center justify-center">
              
              <div className="flex flex-col items-center justify-center h-200 w-130 bg-gray-300 m-7 rounded-3xl hover:bg-gray-800 transition duration-400 ease-in-out hover:scale-110 hover:ring-3 hover:text-cyan-600">
                <div className="flex items-center justify-center w-130 h-30 rounded-t-3xl">
                  Titlu
                </div>
                <div className="flex items-center justify-center w-120 h-140 ">
                  beneficii
                </div>
                <div className="flex items-center justify-center w-130 h-40 rounded-b-3xl">
                  <button className="h-20 w-100 rounded-2xl text-white bg-cyan-600 hover:cursor-pointer text-2xl hover:bg-cyan-700 transition duration-300">
                    Select
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-200 w-130 bg-gray-300 m-7 rounded-3xl hover:bg-gray-800 transition duration-400 ease-in-out hover:scale-110 hover:cursor-pointer hover:ring-3 hover:text-cyan-600">
               <div className="flex items-center justify-center w-130 h-30 rounded-t-3xl">
                  Titlu
                </div>
                <div className="flex items-center justify-center w-120 h-140 ">
                  beneficii
                </div>
                <div className="flex items-center justify-center w-130 h-40 rounded-b-3xl">
                  <button className="h-20 w-100 rounded-2xl text-white bg-cyan-600 hover:cursor-pointer text-2xl hover:bg-cyan-700 transition duration-300">
                    Select
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-200 w-130 bg-gray-300 m-7 rounded-3xl hover:bg-gray-800 transition duration-400 ease-in-out hover:scale-110 hover:cursor-pointer hover:ring-3 hover:text-cyan-600">
                <div className="flex items-center justify-center w-130 h-30 rounded-t-3xl">
                  Titlu
                </div>
                <div className="flex items-center justify-center w-120 h-140 ">
                  beneficii
                </div>
                <div className="flex items-center justify-center w-130 h-40 rounded-b-3xl">
                  <button className="h-20 w-100 rounded-2xl text-white bg-cyan-600 hover:cursor-pointer text-2xl hover:bg-cyan-700 transition duration-300">
                    Select
                  </button>
                </div>
              </div>

            </div>
      </motion.div >





    )
  };
  
  export default Subscription;