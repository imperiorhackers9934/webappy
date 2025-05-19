type="text"  
                            id="firstName"  
                            name="firstName"  
                            value={userInfo.firstName}  
                            onChange={handleUserInfoChange}  
                            required  
                            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                          />  
                        </div>  
                      </div>  
                        
                      <div>  
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">  
                          Last Name <span className="text-orange-500">*</span>  
                        </label>  
                        <div className="mt-1 relative rounded-md shadow-sm">  
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">  
                            <User className="h-5 w-5 text-orange-400" />  
                          </div>  
                          <input  
                            type="text"  
                            id="lastName"  
                            name="lastName"  
                            value={userInfo.lastName}  
                            onChange={handleUserInfoChange}  
                            required  
                            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                          />  
                        </div>  
                      </div>  
                    </div>  
                      
                    <div>  
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">  
                        Email <span className="text-orange-500">*</span>  
                      </label>  
                      <div className="mt-1 relative rounded-md shadow-sm">  
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">  
                          <Mail className="h-5 w-5 text-orange-400" />  
                        </div>  
                        <input  
                          type="email"  
                          id="email"  
                          name="email"  
                          value={userInfo.email}  
                          onChange={handleUserInfoChange}  
                          required  
                          className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                        />  
                      </div>  
                      <p className="mt-1 text-xs text-gray-500">Your tickets will be sent to this email address</p>  
                    </div>  
                      
                    <div>  
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">  
                        Phone (optional)  
                      </label>  
                      <div className="mt-1 relative rounded-md shadow-sm">  
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">  
                          <Phone className="h-5 w-5 text-orange-400" />  
                        </div>  
                        <input  
                          type="tel"  
                          id="phone"  
                          name="phone"  
                          value={userInfo.phone}  
                          onChange={handleUserInfoChange}  
                          className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-orange-300 rounded-md"  
                        />  
                      </div>  
                      <p className="mt-1 text-xs text-gray-500">For important updates about the event</p>  
                    </div>  
                  </div>  
                </div>  
                  
                <div className="hidden sm:block">  
                  <button  
                    type="submit"  
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"  
                  >  
                    Continue to Confirmation  
                    <ChevronRight className="ml-2 h-5 w-5" />  
                  </button>  
                </div>  
              </form>  
            )}  
             
            {/* Step 3: Confirmation */}  
            {step === 3 && (  
              <form onSubmit={handleCompleteBooking}>  
                <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 mb-6">  
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Your Details</h3>  
                    
                  <div className="space-y-6">  
                    {/* Information Summary */}  
                    <div className="border-b border-orange-100 pb-4">  
                      <h4 className="font-medium text-gray-900 mb-2">Attendee Information</h4>  
                      <div className="grid grid-cols-2 gap-4 text-sm">  
                        <div>  
                          <p className="text-gray-500">Name</p>  
                          <p className="font-medium">{userInfo.firstName} {userInfo.lastName}</p>  
                        </div>  
                        <div>  
                          <p className="text-gray-500">Email</p>  
                          <p className="font-medium">{userInfo.email}</p>  
                        </div>  
                        {userInfo.phone && (  
                          <div>  
                            <p className="text-gray-500">Phone</p>  
                            <p className="font-medium">{userInfo.phone}</p>  
                          </div>  
                        )}  
                      </div>  
                    </div>  
                      
                    {/* Ticket Summary */}  
                    <div>  
                      <h4 className="font-medium text-gray-900 mb-2">Ticket Summary</h4>  
                      <div className="space-y-2">  
                        {orderSummary.items.map(item => (  
                          <div key={item.id} className="flex justify-between text-sm">  
                            <span>{item.name} × {item.quantity}</span>  
                            <span className="font-medium">  
                              {item.price > 0   
                                ? formatCurrency(item.price * item.quantity, item.currency)  
                                : 'Free'}  
                            </span>  
                          </div>  
                        ))}  
                      </div>  
                    </div>  
                      
                    {/* Payment Method Selection (only for paid tickets) */}  
                    {orderSummary.total > 0 && (  
                      <div className="border-t border-orange-100 pt-4">  
                        <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>  
                          
                        <div className="space-y-3">  
                          <div className="flex items-center">  
                            <input  
                              id="payment-cashfree"  
                              name="paymentMethod"  
                              type="radio"  
                              checked={paymentMethod === 'cashfree_sdk'}  
                              onChange={() => handlePaymentMethodChange('cashfree_sdk')}  
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500"  
                            />  
                            <label htmlFor="payment-cashfree" className="ml-3 block text-sm font-medium text-gray-700 flex items-center">  
                              <span className="mr-2">Cashfree</span>
                            </label>  
                          </div>  
                            
                          <div className="flex items-center">  
                            <input  
                              id="payment-phonepe"  
                              name="paymentMethod"  
                              type="radio"  
                              checked={paymentMethod === 'phonepe'}  
                              onChange={() => handlePaymentMethodChange('phonepe')}  
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500"  
                            />  
                            <label htmlFor="payment-phonepe" className="ml-3 block text-sm font-medium text-gray-700 flex items-center">  
                              <span className="mr-2">PhonePe</span>  
                            </label>  
                          </div>  
                            
                          {/* Add other payment methods like this: */}  
                          <div className="flex items-center opacity-50 cursor-not-allowed">  
                            <input  
                              id="payment-card"  
                              name="paymentMethod"  
                              type="radio"  
                              disabled  
                              className="h-4 w-4 text-gray-400 focus:ring-orange-500"  
                            />  
                            <label htmlFor="payment-card" className="ml-3 block text-sm font-medium text-gray-500">  
                              Credit/Debit Card (Coming Soon)  
                            </label>  
                          </div>  
                            
                          <div className="flex items-center opacity-50 cursor-not-allowed">  
                            <input  
                              id="payment-upi"  
                              name="paymentMethod"  
                              type="radio"  
                              disabled  
                              className="h-4 w-4 text-gray-400 focus:ring-orange-500"  
                            />  
                            <label htmlFor="payment-upi" className="ml-3 block text-sm font-medium text-gray-500">  
                              UPI (Coming Soon)  
                            </label>  
                          </div>  
                        </div>  
                      </div>  
                    )}  
                      
                    {/* Disclaimer */}  
                    <div className="bg-orange-50 rounded-lg p-4 flex items-start border border-orange-200">  
                      <Info className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />  
                      <div>  
                        <p className="text-sm text-orange-700">  
                          By completing this booking, you agree to our Terms of Service, Privacy Policy, and Refund Policy.   
                          {orderSummary.total > 0   
                            ? " Please review your order details before proceeding to payment."   
                            : " Your free tickets will be sent to your email."}  
                        </p>  
                      </div>  
                    </div>  
                  </div>  
                </div>  
                  
                <div className="hidden sm:block">  
                  <button  
                    type="submit"  
                    disabled={processingPayment}  
                    className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 ${processingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}  
                  >  
                    {processingPayment ? (  
                      <>  
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>  
                        Processing...  
                      </>  
                    ) : (  
                      <>  
                        {orderSummary.total > 0 ? 'Proceed to Payment' : 'Complete Booking'}  
                        <ChevronRight className="ml-2 h-5 w-5" />  
                      </>  
                    )}  
                  </button>  
                </div>  
              </form>  
            )}  
          </div>  
            
          {/* Right Column - Order Summary */}  
          <div className="lg:col-span-1">  
            <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6 sticky top-6">  
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>  
                
              {orderSummary.ticketCount > 0 ? (  
                <>  
                  <div className="space-y-4 mb-6">  
                    {orderSummary.items.map(item => (  
                      <div key={item.id} className="flex justify-between">  
                        <div>  
                          <p className="font-medium">{item.name}</p>  
                          <p className="text-sm text-gray-600">{item.quantity} ticket{item.quantity > 1 ? 's' : ''}</p>  
                        </div>  
                        <div className="font-medium">  
                          {item.price > 0   
                            ? formatCurrency(item.price * item.quantity, item.currency)  
                            : 'Free'}  
                        </div>  
                      </div>  
                    ))}  
                  </div>  
                    
                  {/* Coupon Code Input (Step 1 Only) */}  
                  {step === 1 && orderSummary.subtotal > 0 && (  
                    <div className="flex space-x-2 mb-4">  
                      <input  
                        type="text"  
                        value={couponCode}  
                        onChange={(e) => setCouponCode(e.target.value)}  
                        placeholder="Coupon code"  
                        className="flex-1 focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-orange-300 rounded-md"  
                      />  
                      <button  
                        type="button"  
                        onClick={handleApplyCoupon}  
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"  
                      >  
                        Apply  
                      </button>  
                    </div>  
                  )}  
                    
                  {/* Applied Coupon (All Steps) */}  
                  {couponApplied && (  
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-4 flex items-center">  
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />  
                      <span className="text-sm text-green-800">Coupon applied: {discount}% off</span>  
                    </div>  
                  )}  
                    
                  {/* Price Breakdown */}  
                  <div className="space-y-2 border-t border-orange-200 pt-4">  
                    <div className="flex justify-between text-sm">  
                      <span className="text-gray-600">Subtotal</span>  
                      <span>  
                        {orderSummary.subtotal > 0   
                          ? formatCurrency(orderSummary.subtotal, orderSummary.currency)  
                          : 'Free'}  
                      </span>  
                    </div>  
                      
                    {orderSummary.fees > 0 && (  
                      <div className="flex justify-between text-sm">  
                        <span className="text-gray-600">Service fees</span>  
                        <span>{formatCurrency(orderSummary.fees, orderSummary.currency)}</span>  
                      </div>  
                    )}  
                      
                    {couponApplied && orderSummary.discount > 0 && (  
                      <div className="flex justify-between text-sm text-green-600">  
                        <span>Discount</span>  
                        <span>-{formatCurrency(orderSummary.discount, orderSummary.currency)}</span>  
                      </div>  
                    )}  
                      
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-orange-200 mt-2">  
                      <span>Total</span>  
                      <span>  
                        {orderSummary.total > 0   
                          ? formatCurrency(orderSummary.total, orderSummary.currency)  
                          : 'Free'}  
                      </span>  
                    </div>  
                  </div>  
                    
                  {/* Mobile Submit Button */}  
                  <div className="mt-6 block sm:hidden">  
                    {step === 1 && (  
                      <button  
                        type="button"  
                        onClick={handleSubmit}  
                        disabled={orderSummary.ticketCount === 0}  
                        className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${  
                          orderSummary.ticketCount === 0  
                            ? 'bg-gray-400 cursor-not-allowed'  
                            : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500'  
                        }`}  
                      >  
                        Continue to Information  
                        <ChevronRight className="ml-2 h-5 w-5" />  
                      </button>  
                    )}  
                      
                    {step === 2 && (  
                      <button  
                        type="button"  
                        onClick={handleSubmit}  
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"  
                      >  
                        Continue to Confirmation  
                        <ChevronRight className="ml-2 h-5 w-5" />  
                      </button>  
                    )}  
                      
                    {step === 3 && (  
                      <button  
                        type="button"  
                        onClick={handleCompleteBooking}  
                        disabled={processingPayment}  
                        className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 ${processingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}  
                      >  
                        {processingPayment ? (  
                          <>  
                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>  
                            Processing...  
                          </>  
                        ) : (  
                          <>  
                            {orderSummary.total > 0 ? 'Proceed to Payment' : 'Complete Booking'}  
                            <ChevronRight className="ml-2 h-5 w-5" />  
                          </>  
                        )}  
                      </button>  
                    )}  
                  </div>  
                </>  
              ) : (  
                <div className="text-center py-6">  
                  <Ticket className="w-12 h-12 text-orange-400 mx-auto mb-3" />  
                  <p className="text-gray-600">No tickets selected</p>  
                  <p className="text-sm text-gray-500 mt-2">Select tickets to continue</p>  
                </div>  
              )}  
                
              <div className="mt-6 border-t border-orange-200 pt-4">  
                <div className="flex items-start">  
                  <Info className="h-5 w-5 text-orange-400 mr-2 mt-0.5 flex-shrink-0" />  
                  <p className="text-xs text-gray-500">  
                    {orderSummary.total > 0   
                      ? "All purchases are final. Please review your order details before completing your purchase."  
                      : "Tickets are free but registration is required. Please review your information before completing your booking."}  
                  </p>  
                </div>  
              </div>  
                
              <div className="mt-6 space-y-2">  
                {[  
                  { label: "Privacy Policy", href: "/privacypolicy" },  
                  { label: "Refund Policy", href: "/refundpolicy" },  
                  { label: "Terms of Service", href: "/termsandconditions" },  
                ].map((item) => (  
                  <a  
                    key={item.label}  
                    href={item.href}  
                    className="block text-xs text-gray-600 hover:text-orange-500 underline"  
                    target="_blank"  
                    rel="noopener noreferrer"  
                  >  
                    {item.label}  
                  </a>  
                ))}
              </div>
            </div>  
          </div>  
        </div>  
      </div>  
    </div>  
  );  
};

export default TicketBookingPage;
