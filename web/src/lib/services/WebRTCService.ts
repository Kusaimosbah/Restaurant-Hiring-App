import { EventEmitter } from 'events';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  connectionState?: RTCPeerConnectionState;
}

export interface CallOptions {
  video: boolean;
  audio: boolean;
  screenShare?: boolean;
}

export interface CallSession {
  id: string;
  conversationId: string;
  initiatorId: string;
  participants: CallParticipant[];
  type: 'audio' | 'video' | 'screen';
  status: 'calling' | 'connected' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface ICEServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

class WebRTCService extends EventEmitter {
  private static instance: WebRTCService;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private currentCall: CallSession | null = null;
  private iceServers: ICEServerConfig[] = [];
  private isInitialized = false;
  private signalingChannel: any = null; // WebSocket connection for signaling

  private constructor() {
    super();
    this.setupDefaultICEServers();
  }

  public static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  private setupDefaultICEServers() {
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      // { 
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
    ];
  }

  public async initialize(signalingChannel: any, customICEServers?: ICEServerConfig[]) {
    if (this.isInitialized) return;

    this.signalingChannel = signalingChannel;
    
    if (customICEServers) {
      this.iceServers = customICEServers;
    }

    // Setup signaling event listeners
    this.setupSignalingListeners();
    
    this.isInitialized = true;
    this.emit('initialized');
  }

  private setupSignalingListeners() {
    if (!this.signalingChannel) return;

    this.signalingChannel.on('call:offer', this.handleCallOffer.bind(this));
    this.signalingChannel.on('call:answer', this.handleCallAnswer.bind(this));
    this.signalingChannel.on('call:ice-candidate', this.handleICECandidate.bind(this));
    this.signalingChannel.on('call:end', this.handleCallEnd.bind(this));
    this.signalingChannel.on('call:participant-update', this.handleParticipantUpdate.bind(this));
  }

  public async startCall(
    conversationId: string,
    participantIds: string[],
    options: CallOptions
  ): Promise<CallSession> {
    try {
      // Get local media stream
      const stream = await this.getUserMedia(options);
      this.localStream = stream;

      // Create call session
      const callSession: CallSession = {
        id: this.generateCallId(),
        conversationId,
        initiatorId: 'current-user-id', // Would get from auth
        participants: [
          {
            id: 'current-user-id',
            name: 'You',
            stream,
            isMuted: !options.audio,
            isVideoEnabled: options.video,
          }
        ],
        type: options.screenShare ? 'screen' : (options.video ? 'video' : 'audio'),
        status: 'calling',
        startTime: new Date(),
      };

      this.currentCall = callSession;

      // Create peer connections for each participant
      for (const participantId of participantIds) {
        await this.createPeerConnection(participantId);
      }

      // Send call offers
      await this.sendCallOffers(participantIds, options);

      this.emit('call:started', callSession);
      return callSession;

    } catch (error) {
      this.emit('call:error', error);
      throw error;
    }
  }

  public async answerCall(callId: string, options: CallOptions): Promise<void> {
    try {
      // Get local media stream
      const stream = await this.getUserMedia(options);
      this.localStream = stream;

      // Find the call and update status
      if (this.currentCall && this.currentCall.id === callId) {
        this.currentCall.status = 'connected';
        
        // Add local participant
        this.currentCall.participants.push({
          id: 'current-user-id',
          name: 'You',
          stream,
          isMuted: !options.audio,
          isVideoEnabled: options.video,
        });
      }

      this.emit('call:answered', this.currentCall);

    } catch (error) {
      this.emit('call:error', error);
      throw error;
    }
  }

  public async endCall(): Promise<void> {
    if (!this.currentCall) return;

    // Close all peer connections
    for (const [participantId, pc] of this.peerConnections) {
      pc.close();
      this.peerConnections.delete(participantId);
    }

    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();

    // Update call status
    const endTime = new Date();
    const duration = this.currentCall.startTime 
      ? Math.floor((endTime.getTime() - this.currentCall.startTime.getTime()) / 1000)
      : 0;

    this.currentCall.status = 'ended';
    this.currentCall.endTime = endTime;
    this.currentCall.duration = duration;

    // Notify other participants
    if (this.signalingChannel) {
      this.signalingChannel.emit('call:end', {
        callId: this.currentCall.id,
        participantId: 'current-user-id',
      });
    }

    const endedCall = this.currentCall;
    this.currentCall = null;

    this.emit('call:ended', endedCall);
  }

