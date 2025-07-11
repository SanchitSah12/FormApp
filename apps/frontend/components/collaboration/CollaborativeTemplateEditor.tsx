'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollaborationPanel } from './CollaborationPanel';
import { SectionBasedFormBuilder } from '@/components/form-builder/SectionBasedFormBuilder';
import { FieldPropertiesPanel } from '@/components/form-builder/FieldPropertiesPanel';
import { ConditionalLogicBuilder } from '@/components/form-builder/ConditionalLogicBuilder';
import { LiveFormPreview } from '@/components/form-builder/LiveFormPreview';
import { useCollaboration } from '@/hooks/useCollaboration';
import { FormSection, FormField } from '@/types/form-builder';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Users, Lock, Unlock, MessageSquare, Eye, History } from 'lucide-react';
import { Settings, Rule, Visibility } from '@mui/icons-material';

interface Template {
    _id: string;
    name: string;
    description: string;
    category: string;
    fields: any[];
    isActive: boolean;
    version: number;
    lastModified: Date;
    lastModifiedBy?: any;
    comments?: any[];
}

interface CollaborativeTemplateEditorProps {
    templateId: string;
    initialTemplate?: Template;
}

export const CollaborativeTemplateEditor = ({
    templateId,
    initialTemplate
}: CollaborativeTemplateEditorProps) => {
    const router = useRouter();
    const [template, setTemplate] = useState<Template | null>(initialTemplate || null);
    const [isLoading, setIsLoading] = useState(!initialTemplate);
    const [isSaving, setIsSaving] = useState(false);
    const [collaborationVisible, setCollaborationVisible] = useState(false);
    const [activeFieldId, setActiveFieldId] = useState<string>('');
    const [sections, setSections] = useState<FormSection[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'properties' | 'conditional' | 'preview'>('properties');
    const [isDirty, setIsDirty] = useState(false);

    const collaboration = useCollaboration(templateId);

    // Fetch template if not provided
    useEffect(() => {
        if (!initialTemplate && templateId) {
            fetchTemplate();
        }
    }, [templateId, initialTemplate]);

    // Join collaboration when template is loaded
    useEffect(() => {
        if (template && collaboration.isConnected) {
            collaboration.joinTemplate(templateId);
        }
    }, [template, collaboration.isConnected, templateId]);

    // Listen for template updates from other users
    useEffect(() => {
        const handleTemplateUpdate = (event: CustomEvent) => {
            const { updates, lastModifiedBy } = event.detail;
            setTemplate(prev => prev ? { ...prev, ...updates } : null);
            toast.info(`Template updated by ${lastModifiedBy.firstName} ${lastModifiedBy.lastName}`);
        };

        const handleVersionConflict = (event: CustomEvent) => {
            toast.error('Version conflict detected. Refreshing template...');
            fetchTemplate();
        };

        window.addEventListener('template-updated', handleTemplateUpdate as EventListener);
        window.addEventListener('version-conflict', handleVersionConflict as EventListener);

        return () => {
            window.removeEventListener('template-updated', handleTemplateUpdate as EventListener);
            window.removeEventListener('version-conflict', handleVersionConflict as EventListener);
        };
    }, []);

    const fetchTemplate = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/templates/${templateId}`);
            const templateData = response.data.template || response.data;
            setTemplate(templateData);

            // Convert template to sections format
            if (templateData.sections && templateData.sections.length > 0) {
                // Use existing sections
                const formattedSections: FormSection[] = templateData.sections.map((section: any, index: number) => ({
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
            } else if (templateData.fields && templateData.fields.length > 0) {
                // Convert legacy fields to sections
                const defaultSection: FormSection = {
                    id: 'default_section',
                    title: 'Form Fields',
                    description: 'Main form section',
                    order: 0,
                    fields: templateData.fields.map((field: any, index: number) => ({
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
            toast.error('Failed to load template');
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldFocus = useCallback((fieldId: string) => {
        // Only lock field if it's not already locked by another user
        const lockStatus = collaboration.isFieldLocked(fieldId);
        if (!lockStatus) {
            setActiveFieldId(fieldId);
            // Add a small delay to prevent immediate locking on quick interactions
            setTimeout(() => {
                collaboration.lockField(fieldId);
            }, 100);
        } else {
            // Show warning that field is locked by another user
            toast.warning(`This field is currently being edited by ${lockStatus.user.firstName} ${lockStatus.user.lastName}`);
        }
    }, [collaboration]);

    const handleFieldBlur = useCallback((fieldId: string) => {
        // Use a timeout to prevent immediate unlocking when switching between elements
        setTimeout(() => {
            if (activeFieldId === fieldId) {
                setActiveFieldId('');
                collaboration.unlockField(fieldId);
            }
        }, 200);
    }, [activeFieldId, collaboration]);

    const handleTemplateChange = useCallback((updates: Partial<Template>) => {
        if (!template) return;

        const updatedTemplate = { ...template, ...updates };
        setTemplate(updatedTemplate);

        // Broadcast changes to other users
        collaboration.updateTemplate(templateId, updates, template.version);
    }, [template, templateId, collaboration]);

    const handleSaveTemplate = async () => {
        if (!template) return;

        try {
            setIsSaving(true);
            const updateData = {
                ...template,
                sections: sections,
                sectionNavigation: {
                    type: 'conditional',
                    allowBackNavigation: true,
                    showProgressBar: true,
                    showSectionList: true,
                    autoAdvance: false
                }
            };
            const response = await api.put(`/templates/${templateId}`, updateData);
            setTemplate(response.data.template || response.data);
            setIsDirty(false);
            toast.success('Template saved successfully');
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    // Form builder handlers
    const handleFieldSelect = useCallback((fieldId: string) => {
        setSelectedFieldId(fieldId);
        if (fieldId) {
            setActiveTab('properties');
        }
    }, []);

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

    const handleSectionsUpdate = useCallback((newSections: FormSection[]) => {
        setSections(newSections);
        setIsDirty(true);
    }, []);

    const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<FormSection>) => {
        setSections(prevSections =>
            prevSections.map(section =>
                section.id === sectionId ? { ...section, ...updates } : section
            )
        );
        setIsDirty(true);
    }, []);

    const handleAddComment = useCallback((fieldId: string, comment: string) => {
        collaboration.addComment(fieldId, comment);
        toast.success('Comment added');
    }, [collaboration]);

    const getFieldLockStatus = (fieldId: string) => {
        return collaboration.isFieldLocked(fieldId);
    };

    const getFieldComments = (fieldId: string) => {
        return collaboration.getFieldComments(fieldId);
    };

    // Get selected field
    const selectedField = sections
        .flatMap(section => section.fields)
        .find(field => field.id === selectedFieldId);

    // Get all fields for conditional logic
    const allFields = sections.flatMap(section => section.fields);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Template not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{template.name}</h1>
                    <p className="text-muted-foreground">
                        Version {template.version} • Last modified {new Date(template.lastModified).toLocaleString()}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collaboration Status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${collaboration.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-muted-foreground">
                            {collaboration.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>

                    {/* Active Users Count */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCollaborationVisible(!collaborationVisible)}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        {collaboration.activeUsers.length}
                    </Button>

                    {/* Save Button */}
                    <Button onClick={handleSaveTemplate} disabled={isSaving || !isDirty}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            {/* Template Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Configure template details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name</Label>
                            <div className="relative">
                                <Input
                                    id="template-name"
                                    value={template.name}
                                    onChange={(e) => handleTemplateChange({ name: e.target.value })}
                                    onFocus={() => handleFieldFocus('name')}
                                    onBlur={() => handleFieldBlur('name')}
                                    disabled={!!getFieldLockStatus('name') && activeFieldId !== 'name'}
                                />
                                {getFieldLockStatus('name') && activeFieldId !== 'name' && (
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                        <Lock className="h-4 w-4 text-yellow-500" />
                                    </div>
                                )}
                                {getFieldComments('name').length > 0 && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                    </div>
                                )}
                            </div>
                            {getFieldLockStatus('name') && activeFieldId !== 'name' && (
                                <p className="text-sm text-yellow-600">
                                    Field locked by {getFieldLockStatus('name')?.user.firstName} {getFieldLockStatus('name')?.user.lastName}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-description">Description</Label>
                            <div className="relative">
                                <Textarea
                                    id="template-description"
                                    value={template.description}
                                    onChange={(e) => handleTemplateChange({ description: e.target.value })}
                                    onFocus={() => handleFieldFocus('description')}
                                    onBlur={() => handleFieldBlur('description')}
                                    disabled={!!getFieldLockStatus('description') && activeFieldId !== 'description'}
                                    rows={3}
                                />
                                {getFieldLockStatus('description') && activeFieldId !== 'description' && (
                                    <div className="absolute right-2 top-2">
                                        <Lock className="h-4 w-4 text-yellow-500" />
                                    </div>
                                )}
                                {getFieldComments('description').length > 0 && (
                                    <div className="absolute right-8 top-2">
                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                    </div>
                                )}
                            </div>
                            {getFieldLockStatus('description') && activeFieldId !== 'description' && (
                                <p className="text-sm text-yellow-600">
                                    Field locked by {getFieldLockStatus('description')?.user.firstName} {getFieldLockStatus('description')?.user.lastName}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-category">Category</Label>
                            <div className="relative">
                                <Select
                                    value={template.category}
                                    onValueChange={(value) => handleTemplateChange({ category: value })}
                                    disabled={!!getFieldLockStatus('category') && activeFieldId !== 'category'}
                                >
                                    <SelectTrigger
                                        onFocus={() => handleFieldFocus('category')}
                                        onBlur={() => handleFieldBlur('category')}
                                    >
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="survey">Survey</SelectItem>
                                        <SelectItem value="feedback">Feedback</SelectItem>
                                        <SelectItem value="registration">Registration</SelectItem>
                                        <SelectItem value="application">Application</SelectItem>
                                        <SelectItem value="assessment">Assessment</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {getFieldLockStatus('category') && activeFieldId !== 'category' && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <Lock className="h-4 w-4 text-yellow-500" />
                                    </div>
                                )}
                                {getFieldComments('category').length > 0 && (
                                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                    </div>
                                )}
                            </div>
                            {getFieldLockStatus('category') && activeFieldId !== 'category' && (
                                <p className="text-sm text-yellow-600">
                                    Field locked by {getFieldLockStatus('category')?.user.firstName} {getFieldLockStatus('category')?.user.lastName}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Template Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Template Status</CardTitle>
                        <CardDescription>Manage template activation and collaboration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Template Status</Label>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                                {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Collaboration Status</Label>
                            <Badge variant={collaboration.isConnected ? "default" : "destructive"}>
                                {collaboration.isConnected ? "Connected" : "Disconnected"}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <Label>Active Collaborators</Label>
                            <div className="space-y-2">
                                {collaboration.activeUsers.map((activeUser) => (
                                    <div key={activeUser.userId} className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{activeUser.user.firstName} {activeUser.user.lastName}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {activeUser.user.role}
                                        </Badge>
                                    </div>
                                ))}
                                {collaboration.activeUsers.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No other users online</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Field Locks</Label>
                            <div className="space-y-2">
                                {collaboration.fieldLocks.map((lock) => (
                                    <div key={lock.fieldId} className="flex items-center gap-2 text-sm">
                                        <Lock className="h-3 w-3 text-yellow-500" />
                                        <span className="font-medium">{lock.fieldId}</span>
                                        <span className="text-muted-foreground">
                                            by {lock.user.firstName} {lock.user.lastName}
                                        </span>
                                    </div>
                                ))}
                                {collaboration.fieldLocks.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No fields currently locked</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Comments</Label>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {collaboration.comments.length} comment{collaboration.comments.length !== 1 ? 's' : ''}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCollaborationVisible(true)}
                                >
                                    View All
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Form Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px] lg:h-[800px]">
                {/* Form Builder */}
                <div className="lg:col-span-3">
                    <SectionBasedFormBuilder
                        sections={sections}
                        onSectionsChange={handleSectionsUpdate}
                        selectedFieldId={selectedFieldId}
                        onFieldSelect={handleFieldSelect}
                    />
                </div>

                {/* Side Panel */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Form Configuration</CardTitle>
                            <CardDescription>Configure fields and logic</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
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
                                        comments={[]}
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
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Collaboration Panel */}
            <CollaborationPanel
                activeUsers={collaboration.activeUsers}
                comments={collaboration.comments}
                fieldLocks={collaboration.fieldLocks}
                isVisible={collaborationVisible}
                onToggleVisibility={() => setCollaborationVisible(!collaborationVisible)}
                onAddComment={collaboration.addComment}
                onResolveComment={collaboration.resolveComment}
            />
        </div>
    );
}; 