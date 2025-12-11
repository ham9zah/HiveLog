import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  // Join a post room to receive real-time updates
  joinPost(postId) {
    if (this.socket && this.connected) {
      this.socket.emit('join-post', postId);
    }
  }

  // Leave a post room
  leavePost(postId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave-post', postId);
    }
  }

  // Listen for new comments
  onNewComment(callback) {
    if (this.socket) {
      this.socket.on('new-comment', callback);
    }
  }

  // Listen for vote updates
  onVoteUpdate(callback) {
    if (this.socket) {
      this.socket.on('post-vote-update', callback);
      this.socket.on('comment-vote-update', callback);
    }
  }

  // Listen for post transition events
  onPostTransition(callback) {
    if (this.socket) {
      this.socket.on('post-transition-started', callback);
      this.socket.on('post-transition-completed', callback);
    }
  }

  // Listen for wiki updates
  onWikiUpdate(callback) {
    if (this.socket) {
      this.socket.on('wiki-updated', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new SocketService();

export default socketService;
