'use client';

import React, { useState, useEffect, useRef } from 'react';
import WebRTCService, { CallSession, CallParticipant, CallOptions } from '@/lib/services/WebRTCService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface VideoCallProps {
  conversationId: string;
  currentUserId: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  onCallEnd?: () => void;
  initialCall?: CallSession;
}

interface ParticipantVideoProps {
  participant: CallParticipant;
  isLocal?: boolean;
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  participant,
  isLocal = false,
  isFocused = false,
  onToggleFocus,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const getConnectionStateColor = () => {
    switch (participant.connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${
        isFocused ? 'col-span-2 row-span-2' : ''
      } ${onToggleFocus ? 'cursor-pointer' : ''}`}
      onClick={onToggleFocus}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className="w-full h-full object-cover bg-gray-900"
      />

      {/* Video disabled overlay */}
      {!participant.isVideoEnabled && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl mb-2">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-full h-full rounded-full"
                />
              ) : (
                participant.name.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-white text-sm">{participant.name}</p>
            <p className="text-gray-400 text-xs">Video off</p>
          </div>
        </div>
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium">
              {isLocal ? 'You' : participant.name}
            </span>
            {participant.isMuted && (
              <span className="text-red-400 text-xs">🔇</span>
            )}
          </div>
          
          {/* Connection indicator */}
          <div className={`w-2 h-2 rounded-full ${getConnectionStateColor()}`}></div>
        </div>
      </div>

      {/* Local controls overlay */}
      {isLocal && (
        <div className="absolute top-3 right-3">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
            You
          </span>
        </div>
      )}
    </div>
  );
};

const VideoCall: React.FC<VideoCallProps> = ({
  conversationId,
  currentUserId,
  participants,
  onCallEnd,
  initialCall,
}) => {
  const [callSession, setCallSession] = useState<CallSession | null>(initialCall || null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [focusedParticipant, setFocusedParticipant] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const webrtcService = WebRTCService.getInstance();
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Initialize with signaling channel (WebSocket)
        const signalingChannel = {
          emit: (event: string, data: any) => {
            console.log('Signaling:', event, data);
            // Would connect to actual WebSocket service
          },
          on: (event: string, handler: Function) => {
            console.log('Listening for:', event);
            // Would register WebSocket event handlers
          },
        };

        await webrtcService.initialize(signalingChannel);
        setIsConnected(true);

      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
      }
    };

    initializeWebRTC();

    return () => {
      webrtcService.cleanup();
    };
  }, []);

  // Setup WebRTC event listeners
  useEffect(() => {
    const handleCallStarted = (session: CallSession) => {
      setCallSession(session);
      startCallTimer();
    };

    const handleCallEnded = (session: CallSession) => {
      setCallSession(session);
      stopCallTimer();
      onCallEnd?.();
    };

    const handleParticipantStreamAdded = ({ participantId, stream }: any) => {
      setCallSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.id === participantId ? { ...p, stream } : p
          ),
        };
      });
    };

    const handleParticipantUpdated = (participant: CallParticipant) => {
      setCallSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.id === participant.id ? participant : p
          ),
        };
      });
    };

    const handleMuteToggled = (muted: boolean) => {
      setIsMuted(muted);
    };

    const handleVideoToggled = (enabled: boolean) => {
      setIsVideoEnabled(enabled);
    };

    // Register event listeners
    webrtcService.on('call:started', handleCallStarted);
    webrtcService.on('call:ended', handleCallEnded);
    webrtcService.on('participant:stream-added', handleParticipantStreamAdded);
    webrtcService.on('participant:updated', handleParticipantUpdated);
    webrtcService.on('participant:mute-toggled', handleMuteToggled);
    webrtcService.on('participant:video-toggled', handleVideoToggled);

    return () => {
      webrtcService.off('call:started', handleCallStarted);
      webrtcService.off('call:ended', handleCallEnded);
      webrtcService.off('participant:stream-added', handleParticipantStreamAdded);
      webrtcService.off('participant:updated', handleParticipantUpdated);
      webrtcService.off('participant:mute-toggled', handleMuteToggled);
      webrtcService.off('participant:video-toggled', handleVideoToggled);
    };
  }, [onCallEnd]);

  // Call timer
  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = undefined;
    }
  };

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async (options: CallOptions) => {
    try {
      const participantIds = participants
        .filter(p => p.id !== currentUserId)
        .map(p => p.id);
      
      const session = await webrtcService.startCall(
        conversationId,
        participantIds,
        options
      );
      
      setCallSession(session);
      
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleEndCall = async () => {
    await webrtcService.endCall();
    stopCallTimer();
    onCallEnd?.();
  };

  const handleToggleMute = async () => {
    const muted = await webrtcService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = async () => {
    const enabled = await webrtcService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await webrtcService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const screenStream = await webrtcService.startScreenShare();
      if (screenStream) {
        setIsScreenSharing(true);
      }
    }
  };

  const getParticipantGridClass = () => {
    const participantCount = callSession?.participants.length || 0;
    
    if (participantCount <= 2) {
      return 'grid-cols-1 md:grid-cols-2';
    } else if (participantCount <= 4) {
      return 'grid-cols-2';
    } else if (participantCount <= 9) {
      return 'grid-cols-3';
    } else {
      return 'grid-cols-4';
    }
  };

  // No call session - show call start options
  if (!callSession || callSession.status === 'ended') {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-4">Start a Call</h3>
        <div className="space-y-3">
          <Button
            onClick={() => handleStartCall({ audio: true, video: false })}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            📞 Audio Call
          </Button>
          <Button
            onClick={() => handleStartCall({ audio: true, video: true })}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            📹 Video Call
          </Button>
          <Button
            onClick={() => handleStartCall({ audio: true, video: true, screenShare: true })}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            🖥️ Screen Share
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div
      className="relative h-screen bg-gray-900 overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      {/* Participants grid */}
      <div className={`h-full grid gap-2 p-2 ${getParticipantGridClass()}`}>
        {callSession.participants.map((participant) => (
          <ParticipantVideo
            key={participant.id}
            participant={participant}
            isLocal={participant.id === currentUserId}
            isFocused={focusedParticipant === participant.id}
            onToggleFocus={() => {
              setFocusedParticipant(
                focusedParticipant === participant.id ? null : participant.id
              );
            }}
          />
        ))}
      </div>

      {/* Call controls overlay */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          {/* Call info */}
          <div className="text-center mb-4">
            <h3 className="text-white text-lg font-medium mb-1">
              {callSession.type === 'screen' ? 'Screen Share' : 
               callSession.type === 'video' ? 'Video Call' : 'Audio Call'}
            </h3>
            <p className="text-gray-300 text-sm">
              {formatDuration(callDuration)} • {callSession.participants.length} participants
            </p>
          </div>

          {/* Control buttons */}
          <div className="flex justify-center space-x-4">
            {/* Mute toggle */}
            <Button
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isMuted ? '🔇' : '🎤'}
            </Button>

            {/* Video toggle */}
            <Button
              onClick={handleToggleVideo}
              className={`w-12 h-12 rounded-full ${
                !isVideoEnabled 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isVideoEnabled ? '📹' : '📵'}
            </Button>

            {/* Screen share toggle */}
            <Button
              onClick={handleToggleScreenShare}
              className={`w-12 h-12 rounded-full ${
                isScreenSharing 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              🖥️
            </Button>

            {/* End call */}
            <Button
              onClick={handleEndCall}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
            >
              📞
            </Button>
          </div>
        </div>
      )}

      {/* Connection status */}
      <div className="absolute top-4 left-4">
        <div className={`px-3 py-1 rounded-full text-xs ${
          isConnected 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
        </div>
      </div>

      {/* Participant count */}
      <div className="absolute top-4 right-4">
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs">
          {callSession.participants.length} participants
        </div>
      </div>
    </div>
  );
};

export default VideoCall;