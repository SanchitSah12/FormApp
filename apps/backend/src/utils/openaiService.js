const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt to guide the AI in creating form templates
const SYSTEM_PROMPT = `You are an expert form builder assistant. Your job is to create form templates based on user prompts. 

IMPORTANT RULES:
1. Only respond to prompts that are clearly requesting form creation
2. If the prompt is not about creating a form, respond with: {"error": "This prompt is not related to form creation. Please describe what kind of form you want to create."}
3. Always respond with valid JSON in the exact format specified below
4. Create practical, well-structured forms with appropriate field types
5. Use appropriate field validation and properties
6. Organize fields into logical sections

VALID FIELD TYPES: text, textarea, email, phone, number, select, radio, checkbox, checkboxGroup, date, time, file, rating, currency, url, password, divider, heading, paragraph, payment, signature, repeater, address, image

RESPONSE FORMAT (JSON only):
{
  "name": "Form Name",
  "description": "Brief description of the form",
  "category": "construction|payroll|general|Business Setup",
  "sections": [
    {
      "id": "section1",
      "title": "Section Title",
      "description": "Section description",
      "order": 0,
      "fields": [
        {
          "id": "field1",
          "type": "text",
          "label": "Field Label",
          "placeholder": "Placeholder text",
          "description": "Field description",
          "required": true,
          "order": 0,
          "properties": {
            "width": "full|half|third|quarter",
            "options": [{"id": "opt1", "label": "Option 1", "value": "value1"}],
            "min": 0,
            "max": 100,
            "pattern": "regex pattern",
            "multiple": false
          }
        }
      ]
    }
  ],
  "settings": {
    "allowDrafts": true,
    "requireLogin": false,
    "showProgressBar": true,
    "enableCollaboration": false
  }
}`;

