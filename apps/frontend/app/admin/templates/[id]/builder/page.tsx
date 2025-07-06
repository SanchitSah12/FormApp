'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormSection, FormField, FormTemplate } from '@/types/form-builder';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SectionBasedFormBuilder } from '@/components/form-builder/SectionBasedFormBuilder';
import { FieldPropertiesPanel } from '@/components/form-builder/FieldPropertiesPanel';
import { ConditionalLogicBuilder } from '@/components/form-builder/ConditionalLogicBuilder';
import { LiveFormPreview } from '@/components/form-builder/LiveFormPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Material-UI Icons
import {
    ArrowBack,
    Save,
    Preview,
    Settings,
    Rule,
    Visibility
} from '@mui/icons-material';

export default function FormBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [sections, setSections] = useState<FormSection[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [activeTab, setActiveTab] = useState<'properties' | 'conditional' | 'preview'>('properties');

    // Load template data
    useEffect(() => {
        const loadTemplate = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/templates/${templateId}`);
                setTemplate(response.data);

                // Convert template to sections format
                if (response.data.sections && response.data.sections.length > 0) {
                    // Use existing sections
                    const formattedSections: FormSection[] = response.data.sections.map((section: any, index: number) => ({
                        id: section.id || `section_${index}`,
                        title: section.title || `Section ${index + 1}`,
                        description: section.description || '',
                        order: section.order || index,
                        fields: section.fields.map((field: any, fieldIndex: number) => ({
                            ...field,
                            id: field._id || field.id || `field_${fieldIndex}`,
                            order: fieldIndex,
                            properties: field.properties || {},
                            validation: field.validation || [],
                            conditionalLogic: field.conditionalLogic || []
                        })),
                        conditionalLogic: section.conditionalLogic || [],
                        collapsible: section.collapsible || false,
                        isDefault: section.isDefault || index === 0
                    }));
                    setSections(formattedSections);
                } else if (response.data.fields && response.data.fields.length > 0) {
                    // Convert legacy fields to sections
                    const defaultSection: FormSection = {
                        id: 'default_section',
                        title: 'Form Fields',
                        description: 'Main form section',
                        order: 0,
                        fields: response.data.fields.map((field: any, index: number) => ({
                            ...field,
                            id: field._id || field.id || `field_${index}`,
                            order: index,
                            properties: field.properties || {},
                            validation: field.validation || [],
                            conditionalLogic: field.conditionalLogic || []
                        })),
                        conditionalLogic: [],
                        isDefault: true
                    };
                    setSections([defaultSection]);
                } else {
                    // Create empty default section
                    const emptySection: FormSection = {
                        id: 'default_section',
                        title: 'Main Section',
                        description: 'Add your form fields here',
                        order: 0,
                        fields: [],
                        conditionalLogic: [],
                        isDefault: true
                    };
                    setSections([emptySection]);
                }
            } catch (error) {
                console.error('Error loading template:', error);
                toast.error('Failed to load template');
            } finally {
                setLoading(false);
            }
        };

        if (templateId) {
            loadTemplate();
        }
    }, [templateId]);

    // Handle field selection
    const handleFieldSelect = useCallback((fieldId: string) => {
        setSelectedFieldId(fieldId);
        if (fieldId) {
            setActiveTab('properties');
        }
    }, []);

    // Handle field updates
    const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<FormField>) => {
        setSections(prevSections =>
            prevSections.map(section => ({
                ...section,
                fields: section.fields.map(field =>
                    field.id === fieldId ? { ...field, ...updates } : field
                )
            }))
        );
        setIsDirty(true);
    }, []);

    // Handle field deletion
    const handleFieldDelete = useCallback((fieldId: string) => {
        setSections(prevSections =>
            prevSections.map(section => ({
                ...section,
                fields: section.fields.filter(field => field.id !== fieldId)
            }))
        );

        // Clear selection if deleted field was selected
        if (selectedFieldId === fieldId) {
            setSelectedFieldId('');
        }

        setIsDirty(true);
        toast.success('Field deleted');
    }, [selectedFieldId]);

    // Handle sections update
    const handleSectionsUpdate = useCallback((newSections: FormSection[]) => {
        setSections(newSections);
        setIsDirty(true);
    }, []);

    // Handle section update
    const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<FormSection>) => {
        setSections(prevSections =>
            prevSections.map(section =>
                section.id === sectionId ? { ...section, ...updates } : section
            )
        );
        setIsDirty(true);
    }, []);

    // Save template
    const handleSave = useCallback(async () => {
        try {
            setSaving(true);

            const updateData = {
                sections: sections,
                sectionNavigation: {
                    type: 'conditional',
                    allowBackNavigation: true,
                    showProgressBar: true,
                    showSectionList: true,
                    autoAdvance: false
                }
            };

            await api.put(`/templates/${templateId}`, updateData);
            setIsDirty(false);
            toast.success('Template saved successfully');
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    }, [templateId, sections]);

    // Handle comment addition
    const handleAddComment = useCallback((fieldId: string, comment: string) => {
        // This would integrate with the collaboration system
        toast.success('Comment added');
    }, []);

    // Get selected field
    const selectedField = sections
        .flatMap(section => section.fields)
        .find(field => field.id === selectedFieldId);

    // Get all fields for conditional logic
    const allFields = sections.flatMap(section => section.fields);

    if (loading) {
        return (
            <ProtectedRoute requireAdmin>
                <div className="container mx-auto py-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading form builder...</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requireAdmin>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navigation />

                {/* Header */}
                <div className="bg-white border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/admin/templates')}
                                className="flex items-center gap-2"
                            >
                                <ArrowBack className="h-4 w-4" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-xl font-semibold">Form Builder</h1>
                                <p className="text-sm text-gray-600">{template?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab('preview')}
                                className="flex items-center gap-2"
                            >
                                <Preview className="h-4 w-4" />
                                Preview
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving || !isDirty}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex">
                    {/* Form Builder */}
                    <div className="flex-1 p-6">
                        <SectionBasedFormBuilder
                            sections={sections}
                            onSectionsChange={handleSectionsUpdate}
                            selectedFieldId={selectedFieldId}
                            onFieldSelect={handleFieldSelect}
                        />
                    </div>

                    {/* Side Panel */}
                    <div className="w-80 border-l bg-white">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                            <TabsList className="grid w-full grid-cols-3 m-4">
                                <TabsTrigger value="properties" className="flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    <span className="hidden sm:inline">Properties</span>
                                </TabsTrigger>
                                <TabsTrigger value="conditional" className="flex items-center gap-1">
                                    <Rule className="h-3 w-3" />
                                    <span className="hidden sm:inline">Logic</span>
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="flex items-center gap-1">
                                    <Visibility className="h-3 w-3" />
                                    <span className="hidden sm:inline">Preview</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="properties" className="p-4 pt-0">
                                <FieldPropertiesPanel
                                    field={selectedField || null}
                                    onFieldUpdate={handleFieldUpdate}
                                    onFieldDelete={handleFieldDelete}
                                    onAddComment={handleAddComment}
                                    comments={[]} // This would come from collaboration system
                                />
                            </TabsContent>

                            <TabsContent value="conditional" className="p-4 pt-0">
                                <ConditionalLogicBuilder
                                    field={selectedField}
                                    allFields={allFields}
                                    allSections={sections}
                                    onFieldUpdate={handleFieldUpdate}
                                    onSectionUpdate={handleSectionUpdate}
                                />
                            </TabsContent>

                            <TabsContent value="preview" className="p-4 pt-0">
                                <LiveFormPreview
                                    sections={sections}
                                    templateName={template?.name || 'Untitled Form'}
                                    templateDescription={template?.description || 'Form preview'}
                                    selectedFieldId={selectedFieldId}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="border-t bg-gray-50 px-6 py-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                            <span>
                                {sections.reduce((total, section) => total + section.fields.length, 0)} fields
                            </span>
                            <span>
                                {sections.length} sections
                            </span>
                            {selectedField && (
                                <span className="text-blue-600">
                                    Selected: {selectedField.label} ({selectedField.type})
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isDirty && (
                                <span className="text-orange-600">Unsaved changes</span>
                            )}
                            <span>Last saved: {template?.updatedAt ? new Date(template.updatedAt).toLocaleTimeString() : 'Never'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
} 