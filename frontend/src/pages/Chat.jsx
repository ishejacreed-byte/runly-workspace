import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { ArrowLeft, Camera, Mic, Square, Send, ShieldAlert } from 'lucide-react';

const socket = io('http://localhost:5000');

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const [chatPartner, setChatPartner] = useState({ id: null, name: 'Loading...', initial: '' });
  const [errandTitle, setErrandTitle] = useState('Loading...');
  const [unifiedRoom, setUnifiedRoom] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const safeErrandId = parseInt(id, 10) || 1;

  useEffect(() => {
    if (!user) return;

    const initializeChat = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/errands/${safeErrandId}`);
        const errandData = res.data;
        setErrandTitle(errandData.title);

        let partnerId = null;

        if (Number(user.id) === Number(errandData.customer_id)) {
          partnerId = errandData.helper_id;
          setChatPartner({
            id: partnerId,
            name: errandData.helper_name || 'Waiting for Helper...',
            initial: (errandData.helper_name || '?').charAt(0).toUpperCase()
          });
        } else if (Number(user.id) === Number(errandData.helper_id)) {
          partnerId = errandData.customer_id;
          setChatPartner({
            id: partnerId,
            name: errandData.customer_name,
            initial: errandData.customer_name.charAt(0).toUpperCase()
          });
        } else {
          setIsAuthorized(false);
          return;
        }

        // Generate unified room
        const roomId = `room_${[user.id, partnerId].sort((a, b) => a - b).join('_')}`;
        setUnifiedRoom(roomId);

        // Fetch Unified History
        const historyRes = await axios.get(`http://localhost:5000/api/messages/unified/${user.id}/${partnerId}`);
        if (Array.isArray(historyRes.data)) {
          setMessages(historyRes.data);
          scrollToBottom();
        }

        socket.emit('join_chat', roomId);
      } catch (err) {
        console.error("Failed to load chat partner data", err);
      }
    };
    
    initializeChat();

    const messageListener = (newMessage) => {
      setMessages((prev) => {
        const exists = prev.find(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom();
    };

    socket.on('receive_message', messageListener);

    return () => {
      socket.off('receive_message', messageListener);
    };
  }, [safeErrandId, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user || !isAuthorized || !unifiedRoom) return;

    socket.emit('send_message', {
      errandId: safeErrandId, senderId: user.id, text: text, imageUrl: null, audioUrl: null, unifiedRoomId: unifiedRoom
    });
    
    setText('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !isAuthorized || !unifiedRoom) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      socket.emit('send_message', {
        errandId: safeErrandId, senderId: user.id, text: null, imageUrl: res.data.url, audioUrl: null, unifiedRoomId: unifiedRoom
      });
    } catch (err) { console.error("Image upload failed", err); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);

  mediaRecorderRef.current.onstop = async () => {
        // 🛠️ THE FIX: Ask the browser EXACTLY what format it just recorded in
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        
        // Wrap the audio chunks in a Blob with that exact format
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Safety Check: If the microphone didn't pick anything up, stop.
        if (audioBlob.size === 0) {
            console.error("Recording failed: Audio blob is empty.");
            return;
        }

        const formData = new FormData();
        
        // Name the file dynamically so Safari saves .mp4 and Chrome saves .webm
        const extension = mimeType.includes('mp4') ? '.mp4' : '.webm';
        formData.append('media', audioBlob, `voicenote${extension}`);

        try {
          const res = await axios.post('http://localhost:5000/api/upload', formData);
          
          socket.emit('send_message', {
            errandId: safeErrandId, 
            senderId: user.id, 
            text: null, 
            imageUrl: null, 
            audioUrl: res.data.url, 
            unifiedRoomId: unifiedRoom
          });
        } catch (err) { 
          console.error("Voice note upload failed", err); 
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { alert("Microphone access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 🛠️ THE URL FIX: Ensures there is always exactly one slash between the port and the path
  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:5000${cleanUrl}`;
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-6 text-center">
        <ShieldAlert size={64} className="text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You are not authorized to view this chat. It is strictly between the customer and the assigned helper.</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90">Return Home</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background pb-safe">
      <div className="bg-card border-b border-border p-4 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center rounded-full">
          {chatPartner.initial}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground leading-tight truncate">{chatPartner.name}</h2>
          <p className="text-xs text-primary font-semibold truncate">Errand: {errandTitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-10">
            Send a message to start the conversation!
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = Number(msg.sender_id) === Number(user?.id);
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeSlideIn mb-2`}>
              {msg.context_title && msg.context_title !== errandTitle && (
                <span className="text-[10px] text-muted-foreground font-semibold mb-1 px-1 bg-secondary rounded-md">
                  Re: {msg.context_title}
                </span>
              )}
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}>
                {msg.content && <p className="text-sm">{msg.content}</p>}
                {msg.image_url && <img src={getMediaUrl(msg.image_url)} alt="Sent" className="rounded-xl w-full object-cover max-h-60 mt-1" />}
                {msg.audio_url && <audio controls className="max-w-full mt-1 h-10"><source src={getMediaUrl(msg.audio_url)} type="audio/webm" /></audio>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex items-center gap-2 z-50">
        <input type="file" id="imageUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <label htmlFor="imageUpload" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition cursor-pointer">
          <Camera size={22} />
        </label>

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-full px-4 py-2 animate-pulse">
            <span className="text-destructive font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-destructive rounded-full"></span> Recording...
            </span>
            <button onClick={stopRecording} className="p-1.5 bg-destructive text-white rounded-full hover:bg-red-600 transition">
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2 bg-background border border-border rounded-full px-4 py-1.5 focus-within:border-primary transition-colors">
            <input 
              type="text" placeholder="Message..." className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1.5"
              value={text} onChange={(e) => setText(e.target.value)}
            />
            {text.trim() ? (
              <button type="submit" className="p-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition transform active:scale-95">
                <Send size={16} className="ml-0.5" />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="p-1.5 text-muted-foreground hover:text-primary transition transform active:scale-95">
                <Mic size={20} />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;