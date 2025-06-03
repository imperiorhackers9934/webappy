import { Share2Icon, MapPin, ExternalLink } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { FooterBlock } from "../BhoomiLandingPage/sections/FooterBlock";
import { format } from "date-fns";
import { AddToCalendarButton } from 'add-to-calendar-button-react';

export const EventDetailPage = ()=> {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [comments, setComments] = useState([
    {
      id: 1,
      name: "John Doe",
      comment: "This looks amazing! Can't wait to attend.",
      timestamp: new Date("2024-01-20T10:00:00"),
      replies: [
        {
          id: 2,
          name: "Jane Smith",
          comment: "Me too! See you there!",
          timestamp: new Date("2024-01-20T11:30:00"),
        }
      ]
    }
  ]);

  const guests = [
    { name: "Florence Pugh", role: "Scientist", image: "https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg" },
    { name: "Sebastian Stan", role: "VC", image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg" },
    { name: "Florence Pugh", role: "Scientist", image: "https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg" },
    { name: "Sebastian Stan", role: "VC", image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg" },
  ];

  const venue = {
    name: "Chatrapati Sahu Ji Maharaj University",
    address: "Kalyanpur, Kanpur, Uttar Pradesh 208024",
    coordinates: "26.5123°N, 80.2329°E"
  };

  const responseButtons = [
    { id: 'going', label: 'Going', count: 42, color: '#22c55e' },
    { id: 'maybe', label: 'Maybe', count: 15, color: '#eab308' },
    { id: 'cantGo', label: "Can't Go", count: 8, color: '#ef4444' }
  ];

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-full max-w-[1440px] relative">
        {/* Hero Section */}
        <div className="w-full relative">
          {/* Background with blur effect */}
          <div 
            className="absolute inset-0 bg-[url(https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg)] bg-cover bg-center"
            style={{
              filter: 'blur(8px)',
              transform: 'scale(1.1)',
              zIndex: 0
            }}
          />
          
          {/* Content overlay */}
          <div className="relative z-10 bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-8 md:py-11">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Movie Poster */}
                <div className="w-full md:w-[261px] h-[392px] bg-[url(https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg)] bg-cover bg-center rounded-lg shadow-lg flex-shrink-0" />

                {/* Movie Details */}
                <div className="flex flex-col max-w-full md:max-w-[441px]">
                  <div className="flex items-start justify-between">
                    <h1 className="font-['Roboto',Helvetica] font-bold text-black text-3xl md:text-4xl mb-4 md:mb-6">
                      Thunderbolts*
                    </h1>
                    <Button
                      variant="outline"
                      className="bg-white/80 backdrop-blur-sm rounded-[10px] border-black/30 flex items-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      <Share2Icon className="w-5 h-5" />
                      <span className="font-['Roboto',Helvetica] text-sm">Share</span>
                    </Button>
                  </div>

                  <p className="font-['Roboto',Helvetica] font-normal text-black text-base text-justify line-clamp-6 md:line-clamp-none">
                    Thunderbolts* are the *New Avengers who mix grit with wit as they bring a new hope to the world.
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                  </p>

                  <div className="mt-6">
                    <AddToCalendarButton
                      name="Thunderbolts Event"
                      description="Join us for an exciting event featuring the New Avengers!"
                      startDate="2024-02-20"
                      startTime="09:00"
                      endDate="2024-02-20"
                      endTime="19:00"
                      timeZone="America/New_York"
                      location={venue.address}
                      options={['Google', 'Apple', 'Microsoft365', 'iCal']}
                      buttonStyle="3d"
                    />
                  </div>

                  <div className="flex gap-4 mt-6">
                    {responseButtons.map((button) => (
                      <button
                        key={button.id}
                        className={`px-6 py-3 rounded-lg border-2 transition-all flex items-center gap-2 text-sm font-semibold ${
                          selectedResponse === button.id
                            ? 'text-white'
                            : 'text-black hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: selectedResponse === button.id ? button.color : 'transparent',
                          borderColor: button.color,
                          color: selectedResponse === button.id ? '#ffffff' : button.color
                        }}
                        onClick={() => setSelectedResponse(button.id)}
                      >
                        {button.label}
                        <span
                          className="px-2 py-1 rounded-full text-xs"
                          style={{
                            backgroundColor: selectedResponse === button.id ? 'rgba(255,255,255,0.2)' : button.color,
                            color: '#ffffff'
                          }}
                        >
                          {button.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Info Cards */}
                <div className="flex flex-col gap-8 w-full md:w-auto md:ml-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-x-16 md:gap-y-8">
                    <div className="text-center md:text-left">
                      <h3 className="font-['Roboto',Helvetica] font-semibold text-black text-xl md:text-2xl mb-2">
                        Venue
                      </h3>
                      <p className="font-['Roboto',Helvetica] font-light text-black text-base max-w-[203px] mx-auto md:mx-0">
                        {venue.name}
                        <br />
                        Exer - D Hall <br />
                        9:00 AM - 7:00PM
                      </p>
                    </div>

                    <div className="text-center md:text-left">
                      <h3 className="font-['Roboto',Helvetica] font-semibold text-black text-xl md:text-2xl mb-2">
                        Organiser
                      </h3>
                      <p className="font-['Roboto',Helvetica] font-light text-black text-base max-w-[203px] mx-auto md:mx-0">
                        IIT Kanpur
                        <br />
                        &amp;
                        <br />
                        CSJMU Kanpur
                      </p>
                      <a href="#" className="inline-block mt-2 text-textblue underline text-sm">
                        View Profile
                      </a>
                    </div>

                    <div className="text-center md:text-left">
                      <h3 className="font-['Roboto',Helvetica] font-semibold text-black text-xl md:text-2xl mb-2">
                        Prizes
                      </h3>
                      <p className="font-['Roboto',Helvetica] font-light text-black text-base max-w-[203px] mx-auto md:mx-0">
                        $ 1,00,000
                      </p>
                    </div>

                    <div className="text-center md:text-left">
                      <h3 className="font-['Roboto',Helvetica] font-semibold text-black text-xl md:text-2xl mb-2">
                        Goodies
                      </h3>
                      <p className="font-['Roboto',Helvetica] font-light text-black text-base max-w-[203px] mx-auto md:mx-0">
                        Macbook Pro, Iphone
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="container mx-auto px-4 md:px-10 mt-12">
          <h2 className="font-['Roboto',Helvetica] font-bold text-black text-2xl mb-4">
            About the Event
          </h2>
          <p className="font-['Roboto',Helvetica] font-normal text-black text-base mb-8">
            Thunderbolts* are the *New Avengers who mix grit with wit as they
            bring a new hope to the world.
          </p>

          {/* Location Section */}
          <div className="mb-12">
            <h2 className="font-['Roboto',Helvetica] font-bold text-black text-2xl mb-4">
              Location
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="w-5 h-5 mt-1 text-textblue" />
                <div>
                  <h3 className="font-['Roboto',Helvetica] font-semibold text-lg mb-1">{venue.name}</h3>
                  <p className="text-gray-600">{venue.address}</p>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.coordinates)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-textblue hover:text-textblue/80 transition-colors"
              >
                <span className="mr-2">Get Directions</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="w-full h-[400px] rounded-lg overflow-hidden">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3571.3040658175474!2d${venue.coordinates.split(',')[1]}!3d${venue.coordinates.split(',')[0]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399c386b66777c23%3A0x2c97d221f622a6fc!2sChhatrapati%20Shahu%20Ji%20Maharaj%20University!5e0!3m2!1sen!2sin!4v1674432931544!5m2!1sen!2sin`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Guests Section */}
          <h2 className="font-['Roboto',Helvetica] font-bold text-black text-2xl mb-4">
            Guests
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {guests.map((guest, index) => (
              <Card key={index} className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center">
                  <img
                    className="w-[120px] h-[120px] object-cover mb-2 rounded-lg"
                    alt={guest.name}
                    src={guest.image}
                  />
                  <p className="font-['Roboto',Helvetica] font-normal text-black text-base">
                    {guest.name}
                  </p>
                  <p className="font-['Roboto',Helvetica] font-extralight text-black text-xs">
                    {guest.role}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Discussion Section */}
          <div className="mb-12">
            <h2 className="font-['Roboto',Helvetica] font-bold text-black text-2xl mb-4">
              Discussion
            </h2>
            
            {/* Comment Form */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold mb-4">Leave a comment</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Name"
                    className="bg-white"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    className="bg-white"
                  />
                </div>
                <Textarea
                  placeholder="Write your comment here..."
                  className="min-h-[100px] bg-white"
                />
                <Button className="bg-textblue hover:bg-textblue/90">
                  Post Comment
                </Button>
              </form>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Comments</h3>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="bg-white border rounded-md px-3 py-1"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {comments.sort((a, b) => 
                sortOrder === "newest" 
                  ? b.timestamp.getTime() - a.timestamp.getTime()
                  : a.timestamp.getTime() - b.timestamp.getTime()
              ).map((comment) => (
                <div key={comment.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">{comment.name}</h4>
                    <span className="text-sm text-gray-500">
                      {format(comment.timestamp, "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{comment.comment}</p>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 mt-4 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-semibold">{reply.name}</h4>
                            <span className="text-sm text-gray-500">
                              {format(reply.timestamp, "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <p className="text-gray-700">{reply.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" className="mt-4">
                    Reply
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <FooterBlock />
      </div>
    </div>
  );
};