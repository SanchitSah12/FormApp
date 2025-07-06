'use client';

import React from 'react';
import { FormField, FieldType } from '@/types/form-builder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

// Material-UI Icons
import {
    TextFields,
    Subject,
    Email,
    Phone,
    Numbers,
    ExpandMore,
    RadioButtonChecked,
    CheckBox,
    CheckBoxOutlineBlank,
    DateRange,
    AccessTime,
    CloudUpload,
    Star,
    Remove,
    Add,
    AttachMoney,
    Link,
    Visibility,
    VisibilityOff,
    HorizontalRule,
    Title,
    Notes,
    CreditCard,
    Repeat,
    LocationOn,
    Image as ImageIcon,
    Assignment
} from '@mui/icons-material';

interface FieldComponentProps {
    field: FormField;
    value?: any;
    onChange?: (value: any) => void;
    preview?: boolean;
    disabled?: boolean;
    error?: string;
}

export const FieldComponent: React.FC<FieldComponentProps> = ({
    field,
    value,
    onChange,
    preview = false,
    disabled = false,
    error
}) => {
    const handleChange = (newValue: any) => {
        if (onChange && !disabled) {
            onChange(newValue);
        }
    };

    const renderField = () => {
        switch (field.type) {
            case 'text':
                return (
                    <Input
                        id={field.id}
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                        minLength={field.properties.minLength}
                        maxLength={field.properties.maxLength}
                        pattern={field.properties.pattern}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        id={field.id}
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                        minLength={field.properties.minLength}
                        maxLength={field.properties.maxLength}
                        rows={4}
                    />
                );

            case 'email':
                return (
                    <Input
                        id={field.id}
                        type="email"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder || 'Enter email address'}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'phone':
                return (
                    <Input
                        id={field.id}
                        type="tel"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder || 'Enter phone number'}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'number':
                return (
                    <Input
                        id={field.id}
                        type="number"
                        value={value || ''}
                        onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
                        placeholder={field.placeholder}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                        min={field.properties.min}
                        max={field.properties.max}
                        step={field.properties.step}
                    />
                );

            case 'select':
                return (
                    <Select value={value} onValueChange={handleChange} disabled={disabled}>
                        <SelectTrigger className={error ? 'border-red-500' : ''}>
                            <SelectValue placeholder={field.placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.properties.options?.map((option) => (
                                <SelectItem key={option.id} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'radio':
                return (
                    <RadioGroup value={value} onValueChange={handleChange} disabled={disabled}>
                        {field.properties.options?.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={option.id} />
                                <Label htmlFor={option.id}>{option.label}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={field.id}
                            checked={Boolean(value)}
                            onCheckedChange={handleChange}
                            disabled={disabled}
                        />
                        <Label htmlFor={field.id}>{field.label}</Label>
                    </div>
                );

            case 'checkboxGroup':
                return (
                    <div className="space-y-2">
                        {field.properties.options?.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={option.id}
                                    checked={Boolean(value?.includes(option.value))}
                                    onCheckedChange={(checked) => {
                                        const currentValue = value || [];
                                        if (checked) {
                                            handleChange([...currentValue, option.value]);
                                        } else {
                                            handleChange(currentValue.filter((v: any) => v !== option.value));
                                        }
                                    }}
                                    disabled={disabled}
                                />
                                <Label htmlFor={option.id}>{option.label}</Label>
                            </div>
                        ))}
                    </div>
                );

            case 'date':
                return (
                    <Input
                        id={field.id}
                        type="date"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                        min={field.properties.minDate}
                        max={field.properties.maxDate}
                    />
                );

            case 'time':
                return (
                    <Input
                        id={field.id}
                        type="time"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'datetime':
                return (
                    <Input
                        id={field.id}
                        type="datetime-local"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'file':
                return (
                    <Input
                        id={field.id}
                        type="file"
                        onChange={(e) => handleChange(e.target.files)}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                        accept={field.properties.accept}
                        multiple={Boolean(field.properties.maxFiles && field.properties.maxFiles > 1)}
                    />
                );

            case 'url':
                return (
                    <Input
                        id={field.id}
                        type="url"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder || 'https://example.com'}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'password':
                return (
                    <Input
                        id={field.id}
                        type="password"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.placeholder || 'Enter password'}
                        disabled={disabled}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'currency':
                return (
                    <div className="relative">
                        <AttachMoney className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            id={field.id}
                            type="number"
                            value={value || ''}
                            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
                            placeholder={field.placeholder || '0.00'}
                            disabled={disabled}
                            className={`pl-10 ${error ? 'border-red-500' : ''}`}
                            min={0}
                            step="0.01"
                        />
                    </div>
                );

            case 'rating':
                return (
                    <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleChange(star)}
                                disabled={disabled}
                                className={`${star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                            >
                                <Star className="h-6 w-6" />
                            </button>
                        ))}
                    </div>
                );

            case 'divider':
                return <Separator className="my-4" />;

            case 'heading':
                const HeadingTag = `h${field.properties.level || 2}` as keyof JSX.IntrinsicElements;
                return (
                    <HeadingTag className={`font-bold ${field.properties.level === 1 ? 'text-3xl' : field.properties.level === 2 ? 'text-2xl' : field.properties.level === 3 ? 'text-xl' : 'text-lg'}`}>
                        {field.properties.content || field.label}
                    </HeadingTag>
                );

            case 'paragraph':
                return (
                    <p className="text-gray-700 leading-relaxed">
                        {field.properties.content || field.description}
                    </p>
                );

            case 'payment':
                return (
                    <Card className="p-4">
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Payment Amount:</span>
                                <span className="text-lg font-bold">
                                    {field.properties.currency || '$'}{field.properties.amount || 0}
                                </span>
                            </div>
                            <Button className="w-full" disabled={disabled}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Now
                            </Button>
                        </CardContent>
                    </Card>
                );

            default:
                return (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                        Unsupported field type: {field.type}
                    </div>
                );
        }
    };

    return (
        <div className={`space-y-2 ${field.properties.width === 'half' ? 'w-1/2' : field.properties.width === 'third' ? 'w-1/3' : field.properties.width === 'quarter' ? 'w-1/4' : 'w-full'}`}>
            {field.type !== 'checkbox' && field.type !== 'divider' && field.type !== 'heading' && field.type !== 'paragraph' && (
                <Label htmlFor={field.id} className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                </Label>
            )}

            {renderField()}

            {field.description && field.type !== 'paragraph' && (
                <p className="text-sm text-gray-500">{field.description}</p>
            )}

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

// Field type definitions for the drag-and-drop palette
export const FIELD_TYPES = [
    // Basic Fields
    {
        id: 'text',
        type: 'text' as FieldType,
        label: 'Text Input',
        icon: TextFields,
        category: 'basic' as const,
        description: 'Single line text input'
    },
    {
        id: 'textarea',
        type: 'textarea' as FieldType,
        label: 'Textarea',
        icon: Subject,
        category: 'basic' as const,
        description: 'Multi-line text input'
    },
    {
        id: 'email',
        type: 'email' as FieldType,
        label: 'Email',
        icon: Email,
        category: 'basic' as const,
        description: 'Email address input'
    },
    {
        id: 'phone',
        type: 'phone' as FieldType,
        label: 'Phone',
        icon: Phone,
        category: 'basic' as const,
        description: 'Phone number input'
    },
    {
        id: 'number',
        type: 'number' as FieldType,
        label: 'Number',
        icon: Numbers,
        category: 'basic' as const,
        description: 'Numeric input'
    },
    {
        id: 'select',
        type: 'select' as FieldType,
        label: 'Select',
        icon: ExpandMore,
        category: 'basic' as const,
        description: 'Dropdown selection'
    },
    {
        id: 'radio',
        type: 'radio' as FieldType,
        label: 'Radio Group',
        icon: RadioButtonChecked,
        category: 'basic' as const,
        description: 'Single choice selection'
    },
    {
        id: 'checkbox',
        type: 'checkbox' as FieldType,
        label: 'Checkbox',
        icon: CheckBoxOutlineBlank,
        category: 'basic' as const,
        description: 'Yes/No checkbox'
    },
    {
        id: 'checkboxGroup',
        type: 'checkboxGroup' as FieldType,
        label: 'Checkbox Group',
        icon: CheckBox,
        category: 'basic' as const,
        description: 'Multiple choice selection'
    },

    // Advanced Fields
    {
        id: 'date',
        type: 'date' as FieldType,
        label: 'Date',
        icon: DateRange,
        category: 'advanced' as const,
        description: 'Date picker'
    },
    {
        id: 'time',
        type: 'time' as FieldType,
        label: 'Time',
        icon: AccessTime,
        category: 'advanced' as const,
        description: 'Time picker'
    },
    {
        id: 'file',
        type: 'file' as FieldType,
        label: 'File Upload',
        icon: CloudUpload,
        category: 'advanced' as const,
        description: 'File upload field'
    },
    {
        id: 'rating',
        type: 'rating' as FieldType,
        label: 'Rating',
        icon: Star,
        category: 'advanced' as const,
        description: 'Star rating field'
    },
    {
        id: 'currency',
        type: 'currency' as FieldType,
        label: 'Currency',
        icon: AttachMoney,
        category: 'advanced' as const,
        description: 'Money amount input'
    },
    {
        id: 'url',
        type: 'url' as FieldType,
        label: 'URL',
        icon: Link,
        category: 'advanced' as const,
        description: 'Website URL input'
    },
    {
        id: 'password',
        type: 'password' as FieldType,
        label: 'Password',
        icon: VisibilityOff,
        category: 'advanced' as const,
        description: 'Password input field'
    },

    // Layout Fields
    {
        id: 'divider',
        type: 'divider' as FieldType,
        label: 'Divider',
        icon: HorizontalRule,
        category: 'layout' as const,
        description: 'Horizontal line separator'
    },
    {
        id: 'heading',
        type: 'heading' as FieldType,
        label: 'Heading',
        icon: Title,
        category: 'layout' as const,
        description: 'Section heading'
    },
    {
        id: 'paragraph',
        type: 'paragraph' as FieldType,
        label: 'Paragraph',
        icon: Notes,
        category: 'layout' as const,
        description: 'Text paragraph'
    },

    // Special Fields
    {
        id: 'payment',
        type: 'payment' as FieldType,
        label: 'Payment',
        icon: CreditCard,
        category: 'special' as const,
        description: 'Payment collection field'
    },
    {
        id: 'signature',
        type: 'signature' as FieldType,
        label: 'Signature',
        icon: Assignment,
        category: 'special' as const,
        description: 'Digital signature field'
    },
    {
        id: 'repeater',
        type: 'repeater' as FieldType,
        label: 'Repeater',
        icon: Repeat,
        category: 'special' as const,
        description: 'Repeatable field group'
    },
    {
        id: 'address',
        type: 'address' as FieldType,
        label: 'Address',
        icon: LocationOn,
        category: 'special' as const,
        description: 'Address input field'
    },
    {
        id: 'image',
        type: 'image' as FieldType,
        label: 'Image',
        icon: ImageIcon,
        category: 'special' as const,
        description: 'Image upload field'
    }
]; 