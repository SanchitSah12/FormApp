'use client';

import { useState, useEffect } from 'react';
import { Template, Section, Field, Response } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, Save, Send, Upload, Download, HelpCircle } from 'lucide-react';

interface DynamicFormProps {
    template: Template;
    existingResponse?: Response;
    onSave?: (responses: Record<string, any>) => void;
    onSubmit?: (responses: Record<string, any>) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    template,
    existingResponse,
    onSave,
    onSubmit,
}) => {
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


    useEffect(() => {
        if (existingResponse) {
            setResponses(existingResponse.responses || {});
        }
    }, [existingResponse]);

    const evaluateCondition = (condition: any, value: any, responses: Record<string, any>): boolean => {
        if (!condition) return true;

        const { dependsOn, condition: conditionType, value: conditionValue } = condition;

        if (!dependsOn) return true;

        const dependentValue = responses[dependsOn];

        switch (conditionType) {
            case 'equals':
                return dependentValue === conditionValue;
            case 'not_equals':
                return dependentValue !== conditionValue;
            case 'contains':
                return Array.isArray(dependentValue) && dependentValue.includes(conditionValue);
            case 'not_empty':
                return dependentValue !== null && dependentValue !== undefined && dependentValue !== '';
            case 'empty':
                return dependentValue === null || dependentValue === undefined || dependentValue === '';
            default:
                return true;
        }
    };

    const shouldShowField = (field: Field): boolean => {
        if (!field.conditionalLogic) return true;
        return evaluateCondition(field.conditionalLogic, field.conditionalLogic.value, responses);
    };

    const shouldShowSection = (section: Section): boolean => {
        if (!section.conditionalLogic) return true;
        return evaluateCondition(section.conditionalLogic, section.conditionalLogic.value, responses);
    };

    const handleFieldChange = (fieldId: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const focusNextField = (currentFieldId: string) => {
        // Get current template structure
        const currentHasSection = template.sections && template.sections.length > 0;
        const currentVisibleSections = currentHasSection ? template.sections?.filter(shouldShowSection) || [] : [];
        const currentCurrentSection = currentHasSection ? currentVisibleSections[currentSectionIndex] : null;

        const allFields = currentHasSection
            ? (currentCurrentSection ? currentCurrentSection.fields : [])
            : (template.fields || []);

        const visibleFields = allFields.filter(shouldShowField);
        const currentIndex = visibleFields.findIndex(field => field.id === currentFieldId);

        if (currentIndex >= 0 && currentIndex < visibleFields.length - 1) {
            const nextField = visibleFields[currentIndex + 1];
            // Use setTimeout to ensure the DOM is ready
            setTimeout(() => {
                const nextElement = document.getElementById(nextField.id);
                if (nextElement) {
                    nextElement.focus();
                }
            }, 50);
        }
    };

    const handleFileUpload = async (fieldId: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fieldId', fieldId);

            const response = await api.post('/uploads/single', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            handleFieldChange(fieldId, response.data.file);
            toast.success("Your file has been uploaded successfully.");
        } catch (error) {
            toast.error("Failed to upload file. Please try again.");
        }
    };

    const calculateCompletionPercentage = (): number => {
        let totalFields = 0;

        if (template.sections && template.sections.length > 0) {
            const visibleSections = template.sections.filter(shouldShowSection);
            totalFields = visibleSections.reduce((total, section) => {
                return total + section.fields.filter(shouldShowField).length;
            }, 0);
        } else if (template.fields) {
            totalFields = template.fields.filter(shouldShowField).length;
        }

        const completedFields = Object.keys(responses).filter(key => {
            const value = responses[key];
            return value !== null && value !== undefined && value !== '';
        }).length;

        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const completionPercentage = calculateCompletionPercentage();
            const currentSectionId = template.sections?.[currentSectionIndex]?.id;

            if (existingResponse) {
                await api.put(`/responses/${existingResponse._id}`, {
                    responses,
                    completionPercentage,
                    currentSection: currentSectionId,
                });
            } else {
                await api.post('/responses', {
                    templateId: template._id,
                    responses,
                    completionPercentage,
                    currentSection: currentSectionId,
                });
            }

            onSave?.(responses);
            toast.success("Your progress has been saved successfully.");
        } catch (error) {
            toast.error("Failed to save progress. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const completionPercentage = calculateCompletionPercentage();

            if (existingResponse) {
                await api.put(`/responses/${existingResponse._id}`, {
                    responses,
                    completionPercentage,
                    status: 'submitted',
                });
            } else {
                await api.post('/responses', {
                    templateId: template._id,
                    responses,
                    completionPercentage,
                    status: 'submitted',
                });
            }

            onSubmit?.(responses);
            toast.success("Your form has been submitted successfully.");
        } catch (error) {
            toast.error("Failed to submit form. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderField = (field: Field) => {
        if (!shouldShowField(field)) return null;

        const value = responses[field.id] || '';

        const fieldElement = () => {
            switch (field.type) {
                case 'text':
                case 'email':
                case 'phone':
                    return (
                        <Input
                            id={field.id}
                            type={field.type}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    focusNextField(field.id);
                                }
                            }}
                        />
                    );

                case 'number':
                    return (
                        <Input
                            id={field.id}
                            type="number"
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || '')}
                            placeholder={field.placeholder}
                            required={field.required}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    focusNextField(field.id);
                                }
                            }}
                        />
                    );

                case 'textarea':
                    return (
                        <Textarea
                            id={field.id}
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            onKeyDown={(e) => {
                                // Allow Enter key to work in textarea for new lines
                                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                                    // Allow normal Enter for new line in textarea
                                    e.stopPropagation();
                                } else if (e.key === 'Enter' && e.ctrlKey) {
                                    // Ctrl+Enter moves to next field
                                    e.preventDefault();
                                    focusNextField(field.id);
                                }
                            }}
                            rows={4}
                        />
                    );

                case 'select':
                    return (
                        <Select
                            value={value}
                            onValueChange={(val) => {
                                handleFieldChange(field.id, val);
                                // Move to next field after selection
                                setTimeout(() => focusNextField(field.id), 100);
                            }}
                        >
                            <SelectTrigger
                                id={field.id}
                                onKeyDown={(e) => {
                                    // Handle Enter key to move to next field
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        focusNextField(field.id);
                                    }
                                    // Handle Tab key normally
                                    if (e.key === 'Tab') {
                                        // Let default tab behavior work
                                        return;
                                    }
                                }}
                            >
                                <SelectValue placeholder={field.placeholder || 'Select an option'} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );

                case 'radio':
                    return (
                        <RadioGroup value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
                            {field.options?.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                                    <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    );

                case 'checkbox':
                    return (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={field.id}
                                checked={value === true}
                                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                            />
                            <Label htmlFor={field.id}>{field.label}</Label>
                        </div>
                    );

                case 'file':
                    return (
                        <div className="space-y-2">
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleFileUpload(field.id, file);
                                    }
                                }}
                                accept={field.validation?.pattern}
                            />
                            {value && (
                                <div className="text-sm text-muted-foreground">
                                    Uploaded: {value.originalName || value.name}
                                </div>
                            )}
                        </div>
                    );

                case 'date':
                    return (
                        <Input
                            id={field.id}
                            type="date"
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={field.required}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    focusNextField(field.id);
                                }
                            }}
                        />
                    );

                default:
                    return (
                        <Input
                            type="text"
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                    );
            }
        };

        return (
            <div key={field.id} className="space-y-2">
                {field.type !== 'checkbox' && (
                    <Label htmlFor={field.id} className="flex items-center space-x-2">
                        <span>{field.label}</span>
                        {field.required && <span className="text-red-500">*</span>}
                        {field.helpText && (
                            <div className="group relative">
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-popover p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48">
                                    <p className="text-sm">{field.helpText}</p>
                                </div>
                            </div>
                        )}
                    </Label>
                )}
                {fieldElement()}
                {field.helpFiles && field.helpFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Help files: {field.helpFiles.map((file, index) => (
                            <a key={index} href={file.url} className="text-primary hover:underline mr-2">
                                {file.name}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Handle both section-based and flat field-based templates
    const hasSection = template.sections && template.sections.length > 0;
    const visibleSections = hasSection ? template.sections?.filter(shouldShowSection) || [] : [];
    const currentSection = hasSection ? visibleSections[currentSectionIndex] : null;
    const completionPercentage = calculateCompletionPercentage();

    // For flat field templates, create a virtual section
    const fieldsToRender = hasSection
        ? (currentSection ? currentSection.fields : [])
        : (template.fields || []);

    if (hasSection && !currentSection) {
        return (
            <Alert>
                <AlertDescription>
                    No sections are currently visible based on your responses.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{completionPercentage}% complete</span>
                    </div>
                    <Progress value={completionPercentage} className="w-full" />
                </CardContent>
            </Card>

            {/* Section Navigation */}
            {hasSection && (
                <div className="flex justify-center space-x-2">
                    {visibleSections.map((section, index) => (
                        <Button
                            key={section.id}
                            variant={index === currentSectionIndex ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentSectionIndex(index)}
                            className="min-w-[2rem]"
                        >
                            {index + 1}
                        </Button>
                    ))}
                </div>
            )}

            {/* Current Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{hasSection && currentSection ? currentSection.title : template.name}</span>
                        {hasSection && (
                            <Badge variant="outline">
                                Section {currentSectionIndex + 1} of {visibleSections.length}
                            </Badge>
                        )}
                    </CardTitle>
                    {hasSection && currentSection && currentSection.description && (
                        <CardDescription>{currentSection.description}</CardDescription>
                    )}
                    {!hasSection && template.description && (
                        <CardDescription>{template.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {fieldsToRender.map(renderField)}
                </CardContent>
            </Card>

            {/* Navigation and Actions */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                    disabled={currentSectionIndex === 0}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Progress'}
                    </Button>

                    {currentSectionIndex === visibleSections.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {isLoading ? 'Submitting...' : 'Submit Form'}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentSectionIndex(Math.min(visibleSections.length - 1, currentSectionIndex + 1))}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}; 