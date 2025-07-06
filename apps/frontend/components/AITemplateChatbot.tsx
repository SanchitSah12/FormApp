'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { templateApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bot, Send, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

interface AITemplateChatbotProps {
    onTemplateGenerated?: (templateId: string) => void;
}

export const AITemplateChatbot = ({ onTemplateGenerated }: AITemplateChatbotProps) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState('');
    const router = useRouter();

    const handleGenerateTemplate = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt to generate a form template');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedTemplate(null);
        setGenerationProgress('Sending prompt to AI...');

        try {
            // Add progress updates
            const progressTimer = setInterval(() => {
                setGenerationProgress(prev => {
                    if (prev === 'Sending prompt to AI...') return 'AI is analyzing your request...';
                    if (prev === 'AI is analyzing your request...') return 'Generating form structure...';
                    if (prev === 'Generating form structure...') return 'Creating form fields...';
                    if (prev === 'Creating form fields...') return 'Finalizing template...';
                    return 'Almost done...';
                });
            }, 4000);

            const response = await templateApi.generateAITemplate(prompt.trim());
            clearInterval(progressTimer);

            const template = response.template;
            setGeneratedTemplate(template);
            setGenerationProgress('');
            toast.success('AI template generated successfully!');

            if (onTemplateGenerated) {
                onTemplateGenerated(template._id);
            }
        } catch (error: any) {
            setGenerationProgress('');
            console.error('AI template generation error:', error);

            let errorMessage = 'Failed to generate template';

            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = 'Request timed out. The AI is taking longer than expected. Please try again.';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsGenerating(false);
            setGenerationProgress('');
        }
    };

    const handleEditInBuilder = () => {
        if (generatedTemplate) {
            router.push(`/admin/templates/${generatedTemplate._id}/builder?aiGenerated=true`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleGenerateTemplate();
        }
    };

    const examplePrompts = [
        "Create a customer feedback form for a restaurant",
        "Build an employee onboarding form for construction workers",
        "Design a project evaluation survey",
        "Create a contact form with file upload capabilities",
        "Build a product order form with payment integration"
    ];

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Bot className="h-6 w-6 text-primary" />
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                </div>
                <CardTitle className="text-2xl">AI Form Template Generator</CardTitle>
                <CardDescription>
                    Describe the form you need and our AI will create a complete template for you
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium">
                        Describe your form requirements
                    </label>
                    <Textarea
                        id="prompt"
                        placeholder="Example: Create a customer feedback form with rating fields, comment sections, and contact information..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={4}
                        className="resize-none"
                        disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                        Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to generate
                    </p>
                </div>

                {/* Example Prompts */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Example prompts:</p>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((example, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10 transition-colors"
                                onClick={() => setPrompt(example)}
                            >
                                {example}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerateTemplate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full"
                    size="lg"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {generationProgress || 'Generating Template...'}
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Generate Form Template
                        </>
                    )}
                </Button>

                {/* Progress indicator */}
                {isGenerating && generationProgress && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <div>
                                    <p className="font-medium text-blue-800">AI is working on your template</p>
                                    <p className="text-sm text-blue-600">{generationProgress}</p>
                                    <p className="text-xs text-blue-500 mt-1">This may take 15-30 seconds...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {error && (
                    <Card className="border-destructive bg-destructive/5">
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                <div>
                                    <p className="font-medium text-destructive">Generation Failed</p>
                                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Generated Template Preview */}
                {generatedTemplate && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg text-green-800">
                                        {generatedTemplate.name}
                                    </CardTitle>
                                    <CardDescription className="text-green-600">
                                        {generatedTemplate.description}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {generatedTemplate.category}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4">
                                {/* Template Stats */}
                                <div className="flex gap-4 text-sm text-green-700">
                                    <span>{generatedTemplate.sections?.length || 0} sections</span>
                                    <span>
                                        {generatedTemplate.sections?.reduce((total: number, section: any) =>
                                            total + (section.fields?.length || 0), 0) || 0} fields
                                    </span>
                                </div>

                                {/* Sections Preview */}
                                <div className="space-y-2">
                                    <p className="font-medium text-green-800">Sections:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {generatedTemplate.sections?.map((section: any, index: number) => (
                                            <div key={index} className="bg-white p-3 rounded border">
                                                <p className="font-medium text-sm">{section.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {section.fields?.length || 0} fields
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleEditInBuilder} className="flex-1">
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                        Edit in Form Builder
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/admin/templates/${generatedTemplate._id}`)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                            <p className="font-medium text-blue-800">How it works:</p>
                            <ul className="space-y-1 text-blue-700 list-disc list-inside">
                                <li>Describe the type of form you need in natural language</li>
                                <li>The AI will validate that your request is form-related</li>
                                <li>A complete form template will be generated with appropriate fields</li>
                                <li>You can then edit and customize the template in the form builder</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}; 