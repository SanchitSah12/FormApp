'use client';

import React, { useState, useCallback } from 'react';
import { FormField, FieldOption, ValidationRule } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, GripVertical, Settings, Eye, MessageSquare } from 'lucide-react';

interface FieldPropertiesPanelProps {
    field: FormField | null;
    onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void;
    onFieldDelete: (fieldId: string) => void;
    onAddComment?: (fieldId: string, comment: string) => void;
    comments?: Array<{
        id: string;
        text: string;
        author: string;
        createdAt: Date;
    }>;
}

export const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({
    field,
    onFieldUpdate,
    onFieldDelete,
    onAddComment,
    comments = []
}) => {
    const [newComment, setNewComment] = useState('');

    const updateField = useCallback((updates: Partial<FormField>) => {
        if (!field) return;
        onFieldUpdate(field.id, updates);
    }, [field, onFieldUpdate]);

    const updateProperties = useCallback((updates: Partial<FormField['properties']>) => {
        if (!field) return;
        updateField({
            properties: {
                ...field.properties,
                ...updates
            }
        });
    }, [field, updateField]);

    const addOption = useCallback(() => {
        if (!field) return;
        const newOption: FieldOption = {
            id: `option_${Date.now()}`,
            label: 'New Option',
            value: `option_${Date.now()}`
        };

        updateProperties({
            options: [...(field.properties.options || []), newOption]
        });
    }, [field, updateProperties]);

    const updateOption = useCallback((optionId: string, updates: Partial<FieldOption>) => {
        if (!field || !field.properties.options) return;

        const updatedOptions = field.properties.options.map(option =>
            option.id === optionId ? { ...option, ...updates } : option
        );

        updateProperties({ options: updatedOptions });
    }, [field, updateProperties]);

    const removeOption = useCallback((optionId: string) => {
        if (!field || !field.properties.options) return;

        const updatedOptions = field.properties.options.filter(option => option.id !== optionId);
        updateProperties({ options: updatedOptions });
    }, [field, updateProperties]);

    const addValidationRule = useCallback(() => {
        if (!field) return;

        const newRule: ValidationRule = {
            id: `rule_${Date.now()}`,
            type: 'required',
            message: 'This field is required',
            value: true
        };

        updateField({
            validation: [...(field.validation || []), newRule]
        });
    }, [field, updateField]);

    const updateValidationRule = useCallback((ruleId: string, updates: Partial<ValidationRule>) => {
        if (!field || !field.validation) return;

        const updatedRules = field.validation.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
        );

        updateField({ validation: updatedRules });
    }, [field, updateField]);

    const removeValidationRule = useCallback((ruleId: string) => {
        if (!field || !field.validation) return;

        const updatedRules = field.validation.filter(rule => rule.id !== ruleId);
        updateField({ validation: updatedRules });
    }, [field, updateField]);

    const handleAddComment = useCallback(() => {
        if (!field || !newComment.trim() || !onAddComment) return;

        onAddComment(field.id, newComment);
        setNewComment('');
    }, [field, newComment, onAddComment]);

    if (!field) {
        return (
            <div className="w-80 border-l bg-gray-50 p-6">
                <div className="text-center text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="font-medium mb-2">No Field Selected</h3>
                    <p className="text-sm">Select a field to edit its properties</p>
                </div>
            </div>
        );
    }

    const hasOptions = ['select', 'radio', 'checkboxGroup'].includes(field.type);
    const hasMinMax = ['text', 'textarea', 'number'].includes(field.type);
    const hasFileSettings = field.type === 'file';
    const hasDateSettings = ['date', 'time', 'datetime'].includes(field.type);
    const hasPaymentSettings = field.type === 'payment';
    const hasContentSettings = ['heading', 'paragraph'].includes(field.type);

    return (
        <div className="w-80 border-l bg-white flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Field Properties</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFieldDelete(field.id)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <Badge variant="outline">{field.type}</Badge>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                            <TabsTrigger value="comments">
                                Comments
                                {comments.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {comments.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            {/* Basic Properties */}
                            <div className="space-y-2">
                                <Label htmlFor="field-label">Label</Label>
                                <Input
                                    id="field-label"
                                    value={field.label}
                                    onChange={(e) => updateField({ label: e.target.value })}
                                    placeholder="Field label"
                                />
                            </div>

                            {field.type !== 'divider' && field.type !== 'heading' && field.type !== 'paragraph' && (
                                <div className="space-y-2">
                                    <Label htmlFor="field-placeholder">Placeholder</Label>
                                    <Input
                                        id="field-placeholder"
                                        value={field.placeholder || ''}
                                        onChange={(e) => updateField({ placeholder: e.target.value })}
                                        placeholder="Placeholder text"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="field-description">Description</Label>
                                <Textarea
                                    id="field-description"
                                    value={field.description || ''}
                                    onChange={(e) => updateField({ description: e.target.value })}
                                    placeholder="Help text for this field"
                                    rows={2}
                                />
                            </div>

                            {field.type !== 'divider' && field.type !== 'heading' && field.type !== 'paragraph' && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="field-required"
                                        checked={field.required}
                                        onCheckedChange={(checked) => updateField({ required: !!checked })}
                                    />
                                    <Label htmlFor="field-required">Required field</Label>
                                </div>
                            )}

                            {/* Width Setting */}
                            <div className="space-y-2">
                                <Label htmlFor="field-width">Field Width</Label>
                                <Select
                                    value={field.properties.width || 'full'}
                                    onValueChange={(value) => updateProperties({ width: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">Full Width</SelectItem>
                                        <SelectItem value="half">Half Width</SelectItem>
                                        <SelectItem value="third">One Third</SelectItem>
                                        <SelectItem value="quarter">One Quarter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Content Settings for Layout Fields */}
                            {hasContentSettings && (
                                <div className="space-y-4">
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="field-content">Content</Label>
                                        <Textarea
                                            id="field-content"
                                            value={field.properties.content || ''}
                                            onChange={(e) => updateProperties({ content: e.target.value })}
                                            placeholder={field.type === 'heading' ? 'Heading text' : 'Paragraph content'}
                                            rows={3}
                                        />
                                    </div>

                                    {field.type === 'heading' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="heading-level">Heading Level</Label>
                                            <Select
                                                value={field.properties.level?.toString() || '2'}
                                                onValueChange={(value) => updateProperties({ level: parseInt(value) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">H1</SelectItem>
                                                    <SelectItem value="2">H2</SelectItem>
                                                    <SelectItem value="3">H3</SelectItem>
                                                    <SelectItem value="4">H4</SelectItem>
                                                    <SelectItem value="5">H5</SelectItem>
                                                    <SelectItem value="6">H6</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Options for Select/Radio/Checkbox Fields */}
                            {hasOptions && (
                                <div className="space-y-4">
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <Label>Options</Label>
                                        <Button size="sm" onClick={addOption}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {field.properties.options?.map((option, index) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-gray-400" />
                                                <Input
                                                    value={option.label}
                                                    onChange={(e) => updateOption(option.id, { label: e.target.value })}
                                                    placeholder="Option label"
                                                    className="flex-1"
                                                />
                                                <Input
                                                    value={option.value}
                                                    onChange={(e) => updateOption(option.id, { value: e.target.value })}
                                                    placeholder="Value"
                                                    className="w-20"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeOption(option.id)}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment Settings */}
                            {hasPaymentSettings && (
                                <div className="space-y-4">
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-amount">Amount</Label>
                                        <Input
                                            id="payment-amount"
                                            type="number"
                                            value={field.properties.amount || 0}
                                            onChange={(e) => updateProperties({ amount: parseFloat(e.target.value) })}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payment-currency">Currency</Label>
                                        <Select
                                            value={field.properties.currency || 'USD'}
                                            onValueChange={(value) => updateProperties({ currency: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                                <SelectItem value="GBP">GBP</SelectItem>
                                                <SelectItem value="CAD">CAD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4 mt-4">
                            {/* Min/Max Length for Text Fields */}
                            {hasMinMax && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="min-length">Minimum Length</Label>
                                        <Input
                                            id="min-length"
                                            type="number"
                                            value={field.properties.minLength || ''}
                                            onChange={(e) => updateProperties({
                                                minLength: e.target.value ? parseInt(e.target.value) : undefined
                                            })}
                                            placeholder="No minimum"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max-length">Maximum Length</Label>
                                        <Input
                                            id="max-length"
                                            type="number"
                                            value={field.properties.maxLength || ''}
                                            onChange={(e) => updateProperties({
                                                maxLength: e.target.value ? parseInt(e.target.value) : undefined
                                            })}
                                            placeholder="No maximum"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Min/Max Values for Number Fields */}
                            {field.type === 'number' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="min-value">Minimum Value</Label>
                                        <Input
                                            id="min-value"
                                            type="number"
                                            value={field.properties.min || ''}
                                            onChange={(e) => updateProperties({
                                                min: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                            placeholder="No minimum"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max-value">Maximum Value</Label>
                                        <Input
                                            id="max-value"
                                            type="number"
                                            value={field.properties.max || ''}
                                            onChange={(e) => updateProperties({
                                                max: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                            placeholder="No maximum"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="step-value">Step</Label>
                                        <Input
                                            id="step-value"
                                            type="number"
                                            value={field.properties.step || ''}
                                            onChange={(e) => updateProperties({
                                                step: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                            placeholder="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* File Upload Settings */}
                            {hasFileSettings && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="file-accept">Accepted File Types</Label>
                                        <Input
                                            id="file-accept"
                                            value={field.properties.accept || ''}
                                            onChange={(e) => updateProperties({ accept: e.target.value })}
                                            placeholder=".pdf,.doc,.docx"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                                        <Input
                                            id="max-file-size"
                                            type="number"
                                            value={field.properties.maxFileSize ? field.properties.maxFileSize / 1024 / 1024 : ''}
                                            onChange={(e) => updateProperties({
                                                maxFileSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined
                                            })}
                                            placeholder="10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max-files">Maximum Files</Label>
                                        <Input
                                            id="max-files"
                                            type="number"
                                            value={field.properties.maxFiles || ''}
                                            onChange={(e) => updateProperties({
                                                maxFiles: e.target.value ? parseInt(e.target.value) : undefined
                                            })}
                                            placeholder="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Date Settings */}
                            {hasDateSettings && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="min-date">Minimum Date</Label>
                                        <Input
                                            id="min-date"
                                            type="date"
                                            value={field.properties.minDate || ''}
                                            onChange={(e) => updateProperties({ minDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max-date">Maximum Date</Label>
                                        <Input
                                            id="max-date"
                                            type="date"
                                            value={field.properties.maxDate || ''}
                                            onChange={(e) => updateProperties({ maxDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Default Value */}
                            <div className="space-y-2">
                                <Label htmlFor="default-value">Default Value</Label>
                                <Input
                                    id="default-value"
                                    value={field.properties.defaultValue || ''}
                                    onChange={(e) => updateProperties({ defaultValue: e.target.value })}
                                    placeholder="Default value"
                                />
                            </div>

                            {/* CSS Classes */}
                            <div className="space-y-2">
                                <Label htmlFor="css-classes">CSS Classes</Label>
                                <Input
                                    id="css-classes"
                                    value={field.properties.cssClasses || ''}
                                    onChange={(e) => updateProperties({ cssClasses: e.target.value })}
                                    placeholder="custom-class another-class"
                                />
                            </div>

                            {/* Validation Rules */}
                            <div className="space-y-4">
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label>Validation Rules</Label>
                                    <Button size="sm" onClick={addValidationRule}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Rule
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {field.validation?.map((rule) => (
                                        <div key={rule.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Select
                                                    value={rule.type}
                                                    onValueChange={(value) => updateValidationRule(rule.id, { type: value as any })}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="required">Required</SelectItem>
                                                        <SelectItem value="min">Min Length</SelectItem>
                                                        <SelectItem value="max">Max Length</SelectItem>
                                                        <SelectItem value="pattern">Pattern</SelectItem>
                                                        <SelectItem value="email">Email</SelectItem>
                                                        <SelectItem value="url">URL</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeValidationRule(rule.id)}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {rule.type !== 'required' && rule.type !== 'email' && rule.type !== 'url' && (
                                                <Input
                                                    value={rule.value || ''}
                                                    onChange={(e) => updateValidationRule(rule.id, { value: e.target.value })}
                                                    placeholder={
                                                        rule.type === 'pattern' ? 'Regular expression' :
                                                            rule.type === 'min' || rule.type === 'max' ? 'Number' :
                                                                'Value'
                                                    }
                                                />
                                            )}

                                            <Input
                                                value={rule.message}
                                                onChange={(e) => updateValidationRule(rule.id, { message: e.target.value })}
                                                placeholder="Error message"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="comments" className="space-y-4 mt-4">
                            {/* Add Comment */}
                            {onAddComment && (
                                <div className="space-y-2">
                                    <Label htmlFor="new-comment">Add Comment</Label>
                                    <Textarea
                                        id="new-comment"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Leave a comment about this field..."
                                        rows={3}
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        size="sm"
                                        className="w-full"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Add Comment
                                    </Button>
                                </div>
                            )}

                            <Separator />

                            {/* Comments List */}
                            <div className="space-y-3">
                                {comments.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">No comments yet</p>
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{comment.author}</span>
                                                <span className="text-xs text-gray-500">
                                                    {comment.createdAt.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>
        </div>
    );
}; 