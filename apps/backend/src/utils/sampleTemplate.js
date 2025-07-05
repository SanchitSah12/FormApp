const sampleConstructionPayrollTemplate = {
  name: "Construction Payroll Onboarding",
  description: "Complete onboarding template for construction payroll and time tracking customers",
  category: "construction",
  sections: [
    {
      id: "company-info",
      title: "Company Information",
      description: "Basic company details and contact information",
      order: 1,
      fields: [
        {
          id: "company-name",
          type: "text",
          label: "Company Name",
          placeholder: "Enter your company name",
          required: true,
          order: 1
        },
        {
          id: "company-address",
          type: "textarea",
          label: "Company Address",
          placeholder: "Enter complete company address",
          required: true,
          order: 2
        },
        {
          id: "company-phone",
          type: "phone",
          label: "Company Phone",
          placeholder: "(555) 123-4567",
          required: true,
          order: 3
        },
        {
          id: "company-email",
          type: "email",
          label: "Company Email",
          placeholder: "contact@company.com",
          required: true,
          order: 4
        },
        {
          id: "business-type",
          type: "select",
          label: "Business Type",
          required: true,
          order: 5,
          options: [
            { value: "general-contractor", label: "General Contractor" },
            { value: "subcontractor", label: "Subcontractor" },
            { value: "specialty-contractor", label: "Specialty Contractor" },
            { value: "other", label: "Other" }
          ]
        },
        {
          id: "years-in-business",
          type: "number",
          label: "Years in Business",
          required: true,
          order: 6,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          id: "number-of-employees",
          type: "select",
          label: "Number of Employees",
          required: true,
          order: 7,
          options: [
            { value: "1-10", label: "1-10" },
            { value: "11-50", label: "11-50" },
            { value: "51-100", label: "51-100" },
            { value: "101-500", label: "101-500" },
            { value: "500+", label: "500+" }
          ]
        }
      ]
    },
    {
      id: "payroll-setup",
      title: "Payroll Setup",
      description: "Configure payroll settings and preferences",
      order: 2,
      fields: [
        {
          id: "payroll-frequency",
          type: "select",
          label: "Payroll Frequency",
          required: true,
          order: 1,
          options: [
            { value: "weekly", label: "Weekly" },
            { value: "bi-weekly", label: "Bi-weekly" },
            { value: "semi-monthly", label: "Semi-monthly" },
            { value: "monthly", label: "Monthly" }
          ]
        },
        {
          id: "pay-period-start",
          type: "select",
          label: "Pay Period Start Day",
          required: true,
          order: 2,
          conditionalLogic: {
            dependsOn: "payroll-frequency",
            condition: "not_equals",
            value: "monthly"
          },
          options: [
            { value: "sunday", label: "Sunday" },
            { value: "monday", label: "Monday" },
            { value: "tuesday", label: "Tuesday" },
            { value: "wednesday", label: "Wednesday" },
            { value: "thursday", label: "Thursday" },
            { value: "friday", label: "Friday" },
            { value: "saturday", label: "Saturday" }
          ]
        },
        {
          id: "overtime-calculation",
          type: "select",
          label: "Overtime Calculation Method",
          required: true,
          order: 3,
          options: [
            { value: "daily", label: "Daily (8+ hours)" },
            { value: "weekly", label: "Weekly (40+ hours)" },
            { value: "both", label: "Both Daily and Weekly" }
          ]
        },
        {
          id: "prevailing-wage",
          type: "checkbox",
          label: "Subject to Prevailing Wage Requirements",
          order: 4
        },
        {
          id: "prevailing-wage-details",
          type: "textarea",
          label: "Prevailing Wage Details",
          placeholder: "Describe prevailing wage requirements and applicable projects",
          order: 5,
          conditionalLogic: {
            dependsOn: "prevailing-wage",
            condition: "equals",
            value: true
          }
        },
        {
          id: "union-work",
          type: "checkbox",
          label: "Performs Union Work",
          order: 6
        },
        {
          id: "union-details",
          type: "textarea",
          label: "Union Details",
          placeholder: "List applicable unions and agreements",
          order: 7,
          conditionalLogic: {
            dependsOn: "union-work",
            condition: "equals",
            value: true
          }
        }
      ]
    },
    {
      id: "time-tracking",
      title: "Time Tracking Setup",
      description: "Configure time tracking methods and requirements",
      order: 3,
      fields: [
        {
          id: "time-tracking-method",
          type: "select",
          label: "Primary Time Tracking Method",
          required: true,
          order: 1,
          options: [
            { value: "manual-timesheets", label: "Manual Timesheets" },
            { value: "mobile-app", label: "Mobile App" },
            { value: "biometric-clock", label: "Biometric Time Clock" },
            { value: "badge-system", label: "Badge/Card System" },
            { value: "gps-tracking", label: "GPS Tracking" }
          ]
        },
        {
          id: "job-costing",
          type: "checkbox",
          label: "Requires Job Costing",
          order: 2
        },
        {
          id: "job-costing-levels",
          type: "multiselect",
          label: "Job Costing Levels",
          order: 3,
          conditionalLogic: {
            dependsOn: "job-costing",
            condition: "equals",
            value: true
          },
          options: [
            { value: "project", label: "Project" },
            { value: "phase", label: "Phase" },
            { value: "cost-code", label: "Cost Code" },
            { value: "task", label: "Task" }
          ]
        },
        {
          id: "break-tracking",
          type: "checkbox",
          label: "Track Breaks and Lunch",
          order: 4
        },
        {
          id: "location-tracking",
          type: "checkbox",
          label: "Require Location Tracking",
          order: 5
        },
        {
          id: "photo-verification",
          type: "checkbox",
          label: "Require Photo Verification for Clock In/Out",
          order: 6
        }
      ]
    },
    {
      id: "erp-integration",
      title: "ERP Integration",
      description: "Configure integration with existing ERP systems",
      order: 4,
      fields: [
        {
          id: "has-erp",
          type: "radio",
          label: "Do you currently use an ERP system?",
          required: true,
          order: 1,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "planning", label: "Planning to implement" }
          ]
        },
        {
          id: "erp-system",
          type: "select",
          label: "ERP System",
          order: 2,
          conditionalLogic: {
            dependsOn: "has-erp",
            condition: "equals",
            value: "yes"
          },
          options: [
            { value: "sage-300", label: "Sage 300" },
            { value: "sage-100", label: "Sage 100" },
            { value: "quickbooks", label: "QuickBooks" },
            { value: "foundation", label: "Foundation" },
            { value: "procore", label: "Procore" },
            { value: "buildertrend", label: "Buildertrend" },
            { value: "other", label: "Other" }
          ]
        },
        {
          id: "erp-other",
          type: "text",
          label: "Other ERP System",
          placeholder: "Specify your ERP system",
          order: 3,
          conditionalLogic: {
            dependsOn: "erp-system",
            condition: "equals",
            value: "other"
          }
        },
        {
          id: "integration-requirements",
          type: "multiselect",
          label: "Integration Requirements",
          order: 4,
          conditionalLogic: {
            dependsOn: "has-erp",
            condition: "equals",
            value: "yes"
          },
          options: [
            { value: "employee-sync", label: "Employee Data Sync" },
            { value: "payroll-export", label: "Payroll Data Export" },
            { value: "job-sync", label: "Job/Project Sync" },
            { value: "cost-code-sync", label: "Cost Code Sync" },
            { value: "real-time", label: "Real-time Integration" }
          ]
        },
        {
          id: "integration-files",
          type: "file",
          label: "ERP System Documentation",
          order: 5,
          conditionalLogic: {
            dependsOn: "has-erp",
            condition: "equals",
            value: "yes"
          },
          helpText: "Upload any relevant ERP system documentation or integration guides"
        }
      ]
    },
    {
      id: "compliance",
      title: "Compliance & Reporting",
      description: "Configure compliance requirements and reporting needs",
      order: 5,
      fields: [
        {
          id: "states-of-operation",
          type: "multiselect",
          label: "States of Operation",
          required: true,
          order: 1,
          options: [
            { value: "AL", label: "Alabama" },
            { value: "AK", label: "Alaska" },
            { value: "AZ", label: "Arizona" },
            { value: "AR", label: "Arkansas" },
            { value: "CA", label: "California" },
            { value: "CO", label: "Colorado" },
            { value: "CT", label: "Connecticut" },
            { value: "DE", label: "Delaware" },
            { value: "FL", label: "Florida" },
            { value: "GA", label: "Georgia" },
            // Add more states as needed
          ]
        },
        {
          id: "workers-comp",
          type: "checkbox",
          label: "Workers' Compensation Insurance Required",
          order: 2
        },
        {
          id: "workers-comp-carrier",
          type: "text",
          label: "Workers' Compensation Carrier",
          order: 3,
          conditionalLogic: {
            dependsOn: "workers-comp",
            condition: "equals",
            value: true
          }
        },
        {
          id: "certified-payroll",
          type: "checkbox",
          label: "Certified Payroll Reporting Required",
          order: 4
        },
        {
          id: "aca-reporting",
          type: "checkbox",
          label: "ACA Reporting Required",
          order: 5
        },
        {
          id: "state-reporting",
          type: "multiselect",
          label: "State-Specific Reporting Requirements",
          order: 6,
          options: [
            { value: "new-hire", label: "New Hire Reporting" },
            { value: "wage-hour", label: "Wage & Hour Reporting" },
            { value: "safety", label: "Safety Reporting" },
            { value: "apprenticeship", label: "Apprenticeship Reporting" }
          ]
        }
      ]
    },
    {
      id: "additional-info",
      title: "Additional Information",
      description: "Any additional requirements or special considerations",
      order: 6,
      fields: [
        {
          id: "special-requirements",
          type: "textarea",
          label: "Special Requirements or Considerations",
          placeholder: "Describe any special requirements, custom workflows, or unique business needs",
          order: 1
        },
        {
          id: "go-live-date",
          type: "date",
          label: "Desired Go-Live Date",
          order: 2
        },
        {
          id: "training-needs",
          type: "multiselect",
          label: "Training Needs",
          order: 3,
          options: [
            { value: "admin-training", label: "Administrator Training" },
            { value: "supervisor-training", label: "Supervisor Training" },
            { value: "employee-training", label: "Employee Training" },
            { value: "ongoing-support", label: "Ongoing Support" }
          ]
        },
        {
          id: "additional-documents",
          type: "file",
          label: "Additional Documents",
          order: 4,
          helpText: "Upload any additional documents, contracts, or reference materials"
        }
      ]
    }
  ]
};

module.exports = sampleConstructionPayrollTemplate; 