// Function to validate if a prompt is form-related
function isFormRelatedPrompt(prompt) {
  const formKeywords = [
    'form', 'template', 'survey', 'questionnaire', 'application', 'registration',
    'onboarding', 'feedback', 'contact', 'order', 'booking', 'reservation',
    'assessment', 'evaluation', 'intake', 'enrollment', 'subscription',
    'fields', 'input', 'collect information', 'data collection'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  const matchedKeywords = formKeywords.filter(keyword => lowerPrompt.includes(keyword));
  
  console.log(`[OpenAI Service] Prompt validation - Found ${matchedKeywords.length} matching keywords: [${matchedKeywords.join(', ')}]`);
  
  return matchedKeywords.length > 0;
}

// Function to generate form template using OpenAI
async function generateFormTemplate(prompt) {
  const startTime = Date.now();
  console.log(`[OpenAI Service] Starting template generation for prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
  
  try {
    // First, validate if the prompt is form-related
    console.log('[OpenAI Service] Validating if prompt is form-related...');
    if (!isFormRelatedPrompt(prompt)) {
      console.log('[OpenAI Service] Prompt validation failed - not form-related');
      return {
        error: "This prompt is not related to form creation. Please describe what kind of form you want to create (e.g., 'Create a customer feedback form' or 'Build an employee onboarding form')."
      };
    }
    console.log('[OpenAI Service] Prompt validation passed - proceeding with generation');

    console.log('[OpenAI Service] Sending request to OpenAI API...');
    const apiStartTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Create a form template for: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const apiEndTime = Date.now();
    console.log(`[OpenAI Service] OpenAI API request completed in ${apiEndTime - apiStartTime}ms`);
    console.log(`[OpenAI Service] API usage - Prompt tokens: ${completion.usage?.prompt_tokens}, Completion tokens: ${completion.usage?.completion_tokens}, Total tokens: ${completion.usage?.total_tokens}`);

    const response = completion.choices[0].message.content.trim();
    console.log(`[OpenAI Service] Received response length: ${response.length} characters`);
    
    // Try to parse the JSON response
    console.log('[OpenAI Service] Parsing JSON response...');
    try {
      const templateData = JSON.parse(response);
      console.log(`[OpenAI Service] Successfully parsed JSON response. Template name: "${templateData.name}", Category: "${templateData.category}"`);
      
      // Validate that it's not an error response
      if (templateData.error) {
        console.log(`[OpenAI Service] OpenAI returned error: ${templateData.error}`);
        return templateData;
      }
      
      // Add default values and ensure proper structure
      const processedTemplate = {
        name: templateData.name || 'AI Generated Form',
        description: templateData.description || 'Form created by AI assistant',
        category: templateData.category || 'general',
        sections: templateData.sections || [],
        isActive: false, // New AI templates start as inactive
        settings: {
          allowDrafts: true,
          requireLogin: false,
          showProgressBar: true,
          enableCollaboration: false,
          ...templateData.settings
        }
      };

      // Ensure each section has required fields
      console.log(`[OpenAI Service] Processing ${processedTemplate.sections.length} sections...`);
      processedTemplate.sections = processedTemplate.sections.map((section, index) => ({
        id: section.id || `section_${index + 1}`,
        title: section.title || `Section ${index + 1}`,
        description: section.description || '',
        order: section.order || index,
        fields: section.fields || []
      }));

      // Ensure each field has required properties
      let totalFields = 0;
      processedTemplate.sections.forEach((section, sectionIndex) => {
        section.fields = section.fields.map((field, fieldIndex) => {
          // Generate unique field ID with timestamp and random component
          const fieldId = field.id || `field_${Date.now()}_${sectionIndex}_${fieldIndex}_${Math.random().toString(36).substr(2, 9)}`;
          
          return {
            id: fieldId,
            type: field.type || 'text',
            label: field.label || 'Untitled Field',
            placeholder: field.placeholder || '',
            description: field.description || '',
            required: Boolean(field.required),
            order: field.order !== undefined ? field.order : fieldIndex,
            properties: field.properties || {},
            // Ensure options are properly formatted if they exist
            options: field.options ? field.options.map((option, optIndex) => ({
              id: option.id || `option_${fieldId}_${optIndex}`,
              label: option.label || option.value || `Option ${optIndex + 1}`,
              value: option.value || option.label || `value_${optIndex}`
            })) : undefined
          };
        });
        totalFields += section.fields.length;
      });

      const endTime = Date.now();
      console.log(`[OpenAI Service] Template generation completed successfully in ${endTime - startTime}ms`);
      console.log(`[OpenAI Service] Generated template with ${processedTemplate.sections.length} sections and ${totalFields} total fields`);

      return { template: processedTemplate };
    } catch (parseError) {
      const endTime = Date.now();
      console.error(`[OpenAI Service] JSON parsing failed after ${endTime - startTime}ms:`, parseError);
      console.error(`[OpenAI Service] Raw OpenAI response that failed to parse:`, response);
      return {
        error: "Failed to generate a valid form template. Please try rephrasing your request."
      };
    }
  } catch (error) {
    const endTime = Date.now();
    console.error(`[OpenAI Service] Template generation failed after ${endTime - startTime}ms:`, error);
    
    if (error.code === 'insufficient_quota') {
      console.error('[OpenAI Service] API quota exceeded');
      return {
        error: "OpenAI API quota exceeded. Please check your API usage."
      };
    } else if (error.code === 'invalid_api_key') {
      console.error('[OpenAI Service] Invalid API key');
      return {
        error: "Invalid OpenAI API key. Please check your configuration."
      };
    } else if (error.code === 'rate_limit_exceeded') {
      console.error('[OpenAI Service] Rate limit exceeded');
      return {
        error: "OpenAI API rate limit exceeded. Please try again in a moment."
      };
    } else {
      console.error('[OpenAI Service] Unexpected error:', error.message);
      return {
        error: "Failed to generate form template. Please try again later."
      };
    }
  }
}

// Function to improve an existing template based on feedback
async function improveTemplate(templateData, feedback) {
  const startTime = Date.now();
  console.log(`[OpenAI Service] Starting template improvement for template: "${templateData.name}"`);
  console.log(`[OpenAI Service] Improvement feedback: "${feedback.substring(0, 100)}${feedback.length > 100 ? '...' : ''}"`);
  
  try {
    console.log('[OpenAI Service] Sending improvement request to OpenAI API...');
    const apiStartTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + "\n\nYou are improving an existing form template based on user feedback. Maintain the same structure but apply the requested improvements."
        },
        {
          role: "user",
          content: `Improve this form template based on the feedback:\n\nTemplate: ${JSON.stringify(templateData)}\n\nFeedback: ${feedback}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const apiEndTime = Date.now();
    console.log(`[OpenAI Service] Template improvement API request completed in ${apiEndTime - apiStartTime}ms`);
    console.log(`[OpenAI Service] API usage - Prompt tokens: ${completion.usage?.prompt_tokens}, Completion tokens: ${completion.usage?.completion_tokens}, Total tokens: ${completion.usage?.total_tokens}`);

    const response = completion.choices[0].message.content.trim();
    console.log(`[OpenAI Service] Received improvement response length: ${response.length} characters`);
    
    console.log('[OpenAI Service] Parsing improved template JSON...');
    const improvedTemplate = JSON.parse(response);
    
    const endTime = Date.now();
    console.log(`[OpenAI Service] Template improvement completed successfully in ${endTime - startTime}ms`);
    
    return { template: improvedTemplate };
  } catch (error) {
    const endTime = Date.now();
    console.error(`[OpenAI Service] Template improvement failed after ${endTime - startTime}ms:`, error);
    
    if (error instanceof SyntaxError) {
      console.error('[OpenAI Service] JSON parsing error during template improvement');
      return {
        error: "Failed to parse improved template. Please try again."
      };
    }
    
    return {
      error: "Failed to improve template. Please try again."
    };
  }
}

module.exports = {
  generateFormTemplate,
  improveTemplate,
  isFormRelatedPrompt
}; 