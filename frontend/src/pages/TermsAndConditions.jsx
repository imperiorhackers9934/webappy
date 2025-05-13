import React from 'react'

const TermsAndConditions = () => {
  return (
    <div className="max-w-3xl mx-auto mt-10 mb-20 bg-white shadow-md rounded-md p-6 text-gray-800">
      {/* Orange Block for Terms and Last Updated */}
      <div className="bg-orange-600 text-white p-4 rounded-md mb-6">
        <h1 className="text-3xl font-bold">Terms & Conditions</h1>
        <p className="text-sm">Last updated: 07/05/2025</p>
      </div>

      <p className="mb-4">
        Welcome to MeetKats! These Terms and Conditions govern your use of MEETKATS CREATIONS PRIVATE LIMITED, a mobile and web application operated by us. By downloading or using our app, you agree to these terms.
      </p>

      <h2 className="text-xl font-semibold text-orange-600 mt-6 mb-2">Terms of Use</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>You must be 13 years or older to use the App. You agree not to misuse our services.</li>
        <li>You agree not to misuse our service, interfere with normal operations, hack, or violate any local, state, national, or international law.</li>
        <li>Keep your password safe. You are responsible for activities under your account.</li>
        <li>We shall have complete access to your location and any data shared from your account.</li>
        <li>Data entered at the time of sign-up shall also be accessed by the company, if need be.</li>
        <li>Certain features are only unlocked after subscription. Payments are only acceptable through proper gateways.</li>
        <li>Any kind of vulgarity on the app may lead to suspension of the account.</li>
        <li>If any fraud event is found on any user’s end, the account shall be suspended, and required actions will be undertaken against the account.</li>
        <li>We are not responsible for any data loss or indirect, incidental, or consequential damages arising from your use of the app.</li>
        <li>All intellectual property rights in the app and its content belong to MeetKats. Unauthorized use is prohibited.</li>
        <li>We reserve the right to suspend or terminate your access to the app, with/without any notice, at our sole discretion if you violate these Terms.</li>
        <li>We may update these Terms from time to time. Continued use of the app means you accept the new Terms.</li>
        <li>These Terms are governed by the laws of India.</li>
      </ul>

      <h2 className="text-xl font-semibold text-orange-600 mt-6 mb-2">Contact</h2>
      <p>Email: official@meetkats.com</p>
      <p>Address: 237/3C ROOMA KANPUR</p>
    </div>
  )
}

export default TermsAndConditions
