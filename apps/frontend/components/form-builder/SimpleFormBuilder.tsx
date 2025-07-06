'use client';

import React, { useState, useCallback } from 'react';
import { FormField, FieldType } from '@/types/form-builder';
import { FieldComponent, FIELD_TYPES } from './fields/FieldComponents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Material-UI Icons
import {
    Add,
    Delete,
    DragIndicator,
    KeyboardArrowUp,
    KeyboardArrowDown
} from '@mui/icons-material';

interface SimpleFormBuilderProps {
    fields: FormField[];
    onFieldsChange: (fields: FormField[]) => void;
}

export const SimpleFormBuilder: React.FC<SimpleFormBuilderProps> = ({
    fields,
    onFieldsChange
}) => {
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');

    // Generate unique IDs
    const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create field from type
    const createFieldFromType = useCallback((type: FieldType): FormField => {
        const fieldType = FIELD_TYPES.find(ft => ft.type === type);
        return {
            id: generateId(),
            type,
            label: fieldType?.label || 'New Field',
            placeholder: '',
            description: '',
            required: false,
            order: fields.length,
            validation: [],
            conditionalLogic: [],
            properties: {
                width: 'full',
                ...(type === 'select' || type === 'radio' || type === 'checkboxGroup' ? {
                    options: [
                        { id: '1', label: 'Option 1', value: 'option1' },
                        { id: '2', label: 'Option 2', value: 'option2' }
                    ]
                } : {}),
                ...(type === 'heading' ? { level: 2, content: 'Section Heading' } : {}),
                ...(type === 'paragraph' ? { content: 'This is a paragraph of text.' } : {}),
                ...(type === 'payment' ? { amount: 10, currency: 'USD' } : {})
            }
        };
    }, [fields.length]);

    // Add field
    const addField = useCallback((type: FieldType) => {
        const newField = createFieldFromType(type);
        const newFields = [...fields, newField];
        onFieldsChange(newFields);
        setSelectedFieldId(newField.id);
    }, [fields, onFieldsChange, createFieldFromType]);

    // Update field
    const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
        const newFields = fields.map(field =>
            field.id === fieldId ? { ...field, ...updates } : field
        );
        onFieldsChange(newFields);
    }, [fields, onFieldsChange]);

    // Delete field
    const deleteField = useCallback((fieldId: string) => {
        const newFields = fields.filter(field => field.id !== fieldId);
        onFieldsChange(newFields);
        if (selectedFieldId === fieldId) {
            setSelectedFieldId('');
        }
    }, [fields, onFieldsChange, selectedFieldId]);

    // Move field up
    const moveFieldUp = useCallback((fieldId: string) => {
        const fieldIndex = fields.findIndex(f => f.id === fieldId);
        if (fieldIndex > 0) {
            const newFields = [...fields];
            [newFields[fieldIndex - 1], newFields[fieldIndex]] = [newFields[fieldIndex], newFields[fieldIndex - 1]];
            onFieldsChange(newFields.map((field, index) => ({ ...field, order: index })));
        }
    }, [fields, onFieldsChange]);

    // Move field down
    const moveFieldDown = useCallback((fieldId: string) => {
        const fieldIndex = fields.findIndex(f => f.id === fieldId);
        if (fieldIndex < fields.length - 1) {
            const newFields = [...fields];
            [newFields[fieldIndex + 1], newFields[fieldIndex]] = [newFields[fieldIndex], newFields[fieldIndex + 1]];
            onFieldsChange(newFields.map((field, index) => ({ ...field, order: index })));
        }
    }, [fields, onFieldsChange]);

    // Get selected field
    const selectedField = fields.find(f => f.id === selectedFieldId);

    return (
        <div className="grid grid-cols-3 gap-6 h-96">
            {/* Field Types */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Add Fields</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-80">
                        <div className="space-y-3">
                            {Object.entries(
                                FIELD_TYPES.reduce((acc, fieldType) => {
                                    if (!acc[fieldType.category]) {
                                        acc[fieldType.category] = [];
                                    }
                                    acc[fieldType.category].push(fieldType);
                                    return acc;
                                }, {} as Record<string, typeof FIELD_TYPES>)
                            ).map(([category, fieldTypes]) => (
                                <div key={category}>
                                    <h4 className="font-medium text-xs text-gray-600 mb-2 capitalize">
                                        {category}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1">
                                        {fieldTypes.slice(0, 4).map((fieldType) => (
                                            <Button
                                                key={fieldType.id}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addField(fieldType.type)}
                                                className="justify-start h-8 text-xs"
                                            >
                                                {fieldType.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Form Preview */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Form Preview</CardTitle>
                    <CardDescription className="text-xs">
                        {fields.length} fields
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-80">
                        {fields.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Add className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-xs">Add fields to start building</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className={`relative group border rounded-lg p-3 cursor-pointer transition-colors ${selectedFieldId === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedFieldId(field.id)}
                                    >
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveFieldUp(field.id);
                                                    }}
                                                    disabled={index === 0}
                                                    className="h-5 w-5 p-0"
                                                >
                                                    <KeyboardArrowUp className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveFieldDown(field.id);
                                                    }}
                                                    disabled={index === fields.length - 1}
                                                    className="h-5 w-5 p-0"
                                                >
                                                    <KeyboardArrowDown className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteField(field.id);
                                                    }}
                                                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                                >
                                                    <Delete className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="pr-16">
                                            <FieldComponent
                                                field={field}
                                                preview={true}
                                                disabled={true}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Field Properties */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Field Properties</CardTitle>
                    <CardDescription className="text-xs">
                        {selectedField ? `Editing: ${selectedField.type}` : 'Select a field to edit'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-80">
                        {selectedField ? (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="field-label" className="text-xs">Label</Label>
                                    <Input
                                        id="field-label"
                                        value={selectedField.label}
                                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                        className="h-8 text-xs"
                                    />
                                </div>

                                {selectedField.type !== 'divider' && selectedField.type !== 'heading' && selectedField.type !== 'paragraph' && (
                                    <div className="space-y-1">
                                        <Label htmlFor="field-placeholder" className="text-xs">Placeholder</Label>
                                        <Input
                                            id="field-placeholder"
                                            value={selectedField.placeholder || ''}
                                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <Label htmlFor="field-description" className="text-xs">Description</Label>
                                    <Input
                                        id="field-description"
                                        value={selectedField.description || ''}
                                        onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
                                        className="h-8 text-xs"
                                    />
                                </div>

                                {selectedField.type !== 'divider' && selectedField.type !== 'heading' && selectedField.type !== 'paragraph' && (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="field-required"
                                            checked={selectedField.required}
                                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                            className="h-3 w-3"
                                            title="Make this field required"
                                        />
                                        <Label htmlFor="field-required" className="text-xs">Required</Label>
                                    </div>
                                )}

                                {/* Options for select/radio/checkbox fields */}
                                {(['select', 'radio', 'checkboxGroup'].includes(selectedField.type)) && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Options</Label>
                                        <div className="space-y-1">
                                            {selectedField.properties.options?.map((option, index) => (
                                                <div key={option.id} className="flex gap-1">
                                                    <Input
                                                        value={option.label}
                                                        onChange={(e) => {
                                                            const newOptions = [...(selectedField.properties.options || [])];
                                                            newOptions[index] = { ...option, label: e.target.value };
                                                            updateField(selectedField.id, {
                                                                properties: { ...selectedField.properties, options: newOptions }
                                                            });
                                                        }}
                                                        className="h-6 text-xs flex-1"
                                                        placeholder="Option label"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const newOptions = selectedField.properties.options?.filter(o => o.id !== option.id) || [];
                                                            updateField(selectedField.id, {
                                                                properties: { ...selectedField.properties, options: newOptions }
                                                            });
                                                        }}
                                                        className="h-6 w-6 p-0 text-red-500"
                                                    >
                                                        <Delete className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const newOption = {
                                                        id: `option_${Date.now()}`,
                                                        label: 'New Option',
                                                        value: `option_${Date.now()}`
                                                    };
                                                    const newOptions = [...(selectedField.properties.options || []), newOption];
                                                    updateField(selectedField.id, {
                                                        properties: { ...selectedField.properties, options: newOptions }
                                                    });
                                                }}
                                                className="h-6 w-full text-xs"
                                            >
                                                <Add className="h-3 w-3 mr-1" />
                                                Add Option
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-xs">Select a field to edit its properties</div>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}; 