'use client';

import React, { useState, useMemo } from 'react';
import { FormSection, FormField } from '@/types/form-builder';
import { FieldComponent } from './fields/FieldComponents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Material-UI Icons
import {
    Smartphone,
    Tablet,
    Computer,
    Visibility,
    VisibilityOff,
    PlayArrow,
    Refresh,
    ChevronLeft,
    ChevronRight,
    Info,
    Fullscreen,
    FullscreenExit
} from '@mui/icons-material';

interface LiveFormPreviewProps {
    sections: FormSection[];
    templateName?: string;
    templateDescription?: string;
    selectedFieldId?: string;
}

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

export const LiveFormPreview: React.FC<LiveFormPreviewProps> = ({
    sections,
    templateName = 'Form Preview',
    templateDescription = 'Live preview of your form',
    selectedFieldId
}) => {
    const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [previewData, setPreviewData] = useState<Record<string, any>>({});
    const [isInteractive, setIsInteractive] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Get visible sections (filter out empty sections)
    const visibleSections = useMemo(() => {
        return sections.filter(section => section.fields && section.fields.length > 0);
    }, [sections]);

    const currentSection = visibleSections[currentSectionIndex];

    // Calculate form completion percentage
    const completionPercentage = useMemo(() => {
        const totalFields = visibleSections.reduce((total, section) => total + section.fields.length, 0);
        const completedFields = Object.keys(previewData).filter(key => {
            const value = previewData[key];
            return value !== null && value !== undefined && value !== '';
        }).length;
        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    }, [visibleSections, previewData]);

    // Handle field value changes in preview
    const handleFieldChange = (fieldId: string, value: any) => {
        if (isInteractive) {
            setPreviewData(prev => ({
                ...prev,
                [fieldId]: value
            }));
        }
    };

    // Reset preview data
    const resetPreview = () => {
        setPreviewData({});
        setCurrentSectionIndex(0);
    };

    // Device mode styles
    const getDeviceStyles = () => {
        switch (deviceMode) {
            case 'mobile':
                return 'max-w-sm mx-auto';
            case 'tablet':
                return 'max-w-2xl mx-auto';
            case 'desktop':
            default:
                return 'max-w-4xl mx-auto';
        }
    };

    // Render field with preview functionality
    const renderPreviewField = (field: FormField) => {
        const isSelected = field.id === selectedFieldId;
        const value = previewData[field.id] || '';

        return (
            <div
                key={field.id}
                className={`space-y-2 p-2 rounded-lg transition-all ${isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'border border-transparent'
                    }`}
            >
                <FieldComponent
                    field={field}
                    value={value}
                    onChange={(newValue) => handleFieldChange(field.id, newValue)}
                    preview={true}
                    disabled={!isInteractive}
                />
                {isSelected && (
                    <div className="text-xs text-blue-600 font-medium">
                        Currently selected field
                    </div>
                )}
            </div>
        );
    };

    if (visibleSections.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Visibility className="h-4 w-4" />
                        Form Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-400">
                        <Info className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Form Content</h3>
                        <p className="text-sm">
                            Add sections and fields to see your form preview
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
                {/* Fullscreen Header */}
                <div className="border-b p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">{templateName}</h2>
                            <p className="text-sm text-gray-600">{templateDescription}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Device Mode Selector */}
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant={deviceMode === 'mobile' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDeviceMode('mobile')}
                                    className="h-8 px-3"
                                >
                                    <Smartphone className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={deviceMode === 'tablet' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDeviceMode('tablet')}
                                    className="h-8 px-3"
                                >
                                    <Tablet className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={deviceMode === 'desktop' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDeviceMode('desktop')}
                                    className="h-8 px-3"
                                >
                                    <Computer className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsInteractive(!isInteractive)}
                                className="h-8 px-3"
                            >
                                {isInteractive ? (
                                    <>
                                        <Visibility className="h-4 w-4 mr-2" />
                                        Interactive
                                    </>
                                ) : (
                                    <>
                                        <VisibilityOff className="h-4 w-4 mr-2" />
                                        View Only
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetPreview}
                                className="h-8 px-3"
                            >
                                <Refresh className="h-4 w-4 mr-2" />
                                Reset
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFullscreen(false)}
                                className="h-8 px-3"
                            >
                                <FullscreenExit className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Fullscreen Content */}
                <div className="flex-1 p-8 overflow-auto bg-gray-50">
                    <div className={`${getDeviceStyles()} transition-all duration-300`}>
                        <Card className="shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{templateName}</CardTitle>
                                        <CardDescription>{templateDescription}</CardDescription>
                                    </div>
                                    {visibleSections.length > 1 && (
                                        <Badge variant="outline">
                                            Section {currentSectionIndex + 1} of {visibleSections.length}
                                        </Badge>
                                    )}
                                </div>

                                {currentSection && (
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-lg">{currentSection.title}</h3>
                                        {currentSection.description && (
                                            <p className="text-sm text-gray-600 mt-1">{currentSection.description}</p>
                                        )}
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent>
                                <ScrollArea className="max-h-[70vh]">
                                    {currentSection ? (
                                        <div className="space-y-6">
                                            {currentSection.fields.map(renderPreviewField)}
                                        </div>
                                    ) : (
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                No fields in this section yet. Add some fields to see the preview.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </ScrollArea>
                            </CardContent>

                            {/* Section Navigation */}
                            {visibleSections.length > 1 && (
                                <>
                                    <Separator />
                                    <div className="p-6 pt-4">
                                        <div className="flex justify-between items-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                                                disabled={currentSectionIndex === 0}
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-2" />
                                                Previous
                                            </Button>

                                            <div className="flex space-x-1">
                                                {visibleSections.map((_, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={index === currentSectionIndex ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setCurrentSectionIndex(index)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {index + 1}
                                                    </Button>
                                                ))}
                                            </div>

                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentSectionIndex(Math.min(visibleSections.length - 1, currentSectionIndex + 1))}
                                                disabled={currentSectionIndex === visibleSections.length - 1}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Preview Controls */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Visibility className="h-4 w-4" />
                            Form Preview
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="h-7 px-2"
                            >
                                {isFullscreen ? (
                                    <FullscreenExit className="h-3 w-3" />
                                ) : (
                                    <Fullscreen className="h-3 w-3" />
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetPreview}
                                className="h-7 px-2"
                            >
                                <Refresh className="h-3 w-3 mr-1" />
                                Reset
                            </Button>
                        </div>
                    </div>
                    <CardDescription className="text-xs">
                        {visibleSections.length} sections • {completionPercentage}% complete
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Device Mode Selector */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-1">
                            <Button
                                variant={deviceMode === 'mobile' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDeviceMode('mobile')}
                                className="h-7 px-2"
                            >
                                <Smartphone className="h-3 w-3" />
                            </Button>
                            <Button
                                variant={deviceMode === 'tablet' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDeviceMode('tablet')}
                                className="h-7 px-2"
                            >
                                <Tablet className="h-3 w-3" />
                            </Button>
                            <Button
                                variant={deviceMode === 'desktop' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDeviceMode('desktop')}
                                className="h-7 px-2"
                            >
                                <Computer className="h-3 w-3" />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsInteractive(!isInteractive)}
                            className="h-7 px-2"
                        >
                            {isInteractive ? (
                                <>
                                    <Visibility className="h-3 w-3 mr-1" />
                                    Interactive
                                </>
                            ) : (
                                <>
                                    <VisibilityOff className="h-3 w-3 mr-1" />
                                    View Only
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Form Progress</span>
                            <span>{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Preview Container */}
            <div className={`${getDeviceStyles()} transition-all duration-300`}>
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">{templateName}</CardTitle>
                                <CardDescription>{templateDescription}</CardDescription>
                            </div>
                            {visibleSections.length > 1 && (
                                <Badge variant="outline">
                                    Section {currentSectionIndex + 1} of {visibleSections.length}
                                </Badge>
                            )}
                        </div>

                        {currentSection && (
                            <div className="mt-4">
                                <h3 className="font-semibold text-base">{currentSection.title}</h3>
                                {currentSection.description && (
                                    <p className="text-sm text-gray-600 mt-1">{currentSection.description}</p>
                                )}
                            </div>
                        )}
                    </CardHeader>

                    <CardContent>
                        <ScrollArea className="max-h-96">
                            {currentSection ? (
                                <div className="space-y-4">
                                    {currentSection.fields.map(renderPreviewField)}
                                </div>
                            ) : (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        No fields in this section yet. Add some fields to see the preview.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </ScrollArea>
                    </CardContent>

                    {/* Section Navigation */}
                    {visibleSections.length > 1 && (
                        <>
                            <Separator />
                            <div className="p-6 pt-4">
                                <div className="flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                                        disabled={currentSectionIndex === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Previous
                                    </Button>

                                    <div className="flex space-x-1">
                                        {visibleSections.map((_, index) => (
                                            <Button
                                                key={index}
                                                variant={index === currentSectionIndex ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentSectionIndex(index)}
                                                className="h-8 w-8 p-0"
                                            >
                                                {index + 1}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentSectionIndex(Math.min(visibleSections.length - 1, currentSectionIndex + 1))}
                                        disabled={currentSectionIndex === visibleSections.length - 1}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* Preview Info */}
            <Card>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Total Sections:</span>
                            <span className="ml-2">{visibleSections.length}</span>
                        </div>
                        <div>
                            <span className="font-medium">Total Fields:</span>
                            <span className="ml-2">
                                {visibleSections.reduce((total, section) => total + section.fields.length, 0)}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Current Section:</span>
                            <span className="ml-2">{currentSection?.title || 'None'}</span>
                        </div>
                        <div>
                            <span className="font-medium">Fields in Section:</span>
                            <span className="ml-2">{currentSection?.fields.length || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}; 