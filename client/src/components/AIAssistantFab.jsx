import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Phone, Video, SendHorizontal, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { askChatApi } from '../api/chatApi';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const ADMIN_CALL_NUMBER = import.meta.env.VITE_ADMIN_CALL_NUMBER || '';

const nowTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const mergeUniqueMessages = (base = [], incoming = []) => {
  if (!Array.isArray(base) || base.length === 0) return Array.isArray(incoming) ? incoming : [];
  if (!Array.isArray(incoming) || incoming.length === 0) return base;

  const seen = new Set();
  const merged = [];

  [...base, ...incoming].forEach((message) => {
    const key = message?.id || `${message?.from || 'unknown'}:${message?.time || ''}:${message?.text || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(message);
  });

  return merged;
};

function FormattedText({ text }) {
  return text.split('\n').map((line, lineIndex) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={lineIndex}>
        {parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
          }
          return <span key={partIndex}>{part}</span>;
        })}
        {lineIndex < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

function AIAssistantFab() {
  // WebRTC call state
  const [callModal, setCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [callPeerName, setCallPeerName] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  // ...existing code...
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || 'guest';
  const userName = user?.name || user?.email || 'Bạn';

  const supportStorageKey = `support-chat:${userId}`;
  const assistantStorageKey = `ai-assistant:${userId}`;

  const [supportOpen, setSupportOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const [supportInput, setSupportInput] = useState('');
  const [assistantInput, setAssistantInput] = useState('');

  const [supportMessages, setSupportMessages] = useState([]);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      id: 'assistant-welcome',
      from: 'assistant',
      text: 'Xin chào, mình là trợ lý AI CRM. Bạn cần mình hỗ trợ gì hôm nay?',
      time: nowTime(),
    },
  ]);
  const [supportLoaded, setSupportLoaded] = useState(false);
  const [assistantLoaded, setAssistantLoaded] = useState(false);

  const [assistantLoading, setAssistantLoading] = useState(false);

  const [connected, setConnected] = useState(false);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const [unreadAssistant, setUnreadAssistant] = useState(0);

  const [adminRooms, setAdminRooms] = useState([]);
  const [activeSupportRoom, setActiveSupportRoom] = useState(null);
  const [roomUnreadMap, setRoomUnreadMap] = useState({});

  const socketRef = useRef(null);
  const supportOpenRef = useRef(false);
  const supportEndRef = useRef(null);
  const assistantEndRef = useRef(null);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const userRoomId = `user:${userId}`;

  useEffect(() => {
    supportOpenRef.current = supportOpen;
  }, [supportOpen]);

  useEffect(() => {
    const saved = localStorage.getItem(supportStorageKey);
    if (!saved) {
      setSupportLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSupportMessages(parsed);
      }
    } catch {
      // ignore parse errors
    } finally {
      setSupportLoaded(true);
    }
  }, [supportStorageKey]);

  useEffect(() => {
    if (!assistantLoaded || assistantMessages.length === 0) return;
    localStorage.setItem(assistantStorageKey, JSON.stringify(assistantMessages));
  }, [assistantLoaded, assistantMessages, assistantStorageKey]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (isAdmin) {
        socket.emit('join_admin_room');
      } else {
        socket.emit('join_room', { roomId: userRoomId });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room_list', (list) => {
      setAdminRooms(list);
    });

    socket.on('rooms_updated', ({ roomId, lastMessage, count }) => {
      setAdminRooms((prev) => {
        const exists = prev.find((r) => r.roomId === roomId);
        if (exists) {
          return prev.map((r) =>
            r.roomId === roomId ? { ...r, lastMessage, count } : r
          );
        }
        return [{ roomId, lastMessage, count }, ...prev];
      });

      if (activeSupportRoom !== roomId && lastMessage?.from === 'user') {
        setRoomUnreadMap((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
      }
    });

    socket.on('message_history', (history) => {
      setSupportMessages(history);
    });

    socket.on('video_call_offer', async ({ offer }) => {
      if (!callModal) return; // Only handle if in call modal
      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = peerConnection;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnection.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            const targetRoom = isAdmin ? activeSupportRoom : userRoomId;
            socketRef.current.emit('video_call_ice', { roomId: targetRoom, candidate: event.candidate });
          }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        const targetRoom = isAdmin ? activeSupportRoom : userRoomId;
        socketRef.current.emit('video_call_answer', { roomId: targetRoom, answer });

        setCallStatus('connected');
      } catch (error) {
        console.error('Error handling offer:', error);
        setCallStatus('error');
      }
    });

    socket.on('video_call_answer', async ({ answer }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('connected');
      } catch (error) {
        console.error('Error handling answer:', error);
        setCallStatus('error');
      }
    });

    socket.on('video_call_ice', async ({ candidate }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    return () => socket.disconnect();
  }, [isAdmin, userRoomId, activeSupportRoom, userId]);

  useEffect(() => {
    if (isAdmin && adminRooms.length > 0 && !activeSupportRoom) {
      selectSupportRoom(adminRooms[0].roomId);
    }
  }, [isAdmin, adminRooms, activeSupportRoom]);

  useEffect(() => {
    supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, supportOpen]);

  useEffect(() => {
    assistantEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, assistantOpen]);

  useEffect(() => {
    if (supportOpen) setUnreadSupport(0);
  }, [supportOpen]);

  useEffect(() => {
    if (assistantOpen) setUnreadAssistant(0);
  }, [assistantOpen]);

  const getRoomLabel = (roomId) => {
    if (!roomId) return '';
    return roomId.replace('user:', 'User ');
  };

  const toggleSupport = () => {
    setSupportOpen((prev) => {
      const next = !prev;
      if (next) setAssistantOpen(false);
      return next;
    });
  };

  const toggleAssistant = () => {
    setAssistantOpen((prev) => {
      const next = !prev;
      if (next) setSupportOpen(false);
      return next;
    });
  };

  const selectSupportRoom = (roomId) => {
    if (!socketRef.current) return;
    setActiveSupportRoom(roomId);
    setSupportMessages([]);
    setRoomUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));
    socketRef.current.emit('admin_join_room', { roomId });
  };

  const sendSupportMessage = () => {
    const text = supportInput.trim();
    if (!text || !socketRef.current) return;

    const targetRoom = isAdmin ? activeSupportRoom : userRoomId;
    if (isAdmin && !targetRoom) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: isAdmin ? 'admin' : 'user',
      senderId: userId,
      senderName: userName,
      text,
      time: nowTime(),
    };

    socketRef.current.emit('send_message', { roomId: targetRoom, message });
    setSupportMessages((prev) => [...prev, message]);
    setSupportInput('');
  };

  const onSupportKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendSupportMessage();
    }
  };

  const sendAssistantMessage = async () => {
    const text = assistantInput.trim();
    if (!text || assistantLoading) return;

    const userMessage = {
      id: `assistant-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: 'user',
      text,
      time: nowTime(),
    };

    setAssistantMessages((prev) => [...prev, userMessage]);
    setAssistantInput('');
    setAssistantLoading(true);

    try {
      const response = await askChatApi({
        message: text,
        page: pathname,
        path: pathname,
        userRole: user?.role || 'member',
      });
      const assistantReply = {
        id: `assistant-bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from: 'assistant',
        text: response?.reply || 'Mình chưa có dữ liệu để trả lời câu hỏi này.',
        time: nowTime(),
      };
      setAssistantMessages((prev) => [...prev, assistantReply]);
      if (!assistantOpen) {
        setUnreadAssistant((count) => count + 1);
      }
    } catch {
      const fallback = {
        id: `assistant-bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from: 'assistant',
        text: 'Xin lỗi, hiện tại hệ thống AI đang bận. Bạn thử lại sau ít phút nhé.',
        time: nowTime(),
      };
      setAssistantMessages((prev) => [...prev, fallback]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const onAssistantKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAssistantMessage();
    }
  };

  const handleCallAdmin = () => {
    if (!ADMIN_CALL_NUMBER) {
      window.alert('Chua cau hinh so admin. Hay them VITE_ADMIN_CALL_NUMBER trong file .env cua client.');
      return;
    }
    const sanitized = String(ADMIN_CALL_NUMBER).replace(/\s+/g, '');
    window.location.href = `tel:${sanitized}`;
  };

  // Messenger-style call (WebRTC)
  const handleVideoCall = async () => {
    if (isAdmin && !activeSupportRoom) {
      window.alert('Vui lòng chọn cuộc trò chuyện trước khi gọi.');
      return;
    }

    const peerName = isAdmin ? getRoomLabel(activeSupportRoom) || 'Người dùng' : 'Admin';
    setCallPeerName(peerName);
    setCallStatus('calling');
    setCallModal(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const targetRoom = isAdmin ? activeSupportRoom : userRoomId;
          socketRef.current.emit('video_call_ice', { roomId: targetRoom, candidate: event.candidate });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const targetRoom = isAdmin ? activeSupportRoom : userRoomId;
      socketRef.current.emit('video_call_offer', { roomId: targetRoom, offer });

      setCallStatus('ringing');
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('error');
    }
  };
  const closeCallModal = () => {
    setCallModal(false);
    setCallStatus('idle');
    setCallPeerName('');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {supportOpen && (
        <div className="flex h-[min(76vh,640px)] w-[370px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {isAdmin
                    ? activeSupportRoom
                      ? `Cuộc trò chuyện với ${getRoomLabel(activeSupportRoom)}`
                      : 'Tin nhắn từ Users'
                    : 'Nhắn tin với Admin'}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-sky-100">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-300' : 'bg-slate-300'}`} />
                  {connected ? 'Đang kết nối' : 'Đang kết nối lại...'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleVideoCall}
              className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
              aria-label="Gọi video như Messenger"
              title="Gọi video như Messenger"
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCallAdmin}
              className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
              aria-label="Gọi admin"
              title={ADMIN_CALL_NUMBER ? `Goi ${ADMIN_CALL_NUMBER}` : 'Can cau hinh VITE_ADMIN_CALL_NUMBER'}
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSupportOpen(false)}
              className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isAdmin && (
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Danh sách cuộc trò chuyện</div>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {adminRooms.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                    Chưa có tin nhắn từ user nào.
                  </div>
                ) : (
                  adminRooms.map((room) => {
                    const unread = roomUnreadMap[room.roomId] || 0;
                    const label = room.lastMessage?.senderName || getRoomLabel(room.roomId);
                    return (
                      <button
                        key={room.roomId}
                        type="button"
                        onClick={() => selectSupportRoom(room.roomId)}
                        className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                          activeSupportRoom === room.roomId ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{label}</p>
                          <p className="truncate text-xs text-slate-500">{room.lastMessage?.text || 'Chưa có tin nhắn'}</p>
                        </div>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-3">
            {supportMessages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-sm text-slate-400">
                  {isAdmin && !activeSupportRoom
                    ? 'Chọn cuộc trò chuyện từ danh sách bên trên.'
                    : isAdmin
                      ? 'Chờ tin nhắn từ users...'
                      : 'Gửi tin nhắn để bắt đầu cuộc trò chuyện với admin.'}
                </p>
              </div>
            )}
            {supportMessages.map((msg) => {
              const isMe = msg.senderId === userId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isMe && (
                      <p className="px-1 text-[11px] font-medium text-slate-500">{msg.senderName || 'Admin'}</p>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                        isMe
                          ? 'rounded-br-sm bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                          : 'rounded-bl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="px-1 text-[10px] text-slate-400">{msg.time}</p>
                  </div>
                </div>
              );
            })}
            <div ref={supportEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                onKeyDown={onSupportKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={sendSupportMessage}
                disabled={!supportInput.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {callModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-3xl bg-slate-900 px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Gọi video với {callPeerName || (isAdmin ? 'Người dùng' : 'Admin')}</p>
                <p className="text-xs text-slate-300">
                  {callStatus === 'calling' ? 'Đang kết nối...' : 'Đang gọi'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCallModal}
                className="rounded-full bg-slate-800/70 p-2 transition hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              {callStatus === 'connected' && remoteStream ? (
                <div className="space-y-4">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-2xl bg-black"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-24 h-24 rounded-lg bg-black absolute bottom-20 right-4 border-2 border-white"
                  />
                </div>
              ) : (
                <div className="mb-4 rounded-3xl bg-slate-100 p-6 text-center text-slate-500">
                  <div className="mb-3 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-4xl">
                    📹
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {callStatus === 'error' ? 'Lỗi kết nối' : 'Đang thiết lập cuộc gọi...'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {callStatus === 'error' ? 'Vui lòng thử lại.' : 'Vui lòng cho phép truy cập camera và micro.'}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeCallModal}
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  Kết thúc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assistantOpen && (
        <div className="flex h-[min(76vh,640px)] w-[370px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Trợ lý AI</p>
                <p className="text-[11px] text-cyan-100">Hỗ trợ hướng dẫn CRM theo ngữ cảnh</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-3">
            {assistantMessages.map((msg) => {
              const isUser = msg.from === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isUser && (
                      <p className="px-1 text-[11px] font-medium text-slate-500">Trợ lý AI</p>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                        isUser
                          ? 'rounded-br-sm bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                          : 'rounded-bl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                      }`}
                    >
                      {isUser ? msg.text : <FormattedText text={msg.text} />}
                    </div>
                    <p className="px-1 text-[10px] text-slate-400">{msg.time}</p>
                  </div>
                </div>
              );
            })}

            {assistantLoading && (
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                  Trợ lý AI đang soạn trả lời...
                </div>
              </div>
            )}
            <div ref={assistantEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={onAssistantKeyDown}
                placeholder="Hỏi trợ lý AI..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={sendAssistantMessage}
                disabled={!assistantInput.trim() || assistantLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleSupport}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 text-white shadow-[0_18px_45px_-18px_rgba(14,165,233,0.85)] transition hover:scale-[1.03]"
        aria-label="Mở chat tin nhắn"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition group-hover:opacity-100" />
        {supportOpen ? (
          <X className="relative h-7 w-7" />
        ) : (
          <MessageCircle className="relative h-8 w-8" />
        )}
        {!supportOpen && unreadSupport > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
            {unreadSupport > 9 ? '9+' : unreadSupport}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={toggleAssistant}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-[0_18px_45px_-18px_rgba(59,130,246,0.85)] transition hover:scale-[1.03]"
        aria-label="Mở trợ lý AI"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition group-hover:opacity-100" />
        {assistantOpen ? (
          <X className="relative h-7 w-7" />
        ) : (
          <Bot className="relative h-8 w-8" />
        )}
        {!assistantOpen && unreadAssistant > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
            {unreadAssistant > 9 ? '9+' : unreadAssistant}
          </span>
        )}
      </button>
    </div>
  );
}

export default AIAssistantFab;