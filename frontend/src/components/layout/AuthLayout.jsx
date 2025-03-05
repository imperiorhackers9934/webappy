import React from 'react';
import { Link } from 'react-router-dom';
import img from "../../assets/MeetKats.jpg"
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <div className="flex justify-center">
            <img src={img} alt="" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">MeetKats</h2>
        </Link>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connect with professionals and grow your network
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {children}
      </div>
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-sm text-gray-500">
          <p>© 2023 ProfNet. All rights reserved.</p>
          </div>
      </div>
    </div>
  );
};

export default AuthLayout;
