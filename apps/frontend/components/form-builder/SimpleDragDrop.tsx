'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FormField, FieldType } from '@/types/form-builder';
import { FIELD_TYPES } from './fields/FieldComponents';

interface DragDropContextProps {
    onDragEnd: (result: { draggedId: string; targetIndex: number; sourceIndex: number; }) => void;
    children: React.ReactNode;
}

interface DroppableProps {
    droppableId: string;
    children: (provided: any) => React.ReactNode;
    className?: string;
}

interface DraggableProps {
    draggableId: string;
    index: number;
    children: (provided: any, snapshot: any) => React.ReactNode;
    isDragDisabled?: boolean;
}

// Simple drag and drop context
export const SimpleDragDropContext: React.FC<DragDropContextProps> = ({ onDragEnd, children }) => {
    const [draggedItem, setDraggedItem] = useState<{ id: string; index: number; } | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((id: string, index: number) => {
        setDraggedItem({ id, index });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedItem) {
            onDragEnd({
                draggedId: draggedItem.id,
                targetIndex,
                sourceIndex: draggedItem.index
            });
        }
        setDraggedItem(null);
        setDragOverIndex(null);
    }, [draggedItem, onDragEnd]);

    const handleDragEnd = useCallback(() => {
        setDraggedItem(null);
        setDragOverIndex(null);
    }, []);

    const contextValue = {
        draggedItem,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    };

    return (
        <div data-drag-context="true">
            {React.Children.map(children, child =>
                React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<any>, { dragContext: contextValue })
                    : child
            )}
        </div>
    );
};

// Simple droppable component
export const SimpleDroppable: React.FC<DroppableProps & { dragContext?: any; }> = ({
    droppableId,
    children,
    className = '',
    dragContext
}) => {
    const ref = useRef<HTMLDivElement>(null);

    const provided = {
        droppableProps: {
            ref,
            onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
            },
            onDrop: (e: React.DragEvent) => {
                if (dragContext) {
                    const rect = ref.current?.getBoundingClientRect();
                    if (rect) {
                        const y = e.clientY - rect.top;
                        const children = ref.current?.children;
                        let targetIndex = children ? children.length : 0;

                        if (children) {
                            for (let i = 0; i < children.length; i++) {
                                const childRect = children[i].getBoundingClientRect();
                                if (y < childRect.top - rect.top + childRect.height / 2) {
                                    targetIndex = i;
                                    break;
                                }
                            }
                        }

                        dragContext.handleDrop(e, targetIndex);
                    }
                }
            }
        },
        innerRef: ref,
        placeholder: null
    };

    return (
        <div className={className}>
            {children(provided)}
        </div>
    );
};

// Simple draggable component
export const SimpleDraggable: React.FC<DraggableProps & { dragContext?: any; }> = ({
    draggableId,
    index,
    children,
    isDragDisabled = false,
    dragContext
}) => {
    const ref = useRef<HTMLDivElement>(null);

    const provided = {
        draggableProps: {
            ref,
            draggable: !isDragDisabled,
            onDragStart: (e: React.DragEvent) => {
                if (dragContext && !isDragDisabled) {
                    dragContext.handleDragStart(draggableId, index);
                }
            },
            onDragEnd: () => {
                if (dragContext) {
                    dragContext.handleDragEnd();
                }
            }
        },
        dragHandleProps: {
            style: {
                cursor: isDragDisabled ? 'default' : 'grab'
            }
        },
        innerRef: ref
    };

    const snapshot = {
        isDragging: dragContext?.draggedItem?.id === draggableId,
        isDropAnimating: false
    };

    return <>{children(provided, snapshot)}</>;
};

// Field type draggable component
interface FieldTypeDraggableProps {
    fieldType: typeof FIELD_TYPES[0];
    index: number;
    onAddField: (type: FieldType) => void;
}

export const FieldTypeDraggable: React.FC<FieldTypeDraggableProps> = ({
    fieldType,
    index,
    onAddField
}) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('field-type', fieldType.type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onAddField(fieldType.type)}
            className="p-3 bg-white border rounded-lg cursor-grab hover:shadow-sm transition-shadow active:cursor-grabbing"
        >
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <fieldType.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{fieldType.label}</p>
                    <p className="text-xs text-gray-500 truncate">
                        {fieldType.description}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Drop zone component
interface DropZoneProps {
    onDrop: (fieldType: FieldType, index: number) => void;
    index: number;
    children: React.ReactNode;
    className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
    onDrop,
    index,
    children,
    className = ''
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const fieldType = e.dataTransfer.getData('field-type') as FieldType;
        if (fieldType) {
            onDrop(fieldType, index);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${className} ${isDragOver ? 'bg-blue-100 border-blue-300 border-2 border-dashed' : ''}`}
        >
            {children}
            {isDragOver && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-medium">Drop field here</span>
                </div>
            )}
        </div>
    );
}; 