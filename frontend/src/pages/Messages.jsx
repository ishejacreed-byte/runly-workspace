import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ChevronRight } from 'lucide-react';

const Messages = () => {
  const navigate = useNavigate();
  const { user, fetchBadges } = useContext(AuthContext);
  const [unifiedChats, setUnifiedChats] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/conversations/${user.id}`);
        const rawConversations = res.data;

        // 🛠️ SMART FRONTEND GROUPING: Unifies all errands with the same partner
        const partnerMap = new Map();

        rawConversations.forEach(chat => {
          const isCustomer = Number(user.id) === Number(chat.customer_id);
          const partnerId = isCustomer ? chat.helper_id : chat.customer_id;
          const partnerName = isCustomer ? chat.helper_name : chat.customer_name;

          if (!partnerId) return; // Skip if no helper accepted yet

          if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, {
              partner_id: partnerId,
              partner_name: partnerName,
              errand_id: chat.errand_id,
              task: chat.task,
              last_message: chat.last_message,
              has_image: !!chat.image_url,
              has_audio: !!chat.audio_url,
              date: chat.date,
              unread: Number(chat.unread) || 0
            });
          } else {
            // Add up the unread badges across all errands with this user
            const existing = partnerMap.get(partnerId);
            existing.unread += (Number(chat.unread) || 0);
          }
        });

        setUnifiedChats(Array.from(partnerMap.values()));
      } catch (err) { console.error("Failed to load chats"); }
    };
    if (user) fetchConversations();
  }, [user]);

  const handleOpenChat = async (errandId, partnerId) => {
    try {
      // Clear ALL unread messages from this partner
      await axios.put(`http://localhost:5000/api/conversations/read-unified/${partnerId}/${user.id}`);
      fetchBadges(); 
      navigate(`/chat/${errandId}`);
    } catch (err) { console.error("Failed to clear badge"); }
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      <h1 className="text-3xl font-bold text-foreground mb-6">Messages</h1>
      
      <div className="space-y-3">
        {unifiedChats.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">No messages yet. Accept an errand to start chatting!</div>
        ) : (
          unifiedChats.map(chat => {
            const partnerName = chat.partner_name || 'Unknown User';
            const unread = chat.unread;

            // Generate a smart preview text
            let previewText = chat.last_message;
            if (!previewText) {
              if (chat.has_audio) previewText = '🎤 Voice Note';
              else if (chat.has_image) previewText = '📷 Image Sent';
              else previewText = 'Attachment Sent';
            }

            return (
              <div 
                key={chat.partner_id} 
                onClick={() => handleOpenChat(chat.errand_id, chat.partner_id)} 
                className={`bg-card border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition ${unread > 0 ? 'border-primary/30 bg-primary/5 shadow-sm' : 'border-border shadow-sm hover:border-primary/50'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  
                  {/* 🟢 CLICKABLE AVATAR: stopPropagation prevents opening chat */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      navigate(`/profile/${chat.partner_id}`);
                    }}
                    className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 font-bold flex items-center justify-center rounded-full shadow-inner flex-shrink-0 relative cursor-pointer hover:scale-105 transition-transform hover:shadow-md z-10"
                    title={`View ${partnerName}'s Profile`}
                  >
                    {(partnerName).charAt(0).toUpperCase()}
                    {unread > 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                  </div>
                  
                  <div className="min-w-0 pr-4">
                    {/* 🟢 CLICKABLE NAME */}
                    <h4 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/profile/${chat.partner_id}`);
                      }}
                      className={`text-sm truncate cursor-pointer hover:underline hover:text-primary transition-colors ${unread > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}
                    >
                      {partnerName}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate mb-0.5">Re: {chat.task}</p>
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {previewText}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs ${unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {new Date(chat.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {unread > 0 ? (
                    <div className="bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                      {unread}
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Messages;