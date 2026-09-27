import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { MessageSquare, Send, CheckCircle, User, Briefcase, ChevronLeft } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatBottomRef = useRef(null);

  const role = user?.user_metadata?.role;
  const isEmployer = role === "employer";

  // 1. Fetch Contacts (The Sidebar List)
  useEffect(() => {
    if (!user) return;
    
    const fetchContacts = async () => {
      setLoadingContacts(true);
      
      try {
        const chatMap = new Map();

        // STEP 1: Seed conversations based on User Actions (Applications & Saved Jobs)
        if (isEmployer) {
          const { data: myJobs } = await supabase.from("jobs").select("id").eq("employer_id", user.id);
          if (myJobs && myJobs.length > 0) {
            const jobIds = myJobs.map(j => j.id);
            const { data: apps } = await supabase.from("applications").select("job_id, user_id, applied_at").in("job_id", jobIds);
            
            if (apps) {
              apps.forEach(app => {
                const key = `${app.job_id}_${app.user_id}`;
                chatMap.set(key, {
                  job_id: app.job_id,
                  other_user_id: app.user_id,
                  last_message: "Start a conversation...",
                  last_message_time: app.applied_at, 
                  unread_count: 0
                });
              });
            }
          }
        } else {
          // Job Seekers see Employers for jobs they have Applied to OR Saved
          const { data: myApps } = await supabase.from("applications").select("job_id, applied_at").eq("user_id", user.id);
          const { data: mySaves } = await supabase.from("saved_jobs").select("job_id, created_at").eq("user_id", user.id);
          
          const interestingJobs = [
            ...(myApps || []).map(a => ({ job_id: a.job_id, time: a.applied_at })),
            ...(mySaves || []).map(s => ({ job_id: s.job_id, time: s.created_at }))
          ];

          if (interestingJobs.length > 0) {
            for (const item of interestingJobs) {
              const { data: jobInfo } = await supabase.from("jobs").select("employer_id").eq("id", item.job_id).single();
              if (jobInfo && !chatMap.has(`${item.job_id}_${jobInfo.employer_id}`)) {
                chatMap.set(`${item.job_id}_${jobInfo.employer_id}`, {
                  job_id: item.job_id,
                  other_user_id: jobInfo.employer_id,
                  last_message: "Start a conversation...",
                  last_message_time: item.time,
                  unread_count: 0
                });
              }
            }
          }
        }

        // STEP 2: Overlay actual message history
        const { data: allMessages, error: msgError } = await supabase
          .from("messages")
          .select("job_id, sender_id, receiver_id, content, created_at, is_read")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (msgError) throw msgError;

        allMessages.forEach(msg => {
          const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          const key = `${msg.job_id}_${otherUserId}`;
          
          if (!chatMap.has(key) || chatMap.get(key).last_message === "Start a conversation...") {
            chatMap.set(key, {
              job_id: msg.job_id,
              other_user_id: otherUserId,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: (msg.receiver_id === user.id && !msg.is_read) ? 1 : 0
            });
          } else if (msg.receiver_id === user.id && !msg.is_read) {
            chatMap.get(key).unread_count += 1;
          }
        });

        // STEP 3: Fetch human-readable display names
        const contactsList = [];
        
        for (const [key, chatInfo] of chatMap.entries()) {
          const { data: jobData } = await supabase.from("jobs").select("title, company").eq("id", chatInfo.job_id).single();
          const { data: profileData } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", chatInfo.other_user_id).single();

          if (jobData) {
            contactsList.push({
              id: key, 
              job_id: chatInfo.job_id,
              job_title: jobData.title,
              company: jobData.company,
              other_user_id: chatInfo.other_user_id,
              other_user_name: profileData?.full_name || (isEmployer ? "Applicant" : jobData.company),
              last_message: chatInfo.last_message,
              last_message_time: chatInfo.last_message_time,
              unread_count: chatInfo.unread_count
            });
          }
        }
        
        contactsList.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
        setContacts(contactsList);
        
      } catch (err) {
        console.error("Error fetching contacts:", err);
      } finally {
        setLoadingContacts(false);
      }
    };
    
    fetchContacts();
  }, [user, isEmployer]);

  // 2. Fetch Messages for the Active Chat
  useEffect(() => {
    if (!user || !activeChat) return;

    const fetchMessages = async () => {
      setLoadingChat(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", activeChat.job_id)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.other_user_id}),and(sender_id.eq.${activeChat.other_user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (!error && data) setMessages(data);
      setLoadingChat(false);

      await supabase.from("messages").update({ is_read: true }).eq("job_id", activeChat.job_id).eq("sender_id", activeChat.other_user_id).eq("receiver_id", user.id);
      setContacts(prev => prev.map(c => c.id === activeChat.id ? { ...c, unread_count: 0 } : c));
    };

    fetchMessages();
  }, [activeChat, user]);

  // 3. Real-time Subscription
  useEffect(() => {
    if (!activeChat || !user) return;

    const channelName = `chat-${activeChat.job_id}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      // Change event to '*' so we listen to INSERT, UPDATE, and DELETE directly from the database
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        
        // 1. Handle a Brand New Message (INSERT)
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new;
          const isForThisChat = newMsg.job_id === activeChat.job_id && 
            ((newMsg.sender_id === user.id && newMsg.receiver_id === activeChat.other_user_id) || 
             (newMsg.sender_id === activeChat.other_user_id && newMsg.receiver_id === user.id));

          if (isForThisChat) {
            // Add the new message to the screen
            setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
            
            // Mark as read
            if (newMsg.receiver_id === user.id) {
              supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then();
            }
          }
        }
        
        // 2. Handle an Edited Message (UPDATE)
        if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new;
          // Find the old message on the screen and swap it with the newly edited text
          setMessages(prev => prev.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg));
        }

        // 3. Handle a Deleted Message (DELETE)
        if (payload.eventType === 'DELETE') {
          const deletedMsgId = payload.old.id;
          // Instantly remove the deleted message from the screen
          setMessages(prev => prev.filter(msg => msg.id !== deletedMsgId));
        }

      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user]);

  // 4. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const msgText = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert([{
      sender_id: user.id,
      receiver_id: activeChat.other_user_id,
      job_id: activeChat.job_id,
      content: msgText,
      is_read: false
    }]);

    if (error) alert("Failed to send message. Please try again.");
  };

  // 5. Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Messages</h1>
        <p className="text-slate-400 mt-1">Connect with {isEmployer ? "candidates" : "employers"} regarding job applications.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex h-[calc(100%-5rem)] overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="font-bold text-white text-lg">Conversations</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            {loadingContacts ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p>No conversations yet.</p>
                <p className="text-xs mt-2">
                  {isEmployer ? "When candidates apply to your jobs, they will appear here." : "When you Save or Apply to a job, the employer will appear here so you can message them."}
                </p>
              </div>
            ) : (
              contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setActiveChat(contact)}
                  className={`w-full text-left p-4 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors flex items-start gap-3 ${activeChat?.id === contact.id ? 'bg-slate-800/80 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-white font-bold text-sm truncate">{contact.other_user_name}</h3>
                      {contact.unread_count > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{contact.unread_count} New</span>}
                    </div>
                    <div className="flex items-center text-xs text-emerald-400 mb-1 truncate">
                      <Briefcase className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{contact.job_title}</span>
                    </div>
                    <p className={`text-xs truncate ${contact.unread_count > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                      {contact.last_message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={`flex-1 flex flex-col bg-slate-900/50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">Your Messages</h3>
              <p>Select a conversation from the left to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg mr-1"><ChevronLeft className="w-6 h-6" /></button>
                <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-slate-400" /></div>
                <div>
                  <h3 className="text-white font-bold">{activeChat.other_user_name}</h3>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Briefcase className="w-3 h-3 shrink-0" /> Regarding: {activeChat.job_title} ({activeChat.company})
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                {loadingChat ? (
                  <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div></div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_id === user.id;
                    const isLast = index === messages.length - 1;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${isMe ? 'bg-emerald-500 text-slate-950 rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'}`}>
                          <p>{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-slate-800' : 'text-slate-500'}`}>
                            <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && isLast && msg.is_read && <CheckCircle className="w-3 h-3 text-slate-900" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="p-4 bg-slate-900 border-t border-slate-800">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm placeholder-slate-500" />
                  <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"><Send className="w-5 h-5" /></button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}