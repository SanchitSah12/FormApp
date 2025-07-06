'use client';

import React, { useState, useCallback } from 'react';
import { FormField, FormSection, FieldType, ConditionalLogic, SectionConditionalLogic } from '@/types/form-builder';
import { FieldComponent, FIELD_TYPES } from './fields/FieldComponents';
import { ConditionalLogicBuilder } from './ConditionalLogicBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// Material-UI Icons
import {
    Add,
    Delete,
    DragIndicator,
    KeyboardArrowUp,
    KeyboardArrowDown,
    ViewList,
    Settings,
    Rule,
    Visibility,
    VisibilityOff,
    PlayArrow,
    Stop,
    Edit,
    Save,
    Cancel
} from '@mui/icons-material';

interface SectionBasedFormBuilderProps {
    sections: FormSection[];
    onSectionsChange: (sections: FormSection[]) => void;
    selectedFieldId?: string;
    onFieldSelect?: (fieldId: string) => void;
}

export const SectionBasedFormBuilder: React.FC<SectionBasedFormBuilderProps> = ({
    sections,
    onSectionsChange,
    selectedFieldId,
    onFieldSelect
}) => {
    const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');
    const [editingSectionId, setEditingSectionId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'builder' | 'conditional'>('builder');

    // Generate unique IDs
    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get current section
    const currentSection = sections.find(s => s.id === selectedSectionId);

    // Create new section
    const createSection = useCallback(() => {
        const newSection: FormSection = {
            id: `section_${generateId()}`,
            title: 'New Section',
            description: '',
            order: sections.length,
            fields: [],
            conditionalLogic: []
        };
        onSectionsChange([...sections, newSection]);
        setSelectedSectionId(newSection.id);
    }, [sections, onSectionsChange]);

    // Update section
    const updateSection = useCallback((sectionId: string, updates: Partial<FormSection>) => {
        const newSections = sections.map(section =>
            section.id === sectionId ? { ...section, ...updates } : section
        );
        onSectionsChange(newSections);
    }, [sections, onSectionsChange]);

    // Delete section
    const deleteSection = useCallback((sectionId: string) => {
        if (sections.length <= 1) return; // Keep at least one section

        const newSections = sections.filter(s => s.id !== sectionId);
        onSectionsChange(newSections);

        if (selectedSectionId === sectionId) {
            setSelectedSectionId(newSections[0]?.id || '');
        }
    }, [sections, onSectionsChange, selectedSectionId]);

    // Move section
    const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (
            (direction === 'up' && sectionIndex <= 0) ||
            (direction === 'down' && sectionIndex >= sections.length - 1)
        ) return;

        const newSections = [...sections];
        const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
        [newSections[sectionIndex], newSections[targetIndex]] = [newSections[targetIndex], newSections[sectionIndex]];

        // Update order
        newSections.forEach((section, index) => {
            section.order = index;
        });

        onSectionsChange(newSections);
    }, [sections, onSectionsChange]);

    // Create field from type
    const createFieldFromType = useCallback((type: FieldType): FormField => {
        const fieldType = FIELD_TYPES.find(ft => ft.type === type);
        return {
            id: `field_${generateId()}`,
            type,
            label: fieldType?.label || 'New Field',
            placeholder: '',
            description: '',
            required: false,
            order: currentSection?.fields.length || 0,
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
    }, [currentSection]);

    // Add field to current section
    const addField = useCallback((type: FieldType) => {
        if (!currentSection) return;

        const newField = createFieldFromType(type);
        const updatedSection = {
            ...currentSection,
            fields: [...currentSection.fields, newField]
        };

        updateSection(currentSection.id, updatedSection);
        onFieldSelect?.(newField.id);
    }, [currentSection, createFieldFromType, updateSection, onFieldSelect]);

    // Update field in current section
    const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
        if (!currentSection) return;

        const updatedFields = currentSection.fields.map(field =>
            field.id === fieldId ? { ...field, ...updates } : field
        );

        updateSection(currentSection.id, { fields: updatedFields });
    }, [currentSection, updateSection]);

    // Delete field from current section
    const deleteField = useCallback((fieldId: string) => {
        if (!currentSection) return;

        const updatedFields = currentSection.fields.filter(field => field.id !== fieldId);
        updateSection(currentSection.id, { fields: updatedFields });

        if (selectedFieldId === fieldId) {
            onFieldSelect?.('');
        }
    }, [currentSection, updateSection, selectedFieldId, onFieldSelect]);

    // Move field within section
    const moveField = useCallback((fieldId: string, direction: 'up' | 'down') => {
        if (!currentSection) return;

        const fieldIndex = currentSection.fields.findIndex(f => f.id === fieldId);
        if (
            (direction === 'up' && fieldIndex <= 0) ||
            (direction === 'down' && fieldIndex >= currentSection.fields.length - 1)
        ) return;

        const newFields = [...currentSection.fields];
        const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
        [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];

        // Update order
        newFields.forEach((field, index) => {
            field.order = index;
        });

        updateSection(currentSection.id, { fields: newFields });
    }, [currentSection, updateSection]);



    // Get all fields from all sections for conditional logic
    const allFields = sections.flatMap(section =>
        section.fields.map(field => ({
            ...field,
            sectionTitle: section.title
        }))
    );

    return (
        <div className="grid grid-cols-4 gap-4 h-[800px]">
            {/* Section Navigation */}
            <Card className="col-span-1">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ViewList className="h-4 w-4" />
                            Sections
                        </CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={createSection}
                            className="h-6 px-2"
                        >
                            <Add className="h-3 w-3" />
                        </Button>
                    </div>
                    <CardDescription className="text-xs">
                        {sections.length} sections
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[650px]">
                        <div className="space-y-2">
                            {sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors group ${selectedSectionId === section.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedSectionId(section.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            {editingSectionId === section.id ? (
                                                <div className="space-y-2">
                                                    <Input
                                                        value={section.title}
                                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                        className="h-6 text-xs"
                                                        onBlur={() => setEditingSectionId('')}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') setEditingSectionId('');
                                                        }}
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="font-medium text-sm">{section.title}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {section.fields.length} fields
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingSectionId(section.id);
                                                }}
                                                className="h-5 w-5 p-0"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveSection(section.id, 'up');
                                                }}
                                                disabled={index === 0}
                                                className="h-5 w-5 p-0"
                                            >
                                                <KeyboardArrowUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveSection(section.id, 'down');
                                                }}
                                                disabled={index === sections.length - 1}
                                                className="h-5 w-5 p-0"
                                            >
                                                <KeyboardArrowDown className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSection(section.id);
                                                }}
                                                disabled={sections.length <= 1}
                                                className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                            >
                                                <Delete className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {section.conditionalLogic && section.conditionalLogic.length > 0 && (
                                        <div className="mt-2">
                                            <Badge variant="secondary" className="text-xs">
                                                <Rule className="h-3 w-3 mr-1" />
                                                {section.conditionalLogic.length} rules
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Content Area */}
            <div className="col-span-3">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'builder' | 'conditional')}>
                    <TabsList>
                        <TabsTrigger value="builder" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Form Builder
                        </TabsTrigger>
                        <TabsTrigger value="conditional" className="flex items-center gap-2">
                            <Rule className="h-4 w-4" />
                            Conditional Logic
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="builder" className="mt-4">
                        <div className="grid grid-cols-3 gap-4 h-[720px]">
                            {/* Field Types */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Add Fields</CardTitle>
                                    <CardDescription className="text-xs">
                                        Drag or click to add fields
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[600px]">
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
                                                    <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                                                        {category}
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {fieldTypes.map((fieldType) => {
                                                            const IconComponent = fieldType.icon;
                                                            return (
                                                                <Button
                                                                    key={fieldType.id}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addField(fieldType.type)}
                                                                    className="w-full justify-start text-xs h-8"
                                                                >
                                                                    <IconComponent className="h-3 w-3 mr-2" />
                                                                    {fieldType.label}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Section Preview */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">
                                        {currentSection?.title || 'No Section Selected'}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {currentSection?.fields.length || 0} fields
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[600px]">
                                        {currentSection?.fields.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <Add className="h-8 w-8 mx-auto mb-2" />
                                                <p className="text-xs">Add fields to this section</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {currentSection?.fields.map((field, index) => (
                                                    <div
                                                        key={field.id}
                                                        className={`group relative p-3 border rounded-lg cursor-pointer transition-all ${selectedFieldId === field.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        onClick={() => onFieldSelect?.(field.id)}
                                                    >
                                                        {/* Field controls */}
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        moveField(field.id, 'up');
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
                                                                        moveField(field.id, 'down');
                                                                    }}
                                                                    disabled={index === (currentSection?.fields.length || 0) - 1}
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

                                                        {/* Field preview */}
                                                        <div className="pr-16">
                                                            <FieldComponent
                                                                field={field}
                                                                preview={true}
                                                                disabled={true}
                                                            />
                                                        </div>

                                                        {/* Conditional logic indicator */}
                                                        {field.conditionalLogic && field.conditionalLogic.length > 0 && (
                                                            <div className="mt-2">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Rule className="h-3 w-3 mr-1" />
                                                                    {field.conditionalLogic.length} rules
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Section Properties */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Section Properties</CardTitle>
                                    <CardDescription className="text-xs">
                                        Configure section settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[600px]">
                                        {currentSection ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="section-title" className="text-sm">Section Title</Label>
                                                    <Input
                                                        id="section-title"
                                                        value={currentSection.title}
                                                        onChange={(e) => updateSection(currentSection.id, { title: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="section-description" className="text-sm">Description</Label>
                                                    <Textarea
                                                        id="section-description"
                                                        value={currentSection.description || ''}
                                                        onChange={(e) => updateSection(currentSection.id, { description: e.target.value })}
                                                        className="h-20 text-sm"
                                                        placeholder="Optional section description..."
                                                    />
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="section-collapsible"
                                                        checked={currentSection.collapsible || false}
                                                        onChange={(e) => updateSection(currentSection.id, { collapsible: e.target.checked })}
                                                        className="h-4 w-4"
                                                        title="Allow users to collapse this section"
                                                    />
                                                    <Label htmlFor="section-collapsible" className="text-sm">Collapsible</Label>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="section-default"
                                                        checked={currentSection.isDefault || false}
                                                        onChange={(e) => updateSection(currentSection.id, { isDefault: e.target.checked })}
                                                        className="h-4 w-4"
                                                        title="Show this section first"
                                                    />
                                                    <Label htmlFor="section-default" className="text-sm">Default Section</Label>
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <Label className="text-sm">Conditional Logic</Label>
                                                    <ConditionalLogicBuilder
                                                        section={currentSection}
                                                        allFields={allFields}
                                                        allSections={sections}
                                                        onSectionUpdate={updateSection}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <div className="text-sm">Select a section to edit properties</div>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="conditional" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Rule className="h-5 w-5" />
                                    Conditional Section Navigation
                                </CardTitle>
                                <CardDescription>
                                    Configure rules that determine which section to show next based on user responses
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="text-sm text-gray-600">
                                        Create rules to show, hide, or jump to sections based on field values.
                                        Rules are evaluated in priority order (higher numbers first).
                                    </div>

                                    {currentSection ? (
                                        <ConditionalLogicBuilder
                                            section={currentSection}
                                            allFields={allFields}
                                            allSections={sections}
                                            onSectionUpdate={updateSection}
                                        />
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <Rule className="h-12 w-12 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium mb-2">Select a Section</h3>
                                            <p className="text-sm">
                                                Choose a section from the left panel to configure its conditional logic.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}; 