  public async toggleMute(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      
      // Update current call participant
      if (this.currentCall) {
        const localParticipant = this.currentCall.participants.find(p => p.id === 'current-user-id');
        if (localParticipant) {
          localParticipant.isMuted = !audioTrack.enabled;
        }
      }

      // Notify other participants
      this.notifyParticipantUpdate();
      this.emit('participant:mute-toggled', !audioTrack.enabled);
      
      return !audioTrack.enabled;
    }
    return false;
  }

  public async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      
      // Update current call participant
      if (this.currentCall) {
        const localParticipant = this.currentCall.participants.find(p => p.id === 'current-user-id');
        if (localParticipant) {
          localParticipant.isVideoEnabled = videoTrack.enabled;
        }
      }

      // Notify other participants
      this.notifyParticipantUpdate();
      this.emit('participant:video-toggled', videoTrack.enabled);
      
      return videoTrack.enabled;
    }
    return false;
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        for (const [participantId, pc] of this.peerConnections) {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      this.emit('screen-share:started', screenStream);
      return screenStream;

    } catch (error) {
      this.emit('screen-share:error', error);
      return null;
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (!this.localStream) return;

    // Get camera stream again
    const cameraStream = await this.getUserMedia({ video: true, audio: true });
    const videoTrack = cameraStream.getVideoTracks()[0];

    if (videoTrack) {
      // Replace screen share track with camera track
      for (const [participantId, pc] of this.peerConnections) {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
    }

    this.emit('screen-share:stopped');
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(participantId: string): MediaStream | null {
    return this.remoteStreams.get(participantId) || null;
  }

  public getCurrentCall(): CallSession | null {
    return this.currentCall;
  }

  public getConnectionState(participantId: string): RTCPeerConnectionState | null {
    const pc = this.peerConnections.get(participantId);
    return pc ? pc.connectionState : null;
  }

  // Private methods

  private async getUserMedia(options: CallOptions): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: options.audio,
      video: options.video || options.screenShare,
    };

    if (options.screenShare) {
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    } else {
      return await navigator.mediaDevices.getUserMedia(constraints);
    }
  }

  private async createPeerConnection(participantId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.signalingChannel) {
        this.signalingChannel.emit('call:ice-candidate', {
          callId: this.currentCall?.id,
          candidate: event.candidate,
          targetParticipantId: participantId,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.remoteStreams.set(participantId, remoteStream);
      
      // Update participant with stream
      if (this.currentCall) {
        const participant = this.currentCall.participants.find(p => p.id === participantId);
        if (participant) {
          participant.stream = remoteStream;
        } else {
          this.currentCall.participants.push({
            id: participantId,
            name: `Participant ${participantId}`,
            stream: remoteStream,
          });
        }
      }

      this.emit('participant:stream-added', { participantId, stream: remoteStream });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (this.currentCall) {
        const participant = this.currentCall.participants.find(p => p.id === participantId);
        if (participant) {
          participant.connectionState = pc.connectionState;
        }
      }
      
      this.emit('participant:connection-state-changed', {
        participantId,
        state: pc.connectionState,
      });

      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.handleParticipantDisconnected(participantId);
      }
    };

    this.peerConnections.set(participantId, pc);
    return pc;
  }

  private async sendCallOffers(participantIds: string[], options: CallOptions) {
    for (const participantId of participantIds) {
      const pc = this.peerConnections.get(participantId);
      if (!pc) continue;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (this.signalingChannel) {
          this.signalingChannel.emit('call:offer', {
            callId: this.currentCall?.id,
            offer,
            options,
            targetParticipantId: participantId,
          });
        }
      } catch (error) {
        console.error(`Failed to send offer to ${participantId}:`, error);
      }
    }
  }

  private async handleCallOffer(data: any) {
    const { callId, offer, options, fromParticipantId } = data;

    try {
      // Create peer connection if doesn't exist
      let pc = this.peerConnections.get(fromParticipantId);
      if (!pc) {
        pc = await this.createPeerConnection(fromParticipantId);
      }

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (this.signalingChannel) {
        this.signalingChannel.emit('call:answer', {
          callId,
          answer,
          targetParticipantId: fromParticipantId,
        });
      }

      this.emit('call:offer-received', { callId, options, fromParticipantId });

    } catch (error) {
      console.error('Failed to handle call offer:', error);
    }
  }

  private async handleCallAnswer(data: any) {
    const { answer, fromParticipantId } = data;

    try {
      const pc = this.peerConnections.get(fromParticipantId);
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('Failed to handle call answer:', error);
    }
  }

  private async handleICECandidate(data: any) {
    const { candidate, fromParticipantId } = data;

    try {
      const pc = this.peerConnections.get(fromParticipantId);
      if (pc) {
        await pc.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }

  private handleCallEnd(data: any) {
    const { callId, fromParticipantId } = data;

    // Remove participant from current call
    if (this.currentCall && this.currentCall.id === callId) {
      this.currentCall.participants = this.currentCall.participants.filter(
        p => p.id !== fromParticipantId
      );
    }

    // Close peer connection
    const pc = this.peerConnections.get(fromParticipantId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(fromParticipantId);
    }

    // Remove remote stream
    this.remoteStreams.delete(fromParticipantId);

    this.emit('participant:left', fromParticipantId);

    // End call if no participants left
    if (this.currentCall && this.currentCall.participants.length <= 1) {
      this.endCall();
    }
  }

  private handleParticipantUpdate(data: any) {
    const { participantId, updates } = data;

    if (this.currentCall) {
      const participant = this.currentCall.participants.find(p => p.id === participantId);
      if (participant) {
        Object.assign(participant, updates);
        this.emit('participant:updated', participant);
      }
    }
  }

  private handleParticipantDisconnected(participantId: string) {
    // Remove from current call
    if (this.currentCall) {
      this.currentCall.participants = this.currentCall.participants.filter(
        p => p.id !== participantId
      );
    }

    // Clean up peer connection
    const pc = this.peerConnections.get(participantId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(participantId);
    }

    // Remove remote stream
    this.remoteStreams.delete(participantId);

    this.emit('participant:disconnected', participantId);
  }

  private notifyParticipantUpdate() {
    if (!this.currentCall || !this.signalingChannel) return;

    const localParticipant = this.currentCall.participants.find(p => p.id === 'current-user-id');
    if (!localParticipant) return;

    this.signalingChannel.emit('call:participant-update', {
      callId: this.currentCall.id,
      participantId: 'current-user-id',
      updates: {
        isMuted: localParticipant.isMuted,
        isVideoEnabled: localParticipant.isVideoEnabled,
      },
    });
  }

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public cleanup() {
    this.endCall();
    this.removeAllListeners();
    this.isInitialized = false;
  }
}

export default WebRTCService;