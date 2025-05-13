import React from 'react'

const Refundpolicy = () => {
  return (
    <div className="max-w-3xl mx-auto mt-10 mb-20 bg-white shadow-md rounded-md p-6 text-gray-800">
      {/* Orange Block Header */}
      <div className="bg-orange-600 text-white p-4 rounded-md mb-6">
        <h1 className="text-3xl font-bold">Refund Policy</h1>
        <p className="text-sm">Last updated: 07/05/2025</p>
      </div>

      <p className="mb-4">
        Thank you for using MeetKats! If you are not completely satisfied with your purchase, we’re here to help.
      </p>

      <p className="mb-4">
        This refund policy outlines the conditions under which refunds may be issued for purchases made through MeetKats.
      </p>

      <ul className="list-disc ml-6 mb-4">
        <li>Subscription fees are refundable only if you experience technical issues that prevent use of the app’s core features and we cannot resolve them.</li>
        <li>Refunds, if any available, for any technical failure preventing access to service must be requested within 7 days of purchase.</li>
        <li>Refunds are not available for partial months of service.</li>
        <li>Only a valid reason for cancellation shall be entertained.</li>
        <li>If you cancel your ticket on the day of the event, no refund will be delivered to you.</li>
        <li>If you cancel your ticket 48 hours before the event, you will receive 50% of the total purchase amount as refund.</li>
        <li>If you cancel your ticket 4 days before the event, you will receive 75% of the total purchase amount as refund.</li>
        <li>If you cancel your ticket a week before the event, you will receive 90% of the total purchase amount as refund. 10% service charges.</li>
        <li>If a bulk booking is made, one cancelled ticket will lead to the cancellation of the entire order.</li>
        <li>To request a refund, write an email to <strong>official@meetkats.com</strong> with your account ID, purchase receipt, and a brief explanation of the issue.</li>
        <li>Approved refunds will be processed and credited within 7–10 business days to the original method of payment.</li>
        <li>We reserve the right to update this refund policy at any time.</li>
      </ul>

      <h2 className="text-xl font-semibold text-orange-600 mt-6 mb-2">Contact</h2>
      <p>Email: official@meetkats.com</p>
      <p>Address: 237/3C ROOMA KANPUR</p>
    </div>
  )
}

export default Refundpolicy
