// ============================================================================
// useSocket — Lazy Socket.IO client hook
// Only connects when subscription is requested, not on import
// ============================================================================

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/socket-types";
import { SOCKET_EVENTS } from "@/lib/socket-types";
import type { UserRole } from "@/types";

// ── Socket singleton (survives React re-renders) ──────────────────────────
let globalSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
  null;
let connectErrorLogged = false;

function getOrCreateSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  if (globalSocket?.connected) {
    return globalSocket;
  }

  if (!globalSocket) {
    globalSocket = io({
      path: "/api/socketio",
      transports: ["websocket"], // Prefer WebSocket, polling as fallback removed to reduce overhead
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5, // Reduced from 10
      reconnectionDelay: 3000, // Increased from 2000ms to reduce rapid reconnection spam
      reconnectionDelayMax: 10000, // Reduced from 15000ms
      timeout: 10000, // Reduced from 20000ms
      forceNew: false,
    });

    globalSocket.on("connect", () => {
      connectErrorLogged = false;
    });

    globalSocket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        // Already handled silently
      }
    });

    globalSocket.on("connect_error", () => {
      if (!connectErrorLogged) {
        connectErrorLogged = true;
      }
    });
  }

  return globalSocket;
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useSocket() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(getOrCreateSocket());
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const socket = socketRef.current;

  // Track connection state
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);

    // Sync initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    };
  }, [socket]);

  // Auto-join role room when session is available
  useEffect(() => {
    const role = session?.user?.role as UserRole | undefined;
    if (role && socket.connected && !joinedRoomsRef.current.has(role)) {
      socket.emit(SOCKET_EVENTS.JOIN_ROLE_ROOM, role);
      joinedRoomsRef.current.add(role);
    }

    return () => {
      if (role) {
        socket.emit(SOCKET_EVENTS.LEAVE_ROLE_ROOM, role);
        joinedRoomsRef.current.delete(role);
      }
    };
  }, [session?.user?.role, socket]);

  // ── Typed event subscription ──────────────────────────────────────────
  const subscribe = useCallback(
    <T extends keyof ServerToClientEvents>(
      event: T,
      handler: ServerToClientEvents[T]
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on(event, handler);

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off(event, handler);
      };
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    subscribe,
    socketId: socket.id,
  };
}