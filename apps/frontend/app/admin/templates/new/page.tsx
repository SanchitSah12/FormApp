"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FormSection, FormField } from "@/types/form-builder";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SectionBasedFormBuilder } from "@/components/form-builder/SectionBasedFormBuilder";
import { FieldPropertiesPanel } from "@/components/form-builder/FieldPropertiesPanel";
import { ConditionalLogicBuilder } from "@/components/form-builder/ConditionalLogicBuilder";
import { LiveFormPreview } from "@/components/form-builder/LiveFormPreview";

// Material-UI Icons
import {
  ArrowBack,
  Save,
  Settings,
  Rule,
  Visibility
} from '@mui/icons-material';
import Link from "next/link";

export default function NewTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'properties' | 'conditional' | 'preview'>('properties');
  const [template, setTemplate] = useState({
    name: "",
    description: "",
    category: "",
  });

  const [sections, setSections] = useState<FormSection[]>([
    {
      id: 'default_section',
      title: 'Main Section',
      description: 'Add your form fields here',
      order: 0,
      fields: [],
      conditionalLogic: [],
      isDefault: true
    }
  ]);

  const categories = ["construction", "payroll", "general"];

  // Get selected field
  const selectedField = sections
    .flatMap(section => section.fields)
    .find(field => field.id === selectedFieldId);

  // Get all fields for conditional logic
  const allFields = sections.flatMap(section => section.fields);

  // Handle field selection
  const handleFieldSelect = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    if (fieldId) {
      setActiveTab('properties');
    }
  };

  // Handle field updates
  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setSections(prevSections =>
      prevSections.map(section => ({
        ...section,
        fields: section.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        )
      }))
    );
  };

  // Handle field deletion
  const handleFieldDelete = (fieldId: string) => {
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

    toast.success('Field deleted');
  };

  // Handle section update
  const handleSectionUpdate = (sectionId: string, updates: Partial<FormSection>) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    );
  };

  // Handle add comment (placeholder for collaboration)
  const handleAddComment = (fieldId: string, comment: string) => {
    console.log('Add comment:', fieldId, comment);
    // This would integrate with the collaboration system
    toast.success('Comment added');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template.name || !template.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if any section has fields
    const totalFields = sections.reduce((total, section) => total + section.fields.length, 0);
    if (totalFields === 0) {
      toast.error("Please add at least one field to your form");
      return;
    }

    // Validate that all fields have labels
    const invalidFields = sections.flatMap(section => section.fields).filter(
      (field) => !field.label.trim()
    );
    if (invalidFields.length > 0) {
      toast.error("All fields must have labels");
      return;
    }

    setIsLoading(true);

    try {
      const templateData = {
        name: template.name,
        description: template.description,
        category: template.category,
        sections: sections,
        sectionNavigation: {
          type: 'conditional',
          allowBackNavigation: true,
          showProgressBar: true,
          showSectionList: true,
          autoAdvance: false
        },
        isActive: true,
      };

      await api.post("/templates", templateData);
      toast.success("Template created successfully");
      router.push("/admin/templates");
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowBack className="h-4 w-4 mr-2" />
                    Back to Templates
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Create New Template</h1>
                  <p className="text-sm text-gray-600">Design your form with sections and fields</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/templates")}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Creating..." : "Create Template"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Template Info Form */}
        <div className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic information about your form template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Employee Onboarding Form"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={template.category}
                    onValueChange={(value) =>
                      setTemplate((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={template.description}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Form Builder */}
        <div className="flex-1 flex">
          {/* Form Builder */}
          <div className="flex-1 p-6">
            <SectionBasedFormBuilder
              sections={sections}
              onSectionsChange={setSections}
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
                  templateName={template.name || 'Untitled Form'}
                  templateDescription={template.description || 'Form preview'}
                  selectedFieldId={selectedFieldId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
