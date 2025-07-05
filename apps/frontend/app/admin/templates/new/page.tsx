"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "number"
    | "textarea"
    | "select"
    | "multiselect"
    | "checkbox"
    | "radio"
    | "date"
    | "file";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    dependsOn: string;
    value: string;
    action: "show" | "hide";
  };
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState({
    name: "",
    description: "",
    category: "",
    fields: [] as FormField[],
  });

  const fieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "number", label: "Number" },
    { value: "textarea", label: "Textarea" },
    { value: "select", label: "Select Dropdown" },
    { value: "multiselect", label: "Multi-Select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio Button" },
    { value: "date", label: "Date" },
    { value: "file", label: "File Upload" },
  ];

  const categories = ["construction", "payroll", "general"];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "",
      required: false,
    };
    setTemplate((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) =>
        i === index ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeField = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template.name || !template.category || template.fields.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate that all fields have labels
    const invalidFields = template.fields.filter(
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
        sections: [
          {
            id: "main-section",
            title: "Form Fields",
            description: "Main form fields",
            fields: template.fields.map((field) => ({
              ...field,
              options: field.options
                ? field.options.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))
                : undefined,
            })),
            order: 1,
          },
        ],
        isActive: true,
      };

      await api.post("/templates", templateData);
      toast.success("Template created successfully");
      router.push("/dashboard");
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
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">Create New Template</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                  <CardDescription>
                    Basic information about your form template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={template.description}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Brief description of what this form is for..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Fields */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Form Fields</CardTitle>
                      <CardDescription>
                        Define the fields that will appear in your form
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addField} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No fields added yet. Click "Add Field" to get started.
                    </div>
                  ) : (
                    template.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Field {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: any) =>
                                updateField(index, { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                updateField(index, { label: e.target.value })
                              }
                              placeholder="e.g., Full Name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) =>
                                updateField(index, {
                                  placeholder: e.target.value,
                                })
                              }
                              placeholder="e.g., Enter your full name"
                            />
                          </div>
                        </div>

                        {(field.type === "select" ||
                          field.type === "multiselect" ||
                          field.type === "radio") && (
                          <div className="space-y-2">
                            <Label>Options (one per line)</Label>
                            <Textarea
                              value={field.options?.join("\n") || ""}
                              onChange={(e) =>
                                updateField(index, {
                                  options: e.target.value
                                    .split("\n")
                                    .filter((opt) => opt.trim()),
                                })
                              }
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={3}
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) =>
                              updateField(index, { required: e.target.checked })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`required-${field.id}`}>
                            Required field
                          </Label>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Template"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
