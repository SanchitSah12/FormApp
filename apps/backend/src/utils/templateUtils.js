// Helper function to preprocess template data
const preprocessTemplateData = (data) => {
  // Deep clone to avoid mutating original data
  const processed = JSON.parse(JSON.stringify(data));
  
  // Helper function to safely parse JSON strings
  const safeJsonParse = (str, fallback = []) => {
    if (typeof str !== 'string') return str;
    
    try {
      // Clean up the string - remove extra spaces around brackets
      const cleanStr = str.trim().replace(/\s*\[\s*/, '[').replace(/\s*\]\s*/, ']');
      return JSON.parse(cleanStr);
    } catch (e) {
      console.warn('Failed to parse JSON string:', str, 'Error:', e.message);
      return fallback;
    }
  };
  
  // Process sections and fields
  if (processed.sections) {
    processed.sections.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          // Fix validation field if it's a string
          if (field.validation && typeof field.validation === 'string') {
            const parsed = safeJsonParse(field.validation, []);
            
            // If parsed result is an array of objects without the expected structure, convert it
            if (Array.isArray(parsed)) {
              field.validation = parsed.map((item, index) => {
                if (typeof item === 'object' && item !== null) {
                  // If it's a validation rule object without required fields, structure it properly
                  if (!item.id || !item.type || !item.message) {
                    return {
                      id: item.id || `validation_${index}`,
                      type: item.type || 'range',
                      value: item,
                      message: item.message || 'Validation failed'
                    };
                  }
                }
                return item;
              });
            } else {
              field.validation = [];
            }
          }
          
          // Ensure validation is always an array
          if (!Array.isArray(field.validation)) {
            field.validation = [];
          }
          
          // Validate each validation rule has required fields
          if (field.validation && Array.isArray(field.validation)) {
            field.validation = field.validation.filter(rule => {
              return rule && typeof rule === 'object' && rule.id && rule.type && rule.message;
            });
          }
          
          // Fix options field if it's a string
          if (field.options && typeof field.options === 'string') {
            field.options = safeJsonParse(field.options, []);
          }
          
          // Ensure options is always an array
          if (field.options && !Array.isArray(field.options)) {
            field.options = [];
          }
          
          // Fix properties.options if it's a string
          if (field.properties && field.properties.options && typeof field.properties.options === 'string') {
            field.properties.options = safeJsonParse(field.properties.options, []);
          }
          
          // Ensure properties.options is always an array
          if (field.properties && field.properties.options && !Array.isArray(field.properties.options)) {
            field.properties.options = [];
          }
          
          // Fix conditionalLogic if it's a string
          if (field.conditionalLogic && typeof field.conditionalLogic === 'string') {
            field.conditionalLogic = safeJsonParse(field.conditionalLogic, []);
          }
          
          // Ensure conditionalLogic is always an array
          if (field.conditionalLogic && !Array.isArray(field.conditionalLogic)) {
            field.conditionalLogic = [];
          }
        });
      }
      
      // Process section-level conditional logic
      if (section.conditionalLogic && typeof section.conditionalLogic === 'string') {
        section.conditionalLogic = safeJsonParse(section.conditionalLogic, []);
      }
      
      if (section.conditionalLogic && !Array.isArray(section.conditionalLogic)) {
        section.conditionalLogic = [];
      }
    });
  }
  
  // Process flat fields structure (legacy support)
  if (processed.fields) {
    processed.fields.forEach(field => {
      if (field.validation && typeof field.validation === 'string') {
        const parsed = safeJsonParse(field.validation, []);
        
        // If parsed result is an array of objects without the expected structure, convert it
        if (Array.isArray(parsed)) {
          field.validation = parsed.map((item, index) => {
            if (typeof item === 'object' && item !== null) {
              // If it's a validation rule object without required fields, structure it properly
              if (!item.id || !item.type || !item.message) {
                return {
                  id: item.id || `validation_${index}`,
                  type: item.type || 'range',
                  value: item,
                  message: item.message || 'Validation failed'
                };
              }
            }
            return item;
          });
        } else {
          field.validation = [];
        }
      }
      
      if (!Array.isArray(field.validation)) {
        field.validation = [];
      }
      
      // Validate each validation rule has required fields
      if (field.validation && Array.isArray(field.validation)) {
        field.validation = field.validation.filter(rule => {
          return rule && typeof rule === 'object' && rule.id && rule.type && rule.message;
        });
      }
      
      if (field.options && typeof field.options === 'string') {
        field.options = safeJsonParse(field.options, []);
      }
      
      if (field.options && !Array.isArray(field.options)) {
        field.options = [];
      }
    });
  }
  
  return processed;
};

module.exports = { preprocessTemplateData }; 