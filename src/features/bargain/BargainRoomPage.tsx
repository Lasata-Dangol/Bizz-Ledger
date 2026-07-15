import React, { useState, useEffect, useRef } from 'react';
import { BargainRoom, BargainMessage, VegetableListing, UserProfile, Order } from '../../types';
import FeedbackBadge from '../../components/FeedbackBadge';
import { Send, DollarSign, Scale, ArrowLeftRight, Check, X, ShieldAlert, BadgeInfo, ArrowLeft } from 'lucide-react';

interface BargainRoomPageProps {
  rooms: BargainRoom[];
  listings: VegetableListing[];
  currentUser: UserProfile;
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onSubmitMessage: (roomId: string, message: Omit<BargainMessage, 'messageId' | 'timestamp'>) => void;
  onAcceptContract: (roomId: string, finalPrice: number, quantity: number) => void;
  onWithdrawBargain: (roomId: string) => void;
}

export default function BargainRoomPage({
  rooms,
  listings,
  currentUser,
  activeRoomId,
  onSelectRoom,
  onSubmitMessage,
  onAcceptContract,
  onWithdrawBargain
}: BargainRoomPageProps) {
  const activeRoom = rooms.find(r => r.roomId === activeRoomId) || rooms[0];
  const activeListing = listings.find(l => l.id === (activeRoom?.listingId)) || listings[0];

  const [counterPrice, setCounterPrice] = useState<number>(1000);
  const [counterQuantity, setCounterQuantity] = useState<number>(20);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [isTypingSim, setIsTypingSim] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize slider values when activeRoom or item shifts
  useEffect(() => {
    if (activeRoom && activeListing) {
      const lastMsg = activeRoom.messages[activeRoom.messages.length - 1];
      if (lastMsg && lastMsg.pricePerCrate) {
        setCounterPrice(lastMsg.pricePerCrate);
        setCounterQuantity(lastMsg.quantityRequested || 20);
      } else {
        setCounterPrice(activeListing.targetPricePerCrate);
        setCounterQuantity(30);
      }
    }
  }, [activeRoomId]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages, isTypingSim]);

  if (!activeRoom) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <ArrowLeftRight className="text-emerald-500 stroke-[1.5]" size={48} />
        <h3 className="font-bold text-neutral-800 text-lg">No Active Bargain Rooms</h3>
        <p className="text-neutral-500 text-xs max-w-sm">
          Go to "Browse Crops" tab, and click "Propose Price" to start a bargain chat.
        </p>
      </div>
    );
  }

  // Derive turn state
  const lastMessage = activeRoom.messages[activeRoom.messages.length - 1];
  const isMyTurn = lastMessage ? lastMessage.senderId !== currentUser.id : true;
  const isCompleted = activeRoom.status === 'COMPLETED';
  const isWithdrawn = activeRoom.status === 'WITHDRAWN';

  // Get active negotiation pricing information
  const lastOpponentOffer = activeRoom.messages
    .slice()
    .reverse()
    .find(m => m.senderId !== currentUser.id && m.pricePerCrate);

  const lastMyOffer = activeRoom.messages
    .slice()
    .reverse()
    .find(m => m.senderId === currentUser.id && m.pricePerCrate);

  // Simulate an agent reply! Since we want the marketplace to feel active, we can trigger simulated counter offers.
  const handleUserOfferSubmit = (type: 'COUNTER_OFFERED' | 'MESSAGE_TEXT') => {
    if (isCompleted || isWithdrawn) return;

    // First validate constraints if Farmer
    if (currentUser.role === 'FARMER' && type === 'COUNTER_OFFERED' && counterPrice < activeListing.minimumFloorPricePerCrate) {
      alert(`Error: You cannot offer less than your minimum set price of Rs. ${activeListing.minimumFloorPricePerCrate} to avoid a loss.`);
      return;
    }

    if (currentUser.role === 'WHOLESALER' && type === 'COUNTER_OFFERED' && counterPrice > activeListing.targetPricePerCrate * 1.3) {
      alert(`Error: You cannot offer more than 130% of the standard market rate.`);
      return;
    }

    // Submit user's action
    onSubmitMessage(activeRoom.roomId, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      type,
      pricePerCrate: type === 'COUNTER_OFFERED' ? counterPrice : undefined,
      quantityRequested: type === 'COUNTER_OFFERED' ? counterQuantity : undefined,
      text: type === 'MESSAGE_TEXT' ? typedMessage : `Proposed Rs. ${counterPrice} per crate for ${counterQuantity} crates.`
    });

    if (type === 'MESSAGE_TEXT') {
      setTypedMessage('');
    }

    // Trigger AI Simulator typing state
    setIsTypingSim(true);
    setTimeout(() => {
      setIsTypingSim(false);

      // Simple, highly relevant farming response logic matching the vegetable and prices!
      let simulatedReplyText = '';
      let replyType: 'COUNTER_OFFERED' | 'MESSAGE_TEXT' | 'ACCEPTED_CONTRACT' = 'COUNTER_OFFERED';
      let nextPrice = counterPrice;
      const nextQty = counterQuantity;

      const partnerName = currentUser.role === 'FARMER' ? activeRoom.wholesalerName : activeRoom.farmerName;
      const partnerRole = currentUser.role === 'FARMER' ? 'WHOLESALER' : 'FARMER';
      const partnerId = currentUser.role === 'FARMER' ? activeRoom.wholesalerId : activeRoom.farmerId;

      if (currentUser.role === 'WHOLESALER') {
        // Active user is Wholesaler, simulated responder is Farmer (e.g., Pema Shrestha)
        const target = activeListing.targetPricePerCrate;
        const floor = activeListing.minimumFloorPricePerCrate;

        if (counterPrice >= target) {
          // Generous offer! Auto accept!
          replyType = 'ACCEPTED_CONTRACT';
          simulatedReplyText = `Dhanyabad! This matches our target value perfectly. We will locked down the contract at Rs. ${counterPrice} for ${nextQty} crates. Ready to prepare shipment details.`;
        } else if (counterPrice < floor) {
          // Below minimum! Firmer rejection & counter
          nextPrice = Math.round(floor + (target - floor) * 0.4);
          simulatedReplyText = `Namaskar, Rs. ${counterPrice} is below our basic cultivation costs from ${activeListing.district}. Our ultimate lowest limit is Rs. ${floor}, but we can settle for Rs. ${nextPrice} per Crate if you confirm transport quickly.`;
        } else {
          // In between targets
          nextPrice = Math.round(counterPrice + (target - counterPrice) * 0.5);
          if (nextPrice === counterPrice) nextPrice = target;
          simulatedReplyText = `Tomato yields are of supreme quality today. Can we split the difference at Rs. ${nextPrice} per Crate for the ${nextQty} crates?`;
        }
      } else {
        // Active user is Farmer, simulated responder is Wholesaler (e.g. Ramesh Traders)
        const target = activeListing.targetPricePerCrate;
        const floor = activeListing.minimumFloorPricePerCrate;

        if (counterPrice <= floor + 50) {
          // Extremely bargain! Auto accept
          replyType = 'ACCEPTED_CONTRACT';
          simulatedReplyText = `Excellent price! Rs. ${counterPrice} works wonderful for our stock registers in Kalimati. Please approve the checkout invoice so we can dispatch the pickup truck.`;
        } else if (counterPrice > target) {
          // High price, wholesaler counters
          nextPrice = Math.round(target * 0.9);
          simulatedReplyText = `The market is seeing high inflows today from other sectors. We cannot buy at Rs. ${counterPrice}. Our counter is Rs. ${nextPrice} per Crate. Let us know.`;
        } else {
          // Normal counter
          nextPrice = Math.round(counterPrice * 0.92);
          simulatedReplyText = `Okay, we understand. We can raise our bid to Rs. ${nextPrice} per Crate to help support organic Nepalese growers! Let's lock this down.`;
        }
      }

      // Submit simulated agent reply
      if (replyType === 'ACCEPTED_CONTRACT') {
        onAcceptContract(activeRoom.roomId, counterPrice, nextQty);
        // Also send text confirming
        onSubmitMessage(activeRoom.roomId, {
          senderId: partnerId,
          senderName: partnerName,
          senderRole: partnerRole,
          type: 'MESSAGE_TEXT',
          text: simulatedReplyText
        });
      } else {
        onSubmitMessage(activeRoom.roomId, {
          senderId: partnerId,
          senderName: partnerName,
          senderRole: partnerRole,
          type: 'COUNTER_OFFERED',
          pricePerCrate: nextPrice,
          quantityRequested: nextQty,
          text: simulatedReplyText
        });
      }

    }, 1800);
  };

  const handleAcceptByMe = () => {
    if (isCompleted || isWithdrawn) return;
    const finalPrice = lastOpponentOffer?.pricePerCrate || activeListing.targetPricePerCrate;
    const finalQty = lastOpponentOffer?.quantityRequested || 25;
    onAcceptContract(activeRoom.roomId, finalPrice, finalQty);
  };

  const handleWithdrawByMe = () => {
    if (isCompleted || isWithdrawn) return;
    onWithdrawBargain(activeRoom.roomId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      {/* Rooms Selection List column */}
      <div className={`${activeRoomId ? 'hidden lg:flex' : 'flex'} lg:col-span-4 bg-white border border-neutral-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex-col gap-4`}>
        <div>
          <h3 className="text-md font-bold text-neutral-800 tracking-tight">Your Bargain Chats</h3>
          <p className="text-[11px] text-neutral-400">See your active bargain messages</p>
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
          {rooms.map((room) => {
            const isSelected = room.roomId === activeRoomId;
            const rListing = listings.find(l => l.id === room.listingId) || activeListing;
            const lastRoomMsg = room.messages[room.messages.length - 1];
            const roomTurn = lastRoomMsg ? lastRoomMsg.senderId !== currentUser.id : true;

            return (
              <button
                key={room.roomId}
                onClick={() => onSelectRoom(room.roomId)}
                className={`w-full text-left p-3.5 rounded-2xl border transition duration-150 flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-neutral-900 border-neutral-950 text-white shadow-md' 
                    : 'bg-neutral-50/50 hover:bg-neutral-50 border-neutral-150 text-neutral-700'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div>
                    <span className="block text-[10px] font-bold font-mono tracking-wider opacity-80 uppercase leading-none">
                      {room.district}
                    </span>
                    <span className="font-extrabold text-sm block mt-1">{room.cropName}</span>
                  </div>
                  {room.status === 'COMPLETED' ? (
                    <span className="text-[10px] font-bold bg-sky-500/25 text-sky-400 px-2 py-0.5 rounded-full uppercase scale-90">Locked</span>
                  ) : room.status === 'WITHDRAWN' ? (
                    <span className="text-[10px] font-bold bg-neutral-400/25 text-neutral-400 px-2 py-0.5 rounded-full uppercase scale-90">Dead</span>
                  ) : roomTurn ? (
                    <span className="animate-pulse h-2 w-2 rounded-full bg-emerald-400"></span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between pointer-events-none w-full border-t border-neutral-150/10 pt-2 text-[11px]">
                  <span className="opacity-80">
                    With: {currentUser.role === 'FARMER' ? room.wholesalerName : room.farmerName}
                  </span>
                  <span className={`font-mono font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-700'}`}>
                    Last: Rs. {lastRoomMsg?.pricePerCrate || rListing.targetPricePerCrate}/Cr
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat log Column */}
      <div className={`${!activeRoomId ? 'hidden lg:flex' : 'flex'} lg:col-span-8 bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.025)] flex-col justify-between h-[600px]`}>
        {/* Chat top info header */}
        <div className="border-b border-neutral-100 p-5 bg-neutral-50/55 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            {activeRoomId && (
              <button 
                onClick={() => onSelectRoom('')}
                className="lg:hidden p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer mr-0.5"
                title="Back to Bargain List"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <img 
              src={activeListing?.imageUrl} 
              alt={activeRoom.cropName} 
              className="w-11 h-11 rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-neutral-800 text-sm">{activeRoom.cropName}</span>
                <span className="text-[10px] text-neutral-400 font-mono">#{activeRoom.roomId}</span>
              </div>
              <span className="text-xs text-neutral-500 block">
                Negotiating with <span className="font-bold text-neutral-700">{currentUser.role === 'FARMER' ? activeRoom.wholesalerName : activeRoom.farmerName}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <FeedbackBadge 
              status={
                isWithdrawn ? 'WITHDRAWN' : 
                isCompleted ? 'ACCEPTED' : 
                isMyTurn ? 'YOUR_TURN' : 'WAITING'
              } 
            />
          </div>
        </div>

        {/* Message timeline log flow */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-neutral-50/20 max-h-[380px]">
          {activeRoom.messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.id;
            
            return (
              <div 
                key={msg.messageId || i} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Visual bubble metadata line */}
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono uppercase bg-none px-1">
                  <span className="font-black text-neutral-500">{msg.senderName}</span>
                </div>

                {/* Message Cards displaying pricing offers */}
                {msg.type === 'COUNTER_OFFERED' || msg.type === 'OFFER_SUBMITTED' ? (
                  <div className={`p-4 rounded-3xl max-w-sm shadow-xs border ${
                    isMe 
                      ? 'bg-neutral-950 text-white rounded-tr-none border-neutral-950' 
                      : 'bg-white text-neutral-800 rounded-tl-none border-neutral-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2 font-mono">
                      <DollarSign size={15} className={isMe ? 'text-emerald-400 animate-pulse' : 'text-emerald-600'} />
                      <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                        {msg.type === 'COUNTER_OFFERED' ? 'New Counter Offer Price' : 'First Price Offer'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-black font-mono">Rs. {msg.pricePerCrate}</span>
                      <span className="text-xs opacity-75">/ Crate</span>
                    </div>

                    <div className="text-xs font-mono opacity-85 space-y-0.5">
                      <div>Quantity: <span className="font-bold">{msg.quantityRequested} Crates</span></div>
                      <div>Total Sum: <span className="font-bold">Rs. {msg.pricePerCrate && msg.quantityRequested ? (msg.pricePerCrate * msg.quantityRequested).toLocaleString() : 0}</span></div>
                    </div>

                    {msg.text && (
                      <p className="mt-3 pt-2 text-xs border-t border-neutral-500/20 leading-relaxed italic">
                        "{msg.text}"
                      </p>
                    )}
                  </div>
                ) : (
                  // General text bubbles
                  <div className={`p-3.5 rounded-2xl max-w-sm ${
                    isMe 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                  } text-xs leading-relaxed font-semibold`}>
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing state simulator */}
          {isTypingSim && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[10px] text-neutral-400 font-mono uppercase">Thinking...</span>
              <div className="p-3 bg-neutral-100 rounded-2xl text-xs text-neutral-500 font-medium flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce"></span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Lower Shelf Bottom Control Panel */}
        <div className="border-t border-neutral-100 p-4 space-y-3 bg-white">
          {isCompleted ? (
            <div className="bg-sky-50 border border-sky-100 p-4 rounded-3xl flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-sky-800 uppercase tracking-widest font-mono">Invoice Locked</span>
                <span className="text-lg font-black text-sky-950">Approved at Rs. {lastOpponentOffer?.pricePerCrate || 1200} / crate</span>
              </div>
              <div className="text-xs text-sky-700 bg-sky-100/50 px-3 py-1.5 rounded-xl font-bold font-mono uppercase animate-pulse">
                Order details generated
              </div>
            </div>
          ) : isWithdrawn ? (
            <div className="bg-neutral-100/80 p-4 rounded-3xl text-center text-xs text-neutral-500 font-semibold uppercase font-mono tracking-wider">
              🚫 Negotiation Has Terminated (Withdrawn)
            </div>
          ) : (
            <>
              {/* Dynamic Turn Message warning */}
              {!isMyTurn ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-3 rounded-2xl flex items-center gap-2">
                  <BadgeInfo size={14} className="text-amber-600 shrink-0" />
                  <span>Waiting for the other person to reply. Buttons are locked until they send a message.</span>
                </div>
              ) : null}

              {/* Slider shelf for bidding price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-2xl">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-600">Your Proposed Price</span>
                    <span className="text-emerald-700 font-extrabold text-[13px] font-mono">Rs. {counterPrice} / Cr</span>
                  </div>
                  <input 
                    type="range"
                    min={activeListing.minimumFloorPricePerCrate}
                    max={activeListing.targetPricePerCrate * 1.25}
                    step={25}
                    value={counterPrice}
                    disabled={!isMyTurn}
                    onChange={(e) => setCounterPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                    <span>Floor: Rs. {activeListing.minimumFloorPricePerCrate}</span>
                    <span>Target: Rs. {activeListing.targetPricePerCrate}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-600">Number of Crates</span>
                    <span className="text-neutral-800 font-extrabold text-[13px] font-mono">{counterQuantity} Crates</span>
                  </div>
                  <input 
                    type="range"
                    min={5}
                    max={activeListing.quantityAvailableCrates}
                    step={5}
                    value={counterQuantity}
                    disabled={!isMyTurn}
                    onChange={(e) => setCounterQuantity(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                    <span>Min: 5 Cr</span>
                    <span>Max Available: {activeListing.quantityAvailableCrates} Cr</span>
                  </div>
                </div>
              </div>

              {/* Chat action triggers */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-2">
                  <button 
                    onClick={handleAcceptByMe}
                    disabled={!isMyTurn}
                    className="flex-1 shrink-0 bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 focus:outline-hidden hover:bg-emerald-700 duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check size={14} />
                    Confirm & Agree Price
                  </button>

                  <button 
                    onClick={() => handleUserOfferSubmit('COUNTER_OFFERED')}
                    disabled={!isMyTurn}
                    className="flex-1 bg-neutral-900 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 focus:outline-hidden hover:bg-neutral-850 duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeftRight size={14} />
                    Send New Price
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleWithdrawByMe}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X size={14} />
                    Cancel Bargain
                  </button>

                  <div className="relative flex-1 sm:max-w-xs flex gap-2">
                    <input 
                      type="text"
                      placeholder="Type a message..."
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && typedMessage && handleUserOfferSubmit('MESSAGE_TEXT')}
                      disabled={!isMyTurn}
                      className="w-full pl-3 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden disabled:opacity-50"
                    />
                    <button 
                      onClick={() => handleUserOfferSubmit('MESSAGE_TEXT')}
                      disabled={!typedMessage || !isMyTurn}
                      className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-40 cursor-pointer"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
}
