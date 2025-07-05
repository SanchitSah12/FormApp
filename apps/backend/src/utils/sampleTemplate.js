module.exports = {
  name: "Company Onboarding Form Main",
  description: "Comprehensive company information collection form for new business setup and payroll onboarding",
  category: "Business Setup",
  isActive: true,
  fields: [
    {
      id: "company_name",
      type: "text",
      label: "Company Name",
      placeholder: "Enter your company name",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "company_legal_name",
      type: "text",
      label: "Company Legal Name",
      placeholder: "Enter the official legal name",
      required: true,
      helpText: "The company's official name that appears on legal and tax forms.",
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "company_trade_name",
      type: "text",
      label: "Company Trade Name (DBA)",
      placeholder: "Enter trade name or DBA",
      required: true,
      helpText: "Doing Business As name if different from legal name",
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "business_type",
      type: "select",
      label: "Business Type",
      required: true,
      options: [
        { value: "llc", label: "LLC" },
        { value: "corporation", label: "Corporation" },
        { value: "partnership", label: "Partnership" },
        { value: "sole_proprietorship", label: "Sole Proprietorship" },
        { value: "s_corp", label: "S-Corporation" },
        { value: "c_corp", label: "C-Corporation" },
        { value: "non_profit", label: "Non-Profit" },
        { value: "other", label: "Other" }
      ]
    },
    {
      id: "company_phone",
      type: "text",
      label: "Company Phone Number",
      placeholder: "(555) 123-4567",
      required: true,
      helpText: "Company office number",
      validation: {
        pattern: "^[\\+]?[1-9]?[0-9]{7,15}$"
      }
    },
    {
      id: "company_email",
      type: "email",
      label: "Company Email",
      placeholder: "info@company.com",
      required: true,
      helpText: "If the company has a general email your company uses (ex. info@company.com), please use this. If not, please use an administrator email.",
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    },
    {
      id: "company_specialty",
      type: "text",
      label: "Company Trade/Specialty",
      placeholder: "e.g., Construction, Plumbing, Electrical",
      required: true,
      helpText: "What type of work does your company specialize in?",
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "company_legal_address",
      type: "textarea",
      label: "Company Legal Address",
      placeholder: "123 Main Street, City, State, ZIP Code",
      required: true,
      helpText: "The company's official registered address, used for legal and tax purposes.",
      validation: {
        minLength: 10,
        maxLength: 500
      }
    },
    {
      id: "company_workplaces",
      type: "textarea",
      label: "Company Workplaces",
      placeholder: "5273 Prospect Road #292, San Jose, CA 95129\n456 Business Ave, Another City, CA 94102",
      required: false,
      helpText: "If you have multiple workplaces, please list all addresses where the company is performing business. This will help us set up the correct state tax accounts in Lumber.\n\nThe format should follow: Street #, City, State, Zip Code\nFor example: 5273 Prospect Road #292, San Jose, CA 95129",
      validation: {
        maxLength: 1000
      }
    },
    {
      id: "signatory_name",
      type: "text",
      label: "Company Signatory Name (First and Last)",
      placeholder: "John Smith",
      required: true,
      helpText: "The admin who will sign tax authorization forms.",
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "signatory_email",
      type: "email",
      label: "Company Signatory Email",
      placeholder: "john.smith@company.com",
      required: true,
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    },
    {
      id: "signatory_phone",
      type: "text",
      label: "Company Signatory Phone Number",
      placeholder: "(555) 123-4567",
      required: true,
      validation: {
        pattern: "^[\\+]?[1-9]?[0-9]{7,15}$"
      }
    },
    {
      id: "signatory_address",
      type: "textarea",
      label: "Company Signatory Address",
      placeholder: "5273 Prospect Road #292, San Jose, CA 95129",
      required: true,
      helpText: "The format should follow: Street #, City, State, Zip Code\nFor example: 5273 Prospect Road #292, San Jose, CA 95129",
      validation: {
        minLength: 10,
        maxLength: 500
      }
    },
    {
      id: "admin_name",
      type: "text",
      label: "Admin Name (First and Last)",
      placeholder: "Jane Doe",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "admin_email",
      type: "email",
      label: "Admin Company Email",
      placeholder: "jane.doe@company.com",
      required: true,
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    },
    {
      id: "additional_admin_name_1",
      type: "text",
      label: "Additional Admin Name (First and Last)",
      placeholder: "Mike Johnson",
      required: false,
      helpText: "Optional",
      validation: {
        maxLength: 100
      }
    },
    {
      id: "additional_admin_email_1",
      type: "email",
      label: "Additional Admin Company Email",
      placeholder: "mike.johnson@company.com",
      required: false,
      helpText: "Optional",
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    },
    {
      id: "additional_admin_name_2",
      type: "text",
      label: "Additional Admin Name (First and Last)",
      placeholder: "Sarah Wilson",
      required: false,
      helpText: "Optional",
      validation: {
        maxLength: 100
      }
    },
    {
      id: "additional_admin_email_2",
      type: "email",
      label: "Additional Admin Company Email",
      placeholder: "sarah.wilson@company.com",
      required: false,
      helpText: "Optional",
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    },
    {
      id: "company_timezone",
      type: "select",
      label: "Company Time Zone",
      required: true,
      helpText: "Please select the time zone(s) your main admins are located in",
      options: [
        { value: "pst", label: "Pacific (PST)" },
        { value: "mst", label: "Mountain (MST)" },
        { value: "cst", label: "Central (CST)" },
        { value: "est", label: "Eastern (EST)" },
        { value: "other", label: "Other" }
      ]
    },
    {
      id: "timezone_other",
      type: "text",
      label: "Other Time Zone",
      placeholder: "Please specify",
      required: false,
      helpText: "If you selected 'Other' above, please specify the time zone",
      validation: {
        maxLength: 50
      }
    },
    {
      id: "avg_hourly_employees",
      type: "number",
      label: "Average Number of Hourly Employees",
      placeholder: "25",
      required: true,
      validation: {
        min: 0,
        max: 10000
      }
    },
    {
      id: "avg_salaried_employees",
      type: "number",
      label: "Average Number of Salaried Employees",
      placeholder: "5",
      required: true,
      validation: {
        min: 0,
        max: 10000
      }
    },
    {
      id: "current_time_tracking",
      type: "text",
      label: "Current Time Tracking Solution",
      placeholder: "e.g., Excel, QuickBooks Time, TSheets",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "current_payroll",
      type: "text",
      label: "Current Payroll Solution",
      placeholder: "e.g., ADP, Paychex, QuickBooks Payroll",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "current_accounting_erp",
      type: "text",
      label: "Current Accounting/ERP Solution",
      placeholder: "e.g., QuickBooks, Sage, NetSuite",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "new_erp_solution",
      type: "text",
      label: "New ERP Solution (if applicable)",
      placeholder: "e.g., Sage 300, NetSuite, SAP",
      required: false,
      validation: {
        maxLength: 100
      }
    },
    {
      id: "kickoff_call_notes",
      type: "textarea",
      label: "Is there anything specific you'd like to go over in our Kickoff Call?",
      placeholder: "Please share any specific questions, concerns, or topics you'd like to discuss...",
      required: false,
      helpText: "Optional",
      validation: {
        maxLength: 1000
      }
    }
  ]
}; 