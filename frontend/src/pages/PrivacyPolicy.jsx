import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-orange-500 text-white p-6 rounded-t-lg shadow-md">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm mt-2">Last updated: 07/05/2025</p>
        </div>
        
        {/* Content */}
        <div className="bg-white p-6 rounded-b-lg shadow-md border-t-0 border-x border-b border-gray-200">
          <div className="mb-6">
            <p className="text-orange-600 font-medium text-lg mb-2">Meetkats is committed to protecting your privacy. This privacy policy explains how our social networking app handles your information.</p>
          </div>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">Information We Collect</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-orange-600 mb-2">1. Camera Permission</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Used for scanning QR codes to check in at an event</li>
                <li>To make posts or send photos/videos</li>
                <li>Camera access is only activated when you choose to give permission</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-orange-600 mb-2">2. Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Profile info, email, phone and some data regarding your personal portfolio is captured</li>
                <li>Information you provide when creating content</li>
                <li>Your chats are end-to-end encrypted</li>
              </ul>
            </div>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>To provide social networking features</li>
              <li>To improve app functionality</li>
              <li>To communicate with you about the Service</li>
              <li>To create a pool of valuable connections for you</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">Data Sharing</h2>
            <p className="text-gray-700">Your data is being made available to the necessary partners who want to enhance your living standards.</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">Data Security</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We implement measures to protect your information</li>
              <li>We have a team of cyber security to look after all online hazards</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">User Rights</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Update your information</li>
              <li>Allow or Block your location access</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">Children's Privacy</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Our service is not directed to children under 13</li>
              <li>We do not knowingly collect data from children</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">Changes to This Policy</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Updates will be posted with revision dates</li>
              <li>Continued use implies acceptance</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-orange-500 border-b border-orange-200 pb-2 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-2">For questions about this privacy policy, contact us at:</p>
            <p className="text-gray-700 mb-1"><span className="font-semibold">Email:</span> official@meetkats.com</p>
            <p className="text-gray-700"><span className="font-semibold">Address:</span> 237/3C ROOMA KANPUR</p>
          </section>
          
          <section className="mt-8 pt-6 border-t border-orange-200">
            <a href="#" className="text-orange-600 font-semibold hover:text-orange-800 transition-colors">Terms of Service</a>
          </section>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© 2025 Meetkats. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
