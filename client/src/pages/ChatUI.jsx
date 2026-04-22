import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../i18n';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const nowTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function ChatUI() {
  const user = useAuthStore((state) => state.user);
  const adminName = user?.name || user?.email || 'Admin';

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeRoomRef = useRef(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_admin_room');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room_list', (list) => {
      setRooms(list);
    });

    socket.on('rooms_updated', ({ roomId, lastMessage, count }) => {
      setRooms((prev) => {
        const exists = prev.find((r) => r.roomId === roomId);
        if (exists) {
          return prev.map((r) =>
            r.roomId === roomId ? { ...r, lastMessage, count } : r
          );
        }
        return [{ roomId, lastMessage, count }, ...prev];
      });
      if (activeRoomRef.current !== roomId && lastMessage.from === 'user') {
        setUnreadMap((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
      }
    });

    socket.on('message_history', (history) => {
      setMessages(history);
    });

    socket.on('new_message', (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectRoom = (roomId) => {
    if (!socketRef.current) return;
    setActiveRoom(roomId);
    setMessages([]);
    setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));
    socketRef.current.emit('admin_join_room', { roomId });
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeRoom || !socketRef.current) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: 'admin',
      senderId: user?.id,
      senderName: adminName,
      text,
      time: nowTime(),
    };

    socketRef.current.emit('send_message', { roomId: activeRoom, message });
    setMessages((prev) => [...prev, message]);
    setInput('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoomLabel = (roomId) => roomId.replace('user:', 'User ');

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3.5">
          <Users className="h-4 w-4 text-sky-500" />
          <p className="text-sm font-semibold text-slate-800">Hoi thoai</p>
          <span className={`ml-auto flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              Chưa có cuoc tro chuyen nao.
            </div>
          )}
          {rooms.map((room) => {
            const isActive = activeRoom === room.roomId;
            const unread = unreadMap[room.roomId] || 0;
            return (
              <button
                key={room.roomId}
                type="button"
                onClick={() => selectRoom(room.roomId)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  isActive ? 'bg-sky-50 border-r-2 border-sky-500' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-xs font-bold text-white">
                  {getRoomLabel(room.roomId).slice(-2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{getRoomLabel(room.roomId)}</p>
                  <p className="truncate text-xs text-slate-400">{room.lastMessage?.text || ''}</p>
                </div>
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {!activeRoom ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <MessageCircle className="h-12 w-12 opacity-30" />
            <p className="text-sm">Chon mot cuoc tro chuyen de bat dau</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-xs font-bold text-white">
                {getRoomLabel(activeRoom).slice(-2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{getRoomLabel(activeRoom)}</p>
                <p className="text-xs text-slate-400">{activeRoom}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-400">Chưa có tin nhan nao.</p>
              )}
              {messages.map((msg) => {
                const isAdmin = msg.from === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                      {!isAdmin && (
                        <p className="px-1 text-[11px] font-medium text-slate-500">{msg.senderName || 'Người dùng'}</p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm leading-6 ${
                          isAdmin
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
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`Tra loi ${getRoomLabel(activeRoom)}...`}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

