'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, MessageSquare, Clock, Eye, EyeOff } from 'lucide-react';

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

interface CollaborationPanelProps {
    activeUsers: ActiveUser[];
    comments: Comment[];
    fieldLocks: FieldLock[];
    isVisible: boolean;
    onToggleVisibility: () => void;
    onAddComment: (fieldId: string, comment: string, parentId?: string) => void;
    onResolveComment: (commentId: string) => void;
}

export const CollaborationPanel = ({
    activeUsers,
    comments,
    fieldLocks,
    isVisible,
    onToggleVisibility,
    onAddComment,
    onResolveComment
}: CollaborationPanelProps) => {
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const [newComment, setNewComment] = useState('');

    const getFieldComments = (fieldId: string) => {
        return comments.filter(comment => comment.fieldId === fieldId && !comment.parentId);
    };

    const getCommentReplies = (commentId: string) => {
        return comments.filter(comment => comment.parentId === commentId);
    };

    const handleAddComment = () => {
        if (selectedFieldId && newComment.trim()) {
            onAddComment(selectedFieldId, newComment);
            setNewComment('');
        }
    };

    const getUserInitials = (user: User) => {
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'superadmin': return 'bg-red-500';
            case 'admin': return 'bg-blue-500';
            default: return 'bg-green-500';
        }
    };

    if (!isVisible) {
        return (
            <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleVisibility}
                    className="bg-white shadow-lg"
                >
                    <Users className="h-4 w-4 mr-2" />
                    {activeUsers.length}
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed right-4 top-4 bottom-4 w-80 z-50">
            <Card className="h-full flex flex-col bg-white shadow-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Collaboration</CardTitle>
                        <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
                            <EyeOff className="h-4 w-4" />
                        </Button>
                    </div>
                    <CardDescription>Real-time collaboration tools</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden">
                    <Tabs defaultValue="users" className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="comments">Comments</TabsTrigger>
                            <TabsTrigger value="locks">Locks</TabsTrigger>
                        </TabsList>

                        <TabsContent value="users" className="flex-1 mt-4">
                            <ScrollArea className="h-full">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {activeUsers.length} Active User{activeUsers.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {activeUsers.map((activeUser) => (
                                        <div key={activeUser.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                            <div className="relative">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={`text-white text-xs ${getRoleColor(activeUser.user.role)}`}>
                                                        {getUserInitials(activeUser.user)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {activeUser.user.firstName} {activeUser.user.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {activeUser.user.email}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {activeUser.user.role}
                                            </Badge>
                                        </div>
                                    ))}

                                    {activeUsers.length === 0 && (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            No other users online
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="comments" className="flex-1 mt-4">
                            <ScrollArea className="h-full">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Add Comment Form */}
                                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                                        <select
                                            value={selectedFieldId}
                                            onChange={(e) => setSelectedFieldId(e.target.value)}
                                            className="w-full p-2 text-sm border rounded"
                                            title="Select field to comment on"
                                            aria-label="Select field to comment on"
                                        >
                                            <option value="">Select field to comment on...</option>
                                            {/* Field options would be populated dynamically */}
                                        </select>
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="w-full p-2 text-sm border rounded resize-none"
                                            rows={2}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleAddComment}
                                            disabled={!selectedFieldId || !newComment.trim()}
                                            className="w-full"
                                        >
                                            Add Comment
                                        </Button>
                                    </div>

                                    {/* Comments List */}
                                    {comments.filter(c => !c.parentId).map((comment) => (
                                        <div key={comment._id} className="space-y-2">
                                            <div className="p-3 bg-white border rounded-lg">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {getUserInitials(comment.author)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">
                                                                {comment.author.firstName} {comment.author.lastName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(comment.createdAt).toLocaleTimeString()}
                                                            </span>
                                                            {comment.resolved && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Resolved
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Field: {comment.fieldId}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm mb-2">{comment.text}</p>
                                                {!comment.resolved && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onResolveComment(comment._id)}
                                                        className="text-xs"
                                                    >
                                                        Resolve
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Replies */}
                                            {getCommentReplies(comment._id).map((reply) => (
                                                <div key={reply._id} className="ml-6 p-2 bg-muted/50 border rounded">
                                                    <div className="flex items-start gap-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="text-xs">
                                                                {getUserInitials(reply.author)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-medium">
                                                                    {reply.author.firstName} {reply.author.lastName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(reply.createdAt).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs">{reply.text}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {comments.length === 0 && (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            No comments yet
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="locks" className="flex-1 mt-4">
                            <ScrollArea className="h-full">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {fieldLocks.length} Field Lock{fieldLocks.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {fieldLocks.map((lock) => (
                                        <div key={lock.fieldId} className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs bg-yellow-500 text-white">
                                                    {getUserInitials(lock.user)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">
                                                    {lock.user.firstName} {lock.user.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Editing: {lock.fieldId}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {fieldLocks.length === 0 && (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            No fields are currently locked
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}; 