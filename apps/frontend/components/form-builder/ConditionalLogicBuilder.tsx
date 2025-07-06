'use client';

import React, { useState, useCallback } from 'react';
import { FormField, FormSection, ConditionalLogic, LogicCondition, ConditionalAction } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Material-UI Icons
import {
    Add,
    Delete,
    Rule,
    PlayArrow,
    Stop,
    Visibility,
    VisibilityOff,
    SwapHoriz,
    ArrowForward,
    Settings
} from '@mui/icons-material';

interface ConditionalLogicBuilderProps {
    field?: FormField;
    section?: FormSection;
    allFields: FormField[];
    allSections: FormSection[];
    onFieldUpdate?: (fieldId: string, updates: Partial<FormField>) => void;
    onSectionUpdate?: (sectionId: string, updates: Partial<FormSection>) => void;
}

export const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
    field,
    section,
    allFields,
    allSections,
    onFieldUpdate,
    onSectionUpdate
}) => {
    const [selectedRuleId, setSelectedRuleId] = useState<string>('');

    // Generate unique IDs
    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get available condition operators based on field type
    const getOperatorsForField = (fieldId: string) => {
        const targetField = allFields.find(f => f.id === fieldId);
        if (!targetField) return [];

        const baseOperators = [
            { value: 'equals', label: 'equals' },
            { value: 'notEquals', label: 'does not equal' },
            { value: 'isEmpty', label: 'is empty' },
            { value: 'notEmpty', label: 'is not empty' }
        ];

        if (['text', 'textarea', 'email', 'phone', 'url'].includes(targetField.type)) {
            baseOperators.push(
                { value: 'contains', label: 'contains' },
                { value: 'notContains', label: 'does not contain' }
            );
        }

        if (['number', 'currency', 'rating'].includes(targetField.type)) {
            baseOperators.push(
                { value: 'greaterThan', label: 'is greater than' },
                { value: 'lessThan', label: 'is less than' }
            );
        }

        return baseOperators;
    };

    // Add conditional logic rule to field
    const addFieldRule = useCallback(() => {
        if (!field || !onFieldUpdate) return;

        const newRule: ConditionalLogic = {
            id: `rule_${generateId()}`,
            action: 'show',
            conditions: [],
            operator: 'and'
        };

        const updatedRules = [...(field.conditionalLogic || []), newRule];
        onFieldUpdate(field.id, { conditionalLogic: updatedRules });
        setSelectedRuleId(newRule.id);
    }, [field, onFieldUpdate]);

    // Add conditional logic rule to section
    const addSectionRule = useCallback(() => {
        if (!section || !onSectionUpdate) return;

        const newRule = {
            id: `rule_${generateId()}`,
            action: 'showSection' as const,
            conditions: [],
            operator: 'and' as const,
            priority: 1
        };

        const updatedRules = [...(section.conditionalLogic || []), newRule];
        onSectionUpdate(section.id, { conditionalLogic: updatedRules });
        setSelectedRuleId(newRule.id);
    }, [section, onSectionUpdate]);

    // Update field rule
    const updateFieldRule = useCallback((ruleId: string, updates: Partial<ConditionalLogic>) => {
        if (!field || !onFieldUpdate) return;

        const updatedRules = field.conditionalLogic?.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
        ) || [];

        onFieldUpdate(field.id, { conditionalLogic: updatedRules });
    }, [field, onFieldUpdate]);

    // Update section rule
    const updateSectionRule = useCallback((ruleId: string, updates: any) => {
        if (!section || !onSectionUpdate) return;

        const updatedRules = section.conditionalLogic?.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
        ) || [];

        onSectionUpdate(section.id, { conditionalLogic: updatedRules });
    }, [section, onSectionUpdate]);

    // Delete field rule
    const deleteFieldRule = useCallback((ruleId: string) => {
        if (!field || !onFieldUpdate) return;

        const updatedRules = field.conditionalLogic?.filter(rule => rule.id !== ruleId) || [];
        onFieldUpdate(field.id, { conditionalLogic: updatedRules });

        if (selectedRuleId === ruleId) {
            setSelectedRuleId('');
        }
    }, [field, onFieldUpdate, selectedRuleId]);

    // Delete section rule
    const deleteSectionRule = useCallback((ruleId: string) => {
        if (!section || !onSectionUpdate) return;

        const updatedRules = section.conditionalLogic?.filter(rule => rule.id !== ruleId) || [];
        onSectionUpdate(section.id, { conditionalLogic: updatedRules });

        if (selectedRuleId === ruleId) {
            setSelectedRuleId('');
        }
    }, [section, onSectionUpdate, selectedRuleId]);

    // Add condition to rule
    const addCondition = useCallback((ruleId: string) => {
        const newCondition: LogicCondition = {
            fieldId: '',
            operator: 'equals',
            value: ''
        };

        if (field) {
            updateFieldRule(ruleId, {
                conditions: [...(field.conditionalLogic?.find(r => r.id === ruleId)?.conditions || []), newCondition]
            });
        } else if (section) {
            const rule = section.conditionalLogic?.find(r => r.id === ruleId);
            updateSectionRule(ruleId, {
                conditions: [...(rule?.conditions || []), newCondition]
            });
        }
    }, [field, section, updateFieldRule, updateSectionRule]);

    // Update condition
    const updateCondition = useCallback((ruleId: string, conditionIndex: number, updates: Partial<LogicCondition>) => {
        if (field) {
            const rule = field.conditionalLogic?.find(r => r.id === ruleId);
            if (rule) {
                const updatedConditions = rule.conditions.map((condition, index) =>
                    index === conditionIndex ? { ...condition, ...updates } : condition
                );
                updateFieldRule(ruleId, { conditions: updatedConditions });
            }
        } else if (section) {
            const rule = section.conditionalLogic?.find(r => r.id === ruleId);
            if (rule) {
                const updatedConditions = rule.conditions.map((condition, index) =>
                    index === conditionIndex ? { ...condition, ...updates } : condition
                );
                updateSectionRule(ruleId, { conditions: updatedConditions });
            }
        }
    }, [field, section, updateFieldRule, updateSectionRule]);

    // Delete condition
    const deleteCondition = useCallback((ruleId: string, conditionIndex: number) => {
        if (field) {
            const rule = field.conditionalLogic?.find(r => r.id === ruleId);
            if (rule) {
                const updatedConditions = rule.conditions.filter((_, index) => index !== conditionIndex);
                updateFieldRule(ruleId, { conditions: updatedConditions });
            }
        } else if (section) {
            const rule = section.conditionalLogic?.find(r => r.id === ruleId);
            if (rule) {
                const updatedConditions = rule.conditions.filter((_, index) => index !== conditionIndex);
                updateSectionRule(ruleId, { conditions: updatedConditions });
            }
        }
    }, [field, section, updateFieldRule, updateSectionRule]);

    const currentRules = field?.conditionalLogic || section?.conditionalLogic || [];
    const selectedRule = currentRules.find(rule => rule.id === selectedRuleId);

    return (
        <div className="space-y-4">
            {/* Rules List */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Rule className="h-4 w-4" />
                            Conditional Rules
                        </CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={field ? addFieldRule : addSectionRule}
                            className="h-6 px-2"
                        >
                            <Add className="h-3 w-3 mr-1" />
                            Add Rule
                        </Button>
                    </div>
                    <CardDescription className="text-xs">
                        {field ? `Field: ${field.label}` : `Section: ${section?.title}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {currentRules.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Rule className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">No conditional rules defined</p>
                            <p className="text-xs">Click "Add Rule" to create logic</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {currentRules.map((rule, index) => (
                                <div
                                    key={rule.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedRuleId === rule.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedRuleId(rule.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                Rule {index + 1}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                                {rule.action === 'show' && <Visibility className="h-3 w-3 mr-1 inline" />}
                                                {rule.action === 'hide' && <VisibilityOff className="h-3 w-3 mr-1 inline" />}
                                                {rule.action === 'jumpToSection' && <ArrowForward className="h-3 w-3 mr-1 inline" />}
                                                {rule.action === 'showSection' && <Visibility className="h-3 w-3 mr-1 inline" />}
                                                {rule.action === 'hideSection' && <VisibilityOff className="h-3 w-3 mr-1 inline" />}
                                                {rule.action}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                field ? deleteFieldRule(rule.id) : deleteSectionRule(rule.id);
                                            }}
                                            className="h-5 w-5 p-0 text-red-500"
                                        >
                                            <Delete className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                                        {rule.conditions.length > 1 && ` (${rule.operator})`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rule Editor */}
            {selectedRule && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Rule Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Action Configuration */}
                        <div className="space-y-2">
                            <Label className="text-sm">Action</Label>
                            <Select
                                value={selectedRule.action}
                                onValueChange={(value) => {
                                    if (field) {
                                        updateFieldRule(selectedRule.id, { action: value as any });
                                    } else if (section) {
                                        updateSectionRule(selectedRule.id, { action: value });
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {field ? (
                                        <>
                                            <SelectItem value="show">Show Field</SelectItem>
                                            <SelectItem value="hide">Hide Field</SelectItem>
                                            <SelectItem value="require">Make Required</SelectItem>
                                            <SelectItem value="setValue">Set Value</SelectItem>
                                            <SelectItem value="jumpToSection">Jump to Section</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="showSection">Show Section</SelectItem>
                                            <SelectItem value="hideSection">Hide Section</SelectItem>
                                            <SelectItem value="jumpToSection">Jump to Section</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Target Section for Jump Actions */}
                        {(selectedRule.action === 'jumpToSection') && (
                            <div className="space-y-2">
                                <Label className="text-sm">Target Section</Label>
                                <Select
                                    value={selectedRule.targetSectionId || ''}
                                    onValueChange={(value) => {
                                        if (field) {
                                            updateFieldRule(selectedRule.id, { targetSectionId: value });
                                        } else if (section) {
                                            updateSectionRule(selectedRule.id, { targetSectionId: value });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allSections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id}>
                                                {sec.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Separator />

                        {/* Conditions */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Conditions</Label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addCondition(selectedRule.id)}
                                    className="h-6 px-2"
                                >
                                    <Add className="h-3 w-3 mr-1" />
                                    Add Condition
                                </Button>
                            </div>

                            {selectedRule.conditions.length > 1 && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Condition Operator</Label>
                                    <Select
                                        value={selectedRule.operator}
                                        onValueChange={(value: 'and' | 'or') => {
                                            if (field) {
                                                updateFieldRule(selectedRule.id, { operator: value });
                                            } else if (section) {
                                                updateSectionRule(selectedRule.id, { operator: value });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="and">All conditions must be true (AND)</SelectItem>
                                            <SelectItem value="or">Any condition can be true (OR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedRule.conditions.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p className="text-sm">No conditions defined</p>
                                    <p className="text-xs">Add conditions to control when this rule applies</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedRule.conditions.map((condition, conditionIndex) => (
                                        <div key={conditionIndex} className="p-3 border rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-xs">
                                                    Condition {conditionIndex + 1}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteCondition(selectedRule.id, conditionIndex)}
                                                    className="h-5 w-5 p-0 text-red-500"
                                                >
                                                    <Delete className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {/* Field Selection */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Field</Label>
                                                    <Select
                                                        value={condition.fieldId}
                                                        onValueChange={(value) => updateCondition(selectedRule.id, conditionIndex, { fieldId: value })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="Select field" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {allFields.map((f) => (
                                                                <SelectItem key={f.id} value={f.id}>
                                                                    {f.label} ({f.type})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Operator Selection */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Operator</Label>
                                                    <Select
                                                        value={condition.operator}
                                                        onValueChange={(value) => updateCondition(selectedRule.id, conditionIndex, { operator: value as any })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getOperatorsForField(condition.fieldId).map((op) => (
                                                                <SelectItem key={op.value} value={op.value}>
                                                                    {op.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Value Input */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Value</Label>
                                                    <Input
                                                        value={condition.value}
                                                        onChange={(e) => updateCondition(selectedRule.id, conditionIndex, { value: e.target.value })}
                                                        className="h-8"
                                                        placeholder="Enter value"
                                                        disabled={['isEmpty', 'notEmpty'].includes(condition.operator)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section Jump Logic */}
            {!field && section && (
                <div className="space-y-4 mt-6">
                    <Separator />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Section Navigation Rules</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const newRule = {
                                        id: `nav_rule_${generateId()}`,
                                        action: 'jumpToSection' as const,
                                        conditions: [],
                                        operator: 'and' as const,
                                        targetSectionId: '',
                                        priority: 1
                                    };
                                    const updatedRules = [...(section.conditionalLogic || []), newRule];
                                    onSectionUpdate?.(section.id, { conditionalLogic: updatedRules });
                                }}
                                className="h-6 px-2"
                            >
                                <Add className="h-3 w-3 mr-1" />
                                Add Navigation Rule
                            </Button>
                        </div>

                        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                            <strong>Section Navigation:</strong> Create rules that determine which section to show next based on user responses.
                            For example: "If user selects 'Yes' for employment status, jump to Employee Details section."
                        </div>

                        {section.conditionalLogic && section.conditionalLogic.length > 0 ? (
                            <div className="space-y-3">
                                {section.conditionalLogic
                                    .filter(rule => rule.action === 'jumpToSection')
                                    .map((rule, index) => (
                                        <Card key={rule.id} className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            Navigation Rule {index + 1}
                                                        </Badge>
                                                        <ArrowForward className="h-3 w-3 text-blue-500" />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteSectionRule(rule.id)}
                                                        className="h-5 w-5 p-0 text-red-500"
                                                    >
                                                        <Delete className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                {/* Target Section */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Jump to Section</Label>
                                                    <Select
                                                        value={rule.targetSectionId || ''}
                                                        onValueChange={(value) => {
                                                            updateSectionRule(rule.id, { targetSectionId: value });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="Select target section" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {allSections
                                                                .filter(s => s.id !== section.id)
                                                                .map((sec) => (
                                                                    <SelectItem key={sec.id} value={sec.id}>
                                                                        {sec.title}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Rule Priority */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Priority (higher = evaluated first)</Label>
                                                    <Input
                                                        type="number"
                                                        value={rule.priority || 1}
                                                        onChange={(e) => {
                                                            updateSectionRule(rule.id, { priority: parseInt(e.target.value) || 1 });
                                                        }}
                                                        className="h-8"
                                                        min="1"
                                                        max="100"
                                                    />
                                                </div>

                                                {/* Conditions for this rule */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs">When conditions are met:</Label>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const newCondition: LogicCondition = {
                                                                    fieldId: '',
                                                                    operator: 'equals',
                                                                    value: ''
                                                                };
                                                                const updatedConditions = [...(rule.conditions || []), newCondition];
                                                                updateSectionRule(rule.id, { conditions: updatedConditions });
                                                            }}
                                                            className="h-5 px-2"
                                                        >
                                                            <Add className="h-3 w-3 mr-1" />
                                                            Add Condition
                                                        </Button>
                                                    </div>

                                                    {rule.conditions.length === 0 ? (
                                                        <div className="text-center py-3 text-gray-400 border-2 border-dashed border-gray-200 rounded text-xs">
                                                            No conditions - rule will always apply
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {rule.conditions.length > 1 && (
                                                                <Select
                                                                    value={rule.operator}
                                                                    onValueChange={(value: 'and' | 'or') => {
                                                                        updateSectionRule(rule.id, { operator: value });
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-7">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="and">All conditions (AND)</SelectItem>
                                                                        <SelectItem value="or">Any condition (OR)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}

                                                            {rule.conditions.map((condition, conditionIndex) => (
                                                                <div key={conditionIndex} className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded">
                                                                    {/* Field */}
                                                                    <Select
                                                                        value={condition.fieldId}
                                                                        onValueChange={(value) => {
                                                                            const updatedConditions = rule.conditions.map((c, i) =>
                                                                                i === conditionIndex ? { ...c, fieldId: value } : c
                                                                            );
                                                                            updateSectionRule(rule.id, { conditions: updatedConditions });
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-7">
                                                                            <SelectValue placeholder="Field" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {allFields.map((f) => (
                                                                                <SelectItem key={f.id} value={f.id}>
                                                                                    {f.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {/* Operator */}
                                                                    <Select
                                                                        value={condition.operator}
                                                                        onValueChange={(value) => {
                                                                            const updatedConditions = rule.conditions.map((c, i) =>
                                                                                i === conditionIndex ? { ...c, operator: value as any } : c
                                                                            );
                                                                            updateSectionRule(rule.id, { conditions: updatedConditions });
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-7">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {getOperatorsForField(condition.fieldId).map((op) => (
                                                                                <SelectItem key={op.value} value={op.value}>
                                                                                    {op.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {/* Value */}
                                                                    <Input
                                                                        value={condition.value}
                                                                        onChange={(e) => {
                                                                            const updatedConditions = rule.conditions.map((c, i) =>
                                                                                i === conditionIndex ? { ...c, value: e.target.value } : c
                                                                            );
                                                                            updateSectionRule(rule.id, { conditions: updatedConditions });
                                                                        }}
                                                                        className="h-7"
                                                                        placeholder="Value"
                                                                        disabled={['isEmpty', 'notEmpty'].includes(condition.operator)}
                                                                    />

                                                                    {/* Delete */}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            const updatedConditions = rule.conditions.filter((_, i) => i !== conditionIndex);
                                                                            updateSectionRule(rule.id, { conditions: updatedConditions });
                                                                        }}
                                                                        className="h-7 w-7 p-0 text-red-500"
                                                                    >
                                                                        <Delete className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <ArrowForward className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">No navigation rules defined</p>
                                <p className="text-xs">Add rules to create conditional section flow</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Global Navigation Preview */}
            {!field && allSections.length > 1 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <SwapHoriz className="h-4 w-4" />
                            Navigation Flow Preview
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Overview of how sections connect based on conditional rules
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {allSections.map((sec, index) => (
                                <div key={sec.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-xs">
                                            {index + 1}
                                        </Badge>
                                        <div>
                                            <div className="font-medium text-sm">{sec.title}</div>
                                            <div className="text-xs text-gray-500">
                                                {sec.fields.length} fields
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {sec.conditionalLogic && sec.conditionalLogic.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Rule className="h-3 w-3 mr-1" />
                                                {sec.conditionalLogic.length} rules
                                            </Badge>
                                        )}

                                        {sec.isDefault && (
                                            <Badge variant="default" className="text-xs">
                                                Start
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                            <strong>Navigation Flow:</strong> Users start at the default section and move through sections based on conditional rules.
                            If no rules match, they proceed to the next section in order.
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}; 