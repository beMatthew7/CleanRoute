
import{motion} from "framer-motion";
import { Button ,Tooltip } from "flowbite-react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { CircleHelpIcon, HeadsetIcon, LogOutIcon, SearchIcon, SettingsIcon, UserIcon, WalletIcon } from 'lucide-react'

const Help = () => {
  return (


    <motion.div 
    className="flex justify-center items-center h-screen w-full bg-white"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }} 
    exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
    >
      
      <div className="grid grid-cols-4 items-center justify-center gap-30">
      <div className="flex flex-col justify-center w-100 h-130 bg-blue-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
             <img src="https://images.pexels.com/photos/47547/squirrel-animal-cute-rodents-47547.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Diana</div>
            <div className="flex items-center justify-center text-bla ck bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">  Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-orange-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
         <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
             <img src="https://images.pexels.com/photos/36843/lion-panthera-leo-lioness-animal-world.jpg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
           </div>
         </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Tudor</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-pink-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
              <img src="https://images.pexels.com/photos/18167822/pexels-photo-18167822/free-photo-of-close-up-of-a-cat.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Buruian</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-green-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
              <img src="https://images.pexels.com/photos/67552/giraffe-tall-mammal-africa-67552.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Luca</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-purple-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
              <img src="https://images.pexels.com/photos/236622/pexels-photo-236622.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Alexia</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-amber-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
              <img src="https://images.pexels.com/photos/86405/penguin-funny-blue-water-86405.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Biris</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-red-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
              <img src="https://images.pexels.com/photos/31027922/pexels-photo-31027922/free-photo-of-captivating-close-up-of-burrowing-owl-outdoors.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Billy</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-100 h-130 bg-lime-300 rounded-2xl shadow-cyan-950/50 shadow-lg hover:cursor-pointer transition duration-400 hover:shadow-cyan-950 hover:ring-2 text-cyan-950/50">
          <div className="flex items-center justify-center h-80 w-100 ">
            <div className="flex items-center justify-center bg-white h-70 w-70 rounded-full ring-6">
              <img src="https://images.pexels.com/photos/106686/pexels-photo-106686.jpeg?auto=compress&cs=tinysrgb&w=600" className="h-70 w-70 rounded-full"></img>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-50 w-100 bg-gray-500 rounded-b-2xl">
            <div className="flex items-center justify-center text-white h-13 w-100 rounded-2xl text-2xl">Matei</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Contact</div>
            <div className="flex items-center justify-center text-black bg-gray-300 h-13 w-95 m-4 rounded-2xl text-2xl hover:text-cyan-600 hover:ring-2 hover:bg-gray-700 transition duration-400">Hire</div>
          </div>
        </div>
      </div>
    </motion.div>

  ) 
};

export default Help;