'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { getAuthToken } from '../../utils/auth'

interface User {
  _id: string
  name: string
  role: string
  faculty: string
  department: string
  level: string
}

export default function VideoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const liveId = searchParams.get('liveId')

  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState('Initializing...')
  const [statusType, setStatusType] = useState<'connecting' | 'waiting' | 'connected' | 'error'>('connecting')
  const [connected, setConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const roomRef = useRef<string>('')
  const controlsTimerRef = useRef<any>(null)
  const durationTimerRef = useRef<any>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  // Auto-hide controls after 3 seconds of no mouse movement
  const resetControlsTimer = () => {
    setShowControls(true)
    clearTimeout(controlsTimerRef.current)
    if (connected) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  // Duration timer
  useEffect(() => {
    if (connected) {
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(durationTimerRef.current)
  }, [connected])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  useEffect(() => {
    if (!liveId) { router.push('/live'); return }
    const token = getAuthToken()
    if (!token) { router.push('/login'); return }

    const init = async () => {
      try {
        setStatus('Getting your profile...')
        setStatusType('connecting')

        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const userData = await userRes.json()
        setUser(userData)

        setStatus('Accessing camera and microphone...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        const socket = io(API_BASE)
        socketRef.current = socket

        const room = `live_${liveId}`
        roomRef.current = room

        socket.emit('userOnline', userData)
        socket.emit('joinLiveRoom', { room, liveId, token })

        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        })
        peerRef.current = peer

        stream.getTracks().forEach(track => peer.addTrack(track, stream))

        peer.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
            setConnected(true)
            setStatus('Connected')
            setStatusType('connected')
          }
        }

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc-candidate', { candidate: event.candidate, room })
          }
        }

        peer.onconnectionstatechange = () => {
          const state = peer.connectionState
          if (state === 'connected') {
            setStatus('Connected')
            setStatusType('connected')
            setConnected(true)
          } else if (state === 'disconnected') {
            setStatus('Connection interrupted')
            setStatusType('error')
            setConnected(false)
          } else if (state === 'failed') {
            setStatus('Connection failed — please refresh')
            setStatusType('error')
            setConnected(false)
          }
        }

        if (userData.role === 'lecturer' || userData.role === 'admin') {
          setStatus('Waiting for students to join...')
          setStatusType('waiting')

          socket.on('studentJoined', async () => {
            setStatus('Student joined — establishing connection...')
            setStatusType('connecting')
            const offer = await peer.createOffer()
            await peer.setLocalDescription(offer)
            socket.emit('webrtc-offer', { offer, room })
          })
        }

        socket.on('webrtc-offer', async ({ offer }) => {
          setStatus('Connecting to lecturer...')
          setStatusType('connecting')
          await peer.setRemoteDescription(new RTCSessionDescription(offer))
          const answer = await peer.createAnswer()
          await peer.setLocalDescription(answer)
          socket.emit('webrtc-answer', { answer, room })
        })

        socket.on('webrtc-answer', async ({ answer }) => {
          await peer.setRemoteDescription(new RTCSessionDescription(answer))
        })

        socket.on('webrtc-candidate', async ({ candidate }) => {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (err) {
            console.error('ICE error:', err)
          }
        })

        socket.on('liveEnded', () => {
          setStatus('Session ended by host')
          setStatusType('error')
          setTimeout(() => router.push('/live'), 3000)
        })

        socket.emit('liveRoomJoined', { room, user: userData })

        setStatus(
          userData.role === 'student'
            ? 'Waiting for lecturer...'
            : 'Waiting for students to join...'
        )
        setStatusType('waiting')

      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setStatus('Camera/microphone access denied. Please allow access and refresh.')
        } else if (err.name === 'NotFoundError') {
          setStatus('No camera or microphone found.')
        } else {
          setStatus('Failed to initialize. Please refresh.')
          console.error(err)
        }
        setStatusType('error')
      }
    }

    init()

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      peerRef.current?.close()
      socketRef.current?.disconnect()
      clearTimeout(controlsTimerRef.current)
      clearInterval(durationTimerRef.current)
    }
  }, [liveId, router])

  const toggleMute = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0]
    if (audio) { audio.enabled = !audio.enabled; setIsMuted(!audio.enabled) }
  }

  const toggleVideo = () => {
    const video = localStreamRef.current?.getVideoTracks()[0]
    if (video) { video.enabled = !video.enabled; setIsVideoOff(!video.enabled) }
  }

  const leaveLive = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
    socketRef.current?.disconnect()
    router.push('/live')
  }

  const statusColors = {
    connecting: '#f59e0b',
    waiting: '#3b82f6',
    connected: '#16a34a',
    error: '#ef4444',
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      style={{
        background: '#0a0a0f',
        height: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        cursor: showControls ? 'default' : 'none',
      }}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >

      {/* ===== TOP BAR ===== */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: '16px 24px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'opacity 0.3s',
        opacity: showControls ? 1 : 0,
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColors[statusType],
              boxShadow: `0 0 8px ${statusColors[statusType]}`,
            }} />
            <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
              {status}
            </span>
          </div>
        </div>

        {/* Duration */}
        {connected && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: 999,
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ef4444',
            }} />
            {formatDuration(duration)}
          </div>
        )}

      </div>


      {/* ===== VIDEO AREA ===== */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 12,
      }}>

        {/* Remote video */}
        {connected && (
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '65%',
            aspectRatio: '16/9',
            background: '#1a1a2e',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              padding: '4px 12px',
              borderRadius: 6,
              color: 'white',
              fontSize: 12,
              fontWeight: 500,
            }}>
              {user?.role === 'student' ? '👨‍🏫 Lecturer' : '🎓 Student'}
            </div>
          </div>
        )}

        {/* Local video */}
        <div style={{
          position: connected ? 'absolute' : 'relative',
          bottom: connected ? 100 : 'auto',
          right: connected ? 24 : 'auto',
          width: connected ? 200 : '60%',
          maxWidth: connected ? 200 : 560,
          aspectRatio: '16/9',
          background: '#1a1a2e',
          borderRadius: connected ? 12 : 16,
          overflow: 'hidden',
          boxShadow: connected
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          border: connected ? '2px solid rgba(255,255,255,0.2)' : 'none',
          zIndex: 5,
          transition: 'all 0.3s ease',
        }}>

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isVideoOff ? 'brightness(0)' : 'none',
              transform: 'scaleX(-1)', // Mirror effect
            }}
          />

          {/* Camera off overlay */}
          {isVideoOff && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#1a1a2e',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: 'white',
              }}>
                {getInitials(user?.name || '?')}
              </div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Camera off</span>
            </div>
          )}

          {/* Mute indicator */}
          {isMuted && (
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#ef4444',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}>
              🔇
            </div>
          )}

          {/* Your name label */}
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            padding: '3px 10px',
            borderRadius: 4,
            color: 'white',
            fontSize: 11,
            fontWeight: 500,
          }}>
            {user?.name} (You)
          </div>

        </div>

        {/* Waiting screen — shown when not connected */}
        {!connected && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 3,
            pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '32px 40px',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {statusType === 'error' ? '❌' :
                  statusType === 'waiting' ? (user?.role === 'student' ? '⏳' : '📡') : '🔄'}
              </div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                {status}
              </p>
              <p style={{ color: '#6b7280', fontSize: 13, maxWidth: 280 }}>
                {statusType === 'waiting' && user?.role === 'student' &&
                  'Your camera is ready. The lecturer will connect soon.'}
                {statusType === 'waiting' && user?.role !== 'student' &&
                  'Your session is live. Students will connect automatically.'}
                {statusType === 'error' &&
                  'Please check your connection and try again.'}
              </p>
            </div>
          </div>
        )}

      </div>


      {/* ===== BOTTOM CONTROLS ===== */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '32px 24px 24px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        transition: 'opacity 0.3s',
        opacity: showControls ? 1 : 0,
        zIndex: 10,
      }}>

        {/* Mute */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: 'none',
            background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: 'none',
            background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isVideoOff ? '📷' : '🎥'}
        </button>

        {/* Leave */}
        <button
          onClick={leaveLive}
          style={{
            padding: '0 32px',
            height: 52,
            borderRadius: 26,
            border: 'none',
            background: '#ef4444',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
          }}
        >
          📞 Leave Session
        </button>

      </div>

    </div>
  )
}