'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { getAuthToken } from '../utils/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from '../context/ThemeContext'

interface Message {
  _id: string
  message: string
  sender: { _id?: string; id?: string; name: string; role: string; avatarColor?: string }
  roomId: string
  createdAt: string
  reactions: { userId: string; emoji: string }[]
  edited?: boolean
  deletedForAll?: boolean
}

interface Room {
  _id: string
  name: string
  type: string
  subType?: string
  faculty?: string
  department?: string
  level?: string
}

interface User {
  _id?: string
  id?: string
  name: string
  role: string
  faculty: string
  department: string
  level: string
  canHostLive: boolean
  avatarColor?: string
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '🙏']

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function ChatPage() {
  const router = useRouter()
  const { isDark, bg, bgCard, text, textSecondary, border } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [text_, setText] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [online, setOnline] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [view, setView] = useState<'rooms' | 'chat'>('rooms')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null)
  const [hiddenMessages, setHiddenMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    const s = io(API_BASE)
    setSocket(s)

    s.on('newMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })

    s.on('reactionUpdate', (updatedMsg: Message) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m))
    })

    s.on('messageEdited', (updatedMsg: Message) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m))
    })

    s.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m => m._id === messageId
        ? { ...m, deletedForAll: true, message: 'This message was deleted' }
        : m
      ))
    })

    s.on('onlineUsers', (users: any[]) => setOnline(users))

    s.on('connect_error', () => setError(true))

    const setup = async () => {
      try {
        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!userRes.ok) throw new Error('Failed to load user')
        const userData = await userRes.json()
        setUser(userData)
        s.emit('userOnline', userData)

        const roomsRes = await fetch(`${API_BASE}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!roomsRes.ok) throw new Error('Failed to load rooms')
        const roomsData = await roomsRes.json()
        setRooms(roomsData)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError(true)
        setLoading(false)
      }
    }

    setup()
    return () => { s.disconnect() }
  }, [])

  const loadMessages = async (roomId: string) => {
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/chat?roomId=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError(true)
    }
  }

  const openRoom = async (room: Room) => {
    if (!socket) return
    if (activeRoom) socket.emit('leaveRoom', activeRoom.name)
    socket.emit('joinRoom', room.name)
    setActiveRoom(room)
    setMessages([])
    setView('chat')
    await loadMessages(room._id)
  }

  const goBack = () => {
    if (activeRoom && socket) {
      socket.emit('leaveRoom', activeRoom.name)
    }
    setView('rooms')
    setActiveRoom(null)
    setMessages([])
  }

  const sendMessage = async () => {
    const token = getAuthToken()
    if (!text_.trim() || !token || !activeRoom) return
    await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: text_, roomId: activeRoom._id }),
    })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    const token = getAuthToken()
    if (!token) return
    await fetch(`${API_BASE}/api/chat/${messageId}/reaction`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    })
  }

  const startEdit = (msg: Message) => {
    setEditingId(msg._id)
    setEditText(msg.message)
    setMenuMessageId(null)
  }

  const submitEdit = async (messageId: string) => {
    const token = getAuthToken()
    if (!token || !editText.trim()) return
    await fetch(`${API_BASE}/api/chat/${messageId}/edit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: editText }),
    })
    setEditingId(null)
    setEditText('')
  }

  const deleteForAll = async (messageId: string) => {
    setMenuMessageId(null)
    if (!confirm('Delete this message for everyone?')) return
    const token = getAuthToken()
    if (!token) return
    await fetch(`${API_BASE}/api/chat/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const hideForMe = (messageId: string) => {
    setHiddenMessages(prev => new Set([...prev, messageId]))
    setMenuMessageId(null)
  }

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getRoomIcon = (room: Room) => {
    if (room.type === 'global') return '🌍'
    if (room.type === 'bulletin') return '📌'
    if (room.name === 'lecturers_global') return '🏫'
    if (room.type === 'lecturer' && room.subType === 'faculty') return '🏛️'
    if (room.type === 'lecturer' && room.subType === 'department') return '📚'
    if (room.subType === 'general') return '💬'
    if (room.subType === 'resources') return '📋'
    return '💬'
  }

  const getRoomDisplayName = (room: Room) => {
    if (room.type === 'global') return 'Global'
    if (room.type === 'bulletin') return `${abbreviate(room.faculty || '')} Bulletin`
    if (room.name === 'lecturers_global') return 'All Lecturers'
    if (room.type === 'lecturer' && room.subType === 'faculty') return `${abbreviate(room.faculty || '')} Faculty`
    if (room.type === 'lecturer' && room.subType === 'department') return `${abbreviate(room.department || '')} Dept`
    if (room.type === 'student') return `${abbreviate(room.department || '')} • ${room.level}`
    return room.name
  }

  const getRoomDescription = (room: Room) => {
    if (room.type === 'global') return 'Read only • Super admin posts'
    if (room.type === 'bulletin') return 'Faculty news • Faculty admin posts'
    if (room.name === 'lecturers_global') return 'All university lecturers'
    if (room.type === 'lecturer' && room.subType === 'faculty') return 'Faculty staff only'
    if (room.type === 'lecturer' && room.subType === 'department') return 'Department staff only'
    if (room.subType === 'general') return 'Students chat freely'
    if (room.subType === 'resources') return 'Notes & announcements'
    return ''
  }

  const getRoomColor = (room: Room) => {
    if (room.type === 'global') return '#16a34a'
    if (room.type === 'bulletin') return '#d97706'
    if (room.type === 'lecturer') return '#2563eb'
    if (room.subType === 'resources') return '#7c3aed'
    return '#16a34a'
  }

  const abbreviate = (name: string) => {
    const skip = ['and', 'of', 'with', 'the', 'in', 'for', 'a', 'an']
    return name.split(' ')
      .filter(w => !skip.includes(w.toLowerCase()))
      .map(w => w.charAt(0).toUpperCase() + w.slice(1, 3).toLowerCase())
      .join(' ')
  }

  const isMyMessage = (msg: Message) => {
    const userId = (user as any)?.id || (user as any)?._id
    const senderId = (msg.sender as any)?._id || (msg.sender as any)?.id
    return senderId === userId
  }

  const canPost = () => {
    if (!activeRoom || !user) return false
    if (activeRoom.type === 'global') return user.role === 'admin'
    if (activeRoom.type === 'bulletin') return user.role === 'faculty_admin' && activeRoom.faculty === user.faculty
    if (activeRoom.type === 'lecturer') return user.role === 'lecturer' || user.role === 'faculty_admin' || user.role === 'admin'
    if (activeRoom.subType === 'general') return user.role === 'student'
    if (activeRoom.subType === 'resources') {
      return user.role === 'lecturer' || user.role === 'faculty_admin' || user.role === 'admin' ||
        (user.role === 'student' && user.canHostLive === true)
    }
    return false
  }

  const canReact = () => activeRoom?.subType === 'resources' && user?.role === 'student'

  const getReactionCounts = (reactions: { userId: string; emoji: string }[]) => {
    const counts: { [key: string]: number } = {}
    reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1 })
    return counts
  }

  const hasReacted = (reactions: { userId: string; emoji: string }[], emoji: string) => {
    const userId = (user as any)?.id || (user as any)?._id
    return reactions.some(r => r.userId === userId && r.emoji === emoji)
  }

  const groupedMessages = () => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    messages.forEach(msg => {
      const msgDate = formatDate(msg.createdAt)
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })
    return groups
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getRoleColor = (role: string) => {
    if (role === 'admin') return '#ef4444'
    if (role === 'faculty_admin') return '#7c3aed'
    if (role === 'lecturer') return '#2563eb'
    return '#16a34a'
  }

  // Group rooms
  const globalRoom = rooms.find(r => r.type === 'global')
  const bulletinRooms = rooms.filter(r => r.type === 'bulletin')
  const lecturerGlobal = rooms.find(r => r.name === 'lecturers_global')
  const lecturerRooms = rooms.filter(r => r.type === 'lecturer' && r.name !== 'lecturers_global')
  const studentRooms = rooms.filter(r => r.type === 'student')
  const uniqueDepts = [...new Set(studentRooms.filter(r => r.department).map(r => r.department!))]

  const renderRoomItem = (room: Room) => {
    const isActive = activeRoom?._id === room._id
    const color = getRoomColor(room)
    return (
      <div
        key={room._id}
        onClick={() => openRoom(room)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', cursor: 'pointer',
          background: isActive ? '#f0fdf4' : bgCard,
          borderBottom: `1px solid ${border}`,
          borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
          transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: color + '20',
          border: `2px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {getRoomIcon(room)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: isActive ? 700 : 500,
            color: text, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {getRoomDisplayName(room)}
          </div>
          <div style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>
            {getRoomDescription(room)}
          </div>
        </div>
        {isActive && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        )}
      </div>
    )
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f5' }}>
      <p style={{ color: '#4b5563' }}>Connecting...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>

      {/* ===== ROOMS PANEL ===== */}
      <div style={{
        width: 340,
        background: bgCard,
        borderRight: `1px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        // On mobile: full screen when view === 'rooms', hidden when view === 'chat'
        position: 'absolute' as any,
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
        transform: view === 'rooms' ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}
        className="chat-rooms-panel"
      >
        {/* Rooms header */}
        <div style={{
          padding: '16px 20px',
          background: '#052e16',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', borderRadius: 8, padding: '6px 10px',
              cursor: 'pointer', fontSize: 16,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 700 }}>💬 Chats</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 12 }}>
              {online.length} online
            </p>
          </div>
        </div>

        {/* Search rooms */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: bg, borderRadius: 10, padding: '8px 12px',
            border: `1px solid ${border}`,
          }}>
            <span style={{ color: '#9ca3af' }}>🔍</span>
            <input
              placeholder="Search conversations..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13, color: text, flex: 1,
              }}
            />
          </div>
        </div>

        {/* Room list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Global */}
          {globalRoom && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5 }}>
                SCHOOL
              </div>
              {renderRoomItem(globalRoom)}
            </div>
          )}

          {/* Bulletin */}
          {bulletinRooms.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5 }}>
                FACULTY BULLETIN
              </div>
              {bulletinRooms.map(r => renderRoomItem(r))}
            </div>
          )}

          {/* All Lecturers */}
          {lecturerGlobal && (
            <div>
              <div
                onClick={() => toggleGroup('all_staff')}
                style={{
                  padding: '8px 16px 4px', fontSize: 10, fontWeight: 700,
                  color: '#9ca3af', letterSpacing: 1.5, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between',
                }}
              >
                <span>ALL STAFF</span>
                <span>{collapsedGroups['all_staff'] ? '▶' : '▼'}</span>
              </div>
              {!collapsedGroups['all_staff'] && renderRoomItem(lecturerGlobal)}
            </div>
          )}

          {/* Staff Rooms */}
          {lecturerRooms.length > 0 && (
            <div>
              <div
                onClick={() => toggleGroup('staff_rooms')}
                style={{
                  padding: '8px 16px 4px', fontSize: 10, fontWeight: 700,
                  color: '#9ca3af', letterSpacing: 1.5, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between',
                }}
              >
                <span>STAFF ROOMS</span>
                <span>{collapsedGroups['staff_rooms'] ? '▶' : '▼'}</span>
              </div>
              {!collapsedGroups['staff_rooms'] && lecturerRooms.map(r => renderRoomItem(r))}
            </div>
          )}

          {/* Student rooms grouped by department */}
          {studentRooms.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5 }}>
                MY CLASS
              </div>
              {uniqueDepts.map(dept => {
                const deptRooms = studentRooms.filter(r => r.department === dept)
                const groupKey = `dept_${dept}`
                const isCollapsed = collapsedGroups[groupKey]
                return (
                  <div key={dept}>
                    <div
                      onClick={() => toggleGroup(groupKey)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px', cursor: 'pointer',
                        background: '#fafafa', borderBottom: `1px solid ${border}`,
                        userSelect: 'none',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#7c3aed20', border: '2px solid #7c3aed30',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0,
                      }}>📚</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>
                          {abbreviate(dept)}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {deptRooms.length} room{deptRooms.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {isCollapsed ? '▶' : '▼'}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div style={{ paddingLeft: 8 }}>
                        {deptRooms.map(r => renderRoomItem(r))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Online users */}
          {online.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: '#fafafa', marginTop: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 1.5, marginBottom: 8 }}>
                ONLINE NOW
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {online.slice(0, 8).map((u, i) => (
                  <div key={i} title={u.name} style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: getRoleColor(u.role),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    border: '2px solid white',
                  }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>


      {/* ===== CHAT AREA ===== */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#efeae2',
        // On desktop: always visible with margin for rooms panel
        // On mobile: full screen when view === 'chat'
        marginLeft: 340,
        position: 'relative',
      }}
        className="chat-main-area"
      >

        {/* No room selected */}
        {!activeRoom && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16, height: '100%',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#16a34a20', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 36,
            }}>💬</div>
            <h3 style={{ color: text, margin: 0 }}>Select a conversation</h3>
            <p style={{ color: textSecondary, fontSize: 14, margin: 0 }}>
              Choose a room from the left to start chatting
            </p>
          </div>
        )}

        {/* Active room */}
        {activeRoom && (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px', background: bgCard,
              borderBottom: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {/* Back button — mobile only */}
              <button
                onClick={goBack}
                className="chat-back-btn"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 20, color: text, padding: 4,
                  display: 'none',
                }}
              >
                ←
              </button>

              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: getRoomColor(activeRoom) + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {getRoomIcon(activeRoom)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: text }}>
                  {getRoomDisplayName(activeRoom)}
                </div>
                <div style={{ fontSize: 12, color: textSecondary }}>
                  {getRoomDescription(activeRoom)}
                </div>
              </div>
              {!canPost() && (
                <div style={{
                  background: '#fef3c7', color: '#92400e',
                  padding: '4px 10px', borderRadius: 999,
                  fontSize: 11, fontWeight: 600,
                }}>
                  👁 Read only
                </div>
              )}
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                {online.length} online
              </div>
            </div>

            {/* Messages */}
            <div
              style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}
              onClick={() => menuMessageId && setMenuMessageId(null)}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p style={{ color: textSecondary, fontSize: 14 }}>
                    {canPost() ? 'No messages yet. Start the conversation!' : 'No messages yet in this room.'}
                  </p>
                </div>
              )}

              {groupedMessages().map(group => (
                <div key={group.date}>
                  <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.8)', padding: '4px 12px',
                      borderRadius: 999, fontSize: 12, color: '#4b5563',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}>
                      {group.date}
                    </span>
                  </div>

                  {group.messages.map((msg, index) => {
                    const mine = isMyMessage(msg)
                    const isHidden = hiddenMessages.has(msg._id)
                    const isDeleted = msg.deletedForAll
                    const isEditing = editingId === msg._id
                    const showMenu = menuMessageId === msg._id
                    const showSender = !mine && (index === 0 || group.messages[index - 1]?.sender?._id !== msg.sender?._id)
                    const reactionCounts = getReactionCounts(msg.reactions || [])

                    if (isHidden) return null

                    return (
                      <div
                        key={msg._id || index}
                        style={{
                          display: 'flex',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                          marginBottom: 2,
                          position: 'relative',
                        }}
                      >
                        {/* Sender avatar (others only) */}
                        {!mine && showSender && (
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: (msg.sender as any)?.avatarColor || getRoleColor(msg.sender?.role),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 700,
                            flexShrink: 0, marginRight: 6, alignSelf: 'flex-end',
                          }}>
                            {getInitials(msg.sender?.name || '?')}
                          </div>
                        )}
                        {!mine && !showSender && <div style={{ width: 34, flexShrink: 0 }} />}

                        <div style={{
                          maxWidth: '65%',
                          display: 'flex', flexDirection: 'column',
                          alignItems: mine ? 'flex-end' : 'flex-start',
                        }}>
                          {showSender && (
                            <span style={{
                              fontSize: 12, fontWeight: 600,
                              color: getRoleColor(msg.sender?.role),
                              marginBottom: 2, marginLeft: 4,
                            }}>
                              {msg.sender?.name}
                              {msg.sender?.role !== 'student' && (
                                <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
                                  ({msg.sender?.role})
                                </span>
                              )}
                            </span>
                          )}

                          <div
                            style={{ position: 'relative' }}
                            onContextMenu={e => { e.preventDefault(); if (!isDeleted) setMenuMessageId(msg._id) }}
                          >
                            {/* Context menu */}
                            {showMenu && !isDeleted && (
                              <div style={{
                                position: 'absolute',
                                [mine ? 'right' : 'left']: 0,
                                bottom: '100%', marginBottom: 4,
                                background: bgCard, borderRadius: 12,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                border: `1px solid ${border}`,
                                zIndex: 100, overflow: 'hidden', minWidth: 160,
                              }}
                                onClick={e => e.stopPropagation()}
                              >
                                {mine && (
                                  <button onClick={() => startEdit(msg)} style={{
                                    width: '100%', padding: '11px 16px', border: 'none',
                                    background: bgCard, cursor: 'pointer', textAlign: 'left',
                                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                    color: text,
                                  }}>
                                    ✏️ Edit message
                                  </button>
                                )}
                                {mine && (
                                  <button onClick={() => deleteForAll(msg._id)} style={{
                                    width: '100%', padding: '11px 16px', border: 'none',
                                    background: bgCard, cursor: 'pointer', textAlign: 'left',
                                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                    color: '#ef4444', borderTop: `1px solid ${border}`,
                                  }}>
                                    🗑️ Delete for everyone
                                  </button>
                                )}
                                {!mine && (
                                  <button onClick={() => hideForMe(msg._id)} style={{
                                    width: '100%', padding: '11px 16px', border: 'none',
                                    background: bgCard, cursor: 'pointer', textAlign: 'left',
                                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                    color: textSecondary,
                                  }}>
                                    🙈 Hide for me
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Editing */}
                            {isEditing ? (
                              <div style={{
                                background: mine ? '#dcf8c6' : bgCard,
                                borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}>
                                <textarea
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  autoFocus rows={2}
                                  style={{
                                    width: 200, border: 'none', outline: 'none',
                                    background: 'transparent', fontSize: 14,
                                    fontFamily: 'inherit', resize: 'none', color: text,
                                  }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                  <button onClick={() => submitEdit(msg._id)} style={{
                                    background: '#16a34a', color: 'white', border: 'none',
                                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                                    fontSize: 12, fontWeight: 600,
                                  }}>Save</button>
                                  <button onClick={() => { setEditingId(null); setEditText('') }} style={{
                                    background: '#f3f4f6', color: '#374151', border: 'none',
                                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
                                  }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                background: isDeleted ? '#f9fafb' : mine ? '#dcf8c6' : bgCard,
                                padding: '8px 12px',
                                borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                cursor: isDeleted ? 'default' : 'context-menu',
                              }}>
                                <p style={{
                                  margin: 0, fontSize: 14, lineHeight: 1.5,
                                  wordBreak: 'break-word',
                                  color: isDeleted ? '#9ca3af' : text,
                                  fontStyle: isDeleted ? 'italic' : 'normal',
                                }}>
                                  {isDeleted ? '🚫 This message was deleted' : msg.message}
                                </p>
                                <div style={{
                                  display: 'flex', justifyContent: 'flex-end',
                                  alignItems: 'center', gap: 4, marginTop: 4,
                                }}>
                                  {msg.edited && !isDeleted && (
                                    <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>edited</span>
                                  )}
                                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {mine && !isDeleted && (
                                    <span style={{ fontSize: 12, color: '#16a34a' }}>✓✓</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Reactions */}
                          {!isDeleted && Object.keys(reactionCounts).length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <div
                                  key={emoji}
                                  onClick={() => canReact() && addReaction(msg._id, emoji)}
                                  style={{
                                    background: hasReacted(msg.reactions || [], emoji) ? '#dcfce7' : bgCard,
                                    border: hasReacted(msg.reactions || [], emoji) ? '1px solid #16a34a' : `1px solid ${border}`,
                                    borderRadius: 999, padding: '2px 8px', fontSize: 13,
                                    cursor: canReact() ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  {emoji} <span style={{ fontSize: 11 }}>{count}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {!isDeleted && canReact() && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, opacity: 0.6 }}>
                              {EMOJIS.map(emoji => (
                                <span
                                  key={emoji}
                                  onClick={() => addReaction(msg._id, emoji)}
                                  style={{ cursor: 'pointer', fontSize: 16, padding: '2px 4px', borderRadius: 4 }}
                                >
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {canPost() ? (
              <div style={{
                padding: '12px 16px', background: '#f0f2f5',
                borderTop: `1px solid ${border}`,
                display: 'flex', alignItems: 'flex-end', gap: 8,
              }}>
                <div style={{
                  flex: 1, background: bgCard, borderRadius: 24,
                  padding: '10px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  <textarea
                    value={text_}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeRoom?.subType === 'resources' ? 'Share notes or announcements...' : 'Type a message...'}
                    rows={1}
                    style={{
                      width: '100%', border: 'none', outline: 'none',
                      resize: 'none', fontSize: 14, color: text,
                      background: 'transparent', fontFamily: 'inherit',
                      lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!text_.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: text_.trim() ? '#16a34a' : '#e5e7eb',
                    border: 'none',
                    cursor: text_.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s', fontSize: 18,
                  }}
                >
                  ➤
                </button>
              </div>
            ) : (
              <div style={{
                padding: '12px 20px', background: '#fef3c7',
                borderTop: '1px solid #fde68a',
                textAlign: 'center', fontSize: 13, color: '#92400e',
              }}>
                👁 You can read messages here but cannot post
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile CSS */}
      <style>{`
        @media (max-width: 768px) {
          .chat-rooms-panel {
            width: 100% !important;
            position: fixed !important;
            transform: ${view === 'rooms' ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .chat-main-area {
            margin-left: 0 !important;
            position: fixed !important;
            left: 0 !important; right: 0 !important;
            top: 0 !important; bottom: 0 !important;
            transform: ${view === 'chat' ? 'translateX(0)' : 'translateX(100%)'} !important;
            transition: transform 0.3s ease !important;
          }
          .chat-back-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .chat-rooms-panel {
            position: relative !important;
            transform: translateX(0) !important;
            width: 320px !important;
          }
          .chat-main-area {
            margin-left: 0 !important;
          }
        }
      `}</style>

    </div>
  )
}