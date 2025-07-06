'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface ActiveUser {
    userId: string;
    user: User;
}

interface Comment {
    _id: string;
    fieldId: string;
    parentId?: string;
    text: string;
    author: User;
    createdAt: string;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
}

interface FieldLock {
    fieldId: string;
    user: User;
}

interface CollaborationState {
    activeUsers: ActiveUser[];
    comments: Comment[];
    fieldLocks: FieldLock[];
    isConnected: boolean;
    isJoined: boolean;
}

export const useCollaboration = (templateId?: string) => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    const [state, setState] = useState<CollaborationState>({
        activeUsers: [],
        comments: [],
        fieldLocks: [],
        isConnected: false,
        isJoined: false
    });

    // Initialize socket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !templateId) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket']
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('Connected to collaboration server');
            setState(prev => ({ ...prev, isConnected: true }));
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from collaboration server');
            setState(prev => ({
                ...prev,
                isConnected: false,
                isJoined: false,
                activeUsers: [],
                fieldLocks: []
            }));
        });

        socket.on('error', (error: string) => {
            console.error('Collaboration error:', error);
            toast.error(error);
        });

        // User presence events
        socket.on('active-users', (users: ActiveUser[]) => {
            setState(prev => ({ ...prev, activeUsers: users }));
        });

        socket.on('user-joined', (activeUser: ActiveUser) => {
            setState(prev => ({
                ...prev,
                activeUsers: [...prev.activeUsers, activeUser]
            }));
            toast.info(`${activeUser.user.firstName} ${activeUser.user.lastName} joined`);
        });

        socket.on('user-left', ({ userId }: { userId: string; }) => {
            setState(prev => ({
                ...prev,
                activeUsers: prev.activeUsers.filter(u => u.userId !== userId)
            }));
        });

        // Field lock events
        socket.on('field-locks', (locks: FieldLock[]) => {
            setState(prev => ({ ...prev, fieldLocks: locks }));
        });

        socket.on('field-locked', ({ fieldId, user: lockUser }: { fieldId: string; user: User; }) => {
            setState(prev => ({
                ...prev,
                fieldLocks: [...prev.fieldLocks, { fieldId, user: lockUser }]
            }));
        });

        socket.on('field-unlocked', ({ fieldId }: { fieldId: string; }) => {
            setState(prev => ({
                ...prev,
                fieldLocks: prev.fieldLocks.filter(lock => lock.fieldId !== fieldId)
            }));
        });

        socket.on('field-lock-denied', ({ fieldId }: { fieldId: string; }) => {
            toast.warning(`Field ${fieldId} is already being edited by another user`);
        });

        // Comment events
        socket.on('comment-added', (comment: Comment) => {
            setState(prev => ({
                ...prev,
                comments: [...prev.comments, comment]
            }));
            toast.info(`New comment from ${comment.author.firstName} ${comment.author.lastName}`);
        });

        socket.on('comment-resolved', ({ commentId, resolvedBy, resolvedAt }: {
            commentId: string;
            resolvedBy: User;
            resolvedAt: string;
        }) => {
            setState(prev => ({
                ...prev,
                comments: prev.comments.map(comment =>
                    comment._id === commentId
                        ? { ...comment, resolved: true, resolvedBy: resolvedBy._id, resolvedAt }
                        : comment
                )
            }));
            toast.info(`Comment resolved by ${resolvedBy.firstName} ${resolvedBy.lastName}`);
        });

        // Template update events
        socket.on('template-updated', ({ updates, version, lastModified, lastModifiedBy }: {
            updates: any;
            version: number;
            lastModified: string;
            lastModifiedBy: User;
        }) => {
            toast.info(`Template updated by ${lastModifiedBy.firstName} ${lastModifiedBy.lastName}`);
            // Emit event for parent components to handle template updates
            window.dispatchEvent(new CustomEvent('template-updated', {
                detail: { updates, version, lastModified, lastModifiedBy }
            }));
        });

        socket.on('template-update-success', ({ version, lastModified }: {
            version: number;
            lastModified: string;
        }) => {
            console.log('Template update successful:', { version, lastModified });
        });

        socket.on('version-conflict', ({ currentVersion, serverTemplate }: {
            currentVersion: number;
            serverTemplate: any;
        }) => {
            toast.error('Version conflict detected. Please refresh and try again.');
            window.dispatchEvent(new CustomEvent('version-conflict', {
                detail: { currentVersion, serverTemplate }
            }));
        });

        // Cursor position events
        socket.on('cursor-updated', ({ userId, fieldId, position, user: cursorUser }: {
            userId: string;
            fieldId: string;
            position: any;
            user: User;
        }) => {
            // Handle cursor position updates
            window.dispatchEvent(new CustomEvent('cursor-updated', {
                detail: { userId, fieldId, position, user: cursorUser }
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [templateId]);

    // Join template collaboration
    const joinTemplate = useCallback((templateId: string) => {
        if (!socketRef.current?.connected) return;

        socketRef.current.emit('join-template', templateId);
        setState(prev => ({ ...prev, isJoined: true }));
    }, []);

    // Lock field
    const lockField = useCallback((fieldId: string) => {
        if (!socketRef.current?.connected) return;

        socketRef.current.emit('lock-field', { fieldId });
    }, []);

    // Unlock field
    const unlockField = useCallback((fieldId: string) => {
        if (!socketRef.current?.connected) return;

        socketRef.current.emit('unlock-field', { fieldId });
    }, []);

    // Update template
    const updateTemplate = useCallback((templateId: string, updates: any, version: number) => {
        if (!socketRef.current?.connected) return;

        socketRef.current.emit('template-update', { templateId, updates, version });
    }, []);

    // Add comment
    const addComment = useCallback((fieldId: string, comment: string, parentId?: string) => {
        if (!socketRef.current?.connected || !state.isJoined) return;

        socketRef.current.emit('add-comment', {
            templateId,
            fieldId,
            comment,
            parentId
        });
    }, [templateId, state.isJoined]);

    // Resolve comment
    const resolveComment = useCallback((commentId: string) => {
        if (!socketRef.current?.connected || !state.isJoined) return;

        socketRef.current.emit('resolve-comment', {
            templateId,
            commentId
        });
    }, [templateId, state.isJoined]);

    // Update cursor position
    const updateCursorPosition = useCallback((fieldId: string, position: any) => {
        if (!socketRef.current?.connected || !state.isJoined) return;

        socketRef.current.emit('cursor-position', { fieldId, position });
    }, [state.isJoined]);

    // Check if field is locked by another user
    const isFieldLocked = useCallback((fieldId: string) => {
        const lock = state.fieldLocks.find(lock => lock.fieldId === fieldId);
        return lock && lock.user._id !== user?._id ? lock : null;
    }, [state.fieldLocks, user?._id]);

    // Get comments for a specific field
    const getFieldComments = useCallback((fieldId: string) => {
        return state.comments.filter(comment => comment.fieldId === fieldId);
    }, [state.comments]);

    return {
        ...state,
        joinTemplate,
        lockField,
        unlockField,
        updateTemplate,
        addComment,
        resolveComment,
        updateCursorPosition,
        isFieldLocked,
        getFieldComments
    };
}; 