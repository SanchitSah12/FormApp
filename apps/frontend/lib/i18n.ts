import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.submit': 'Submit',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.required': 'Required',
      'common.optional': 'Optional',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.finish': 'Finish',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.import': 'Import',
      'common.upload': 'Upload',
      'common.download': 'Download',
      'common.preview': 'Preview',
      'common.settings': 'Settings',
      'common.help': 'Help',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.yes': 'Yes',
      'common.no': 'No',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.templates': 'Templates',
      'nav.responses': 'Responses',
      'nav.analytics': 'Analytics',
      'nav.settings': 'Settings',
      'nav.profile': 'Profile',
      'nav.logout': 'Logout',
      'nav.login': 'Login',
      'nav.register': 'Register',
      
      // Authentication
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.firstName': 'First Name',
      'auth.lastName': 'Last Name',
      'auth.companyName': 'Company Name',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.rememberMe': 'Remember Me',
      'auth.loginSuccess': 'Login successful',
      'auth.loginError': 'Login failed',
      'auth.registerSuccess': 'Registration successful',
      'auth.registerError': 'Registration failed',
      'auth.passwordMismatch': 'Passwords do not match',
      'auth.invalidCredentials': 'Invalid credentials',
      'auth.accountDeactivated': 'Account is deactivated',
      
      // Forms
      'form.title': 'Form Title',
      'form.description': 'Description',
      'form.category': 'Category',
      'form.field': 'Field',
      'form.section': 'Section',
      'form.addField': 'Add Field',
      'form.addSection': 'Add Section',
      'form.fieldType': 'Field Type',
      'form.fieldLabel': 'Field Label',
      'form.fieldPlaceholder': 'Placeholder',
      'form.fieldRequired': 'Required',
      'form.fieldOptions': 'Options',
      'form.fieldValidation': 'Validation',
      'form.fieldHelpText': 'Help Text',
      'form.conditionalLogic': 'Conditional Logic',
      'form.saveProgress': 'Save Progress',
      'form.submitForm': 'Submit Form',
      'form.progressSaved': 'Progress saved successfully',
      'form.submitSuccess': 'Form submitted successfully',
      'form.submitError': 'Form submission failed',
      'form.completionPercentage': 'Completion: {{percentage}}%',
      
      // Field Types
      'fieldType.text': 'Text',
      'fieldType.email': 'Email',
      'fieldType.number': 'Number',
      'fieldType.phone': 'Phone',
      'fieldType.date': 'Date',
      'fieldType.textarea': 'Textarea',
      'fieldType.select': 'Select',
      'fieldType.multiselect': 'Multi-select',
      'fieldType.checkbox': 'Checkbox',
      'fieldType.radio': 'Radio',
      'fieldType.file': 'File Upload',
      'fieldType.signature': 'Signature',
      'fieldType.payment': 'Payment',
      'fieldType.location': 'Location',
      'fieldType.media': 'Media',
      'fieldType.qrScan': 'QR Code Scan',
      'fieldType.drawing': 'Drawing',
      'fieldType.repeatableGroup': 'Repeatable Group',
      
      // Dashboard
      'dashboard.welcome': 'Welcome, {{name}}!',
      'dashboard.totalForms': 'Total Forms',
      'dashboard.totalResponses': 'Total Responses',
      'dashboard.completionRate': 'Completion Rate',
      'dashboard.recentActivity': 'Recent Activity',
      'dashboard.noActivity': 'No recent activity',
      'dashboard.viewAll': 'View All',
      'dashboard.createNew': 'Create New',
      
      // Templates
      'template.create': 'Create Template',
      'template.edit': 'Edit Template',
      'template.duplicate': 'Duplicate Template',
      'template.delete': 'Delete Template',
      'template.publish': 'Publish',
      'template.unpublish': 'Unpublish',
      'template.preview': 'Preview',
      'template.share': 'Share',
      'template.responses': 'Responses',
      'template.analytics': 'Analytics',
      'template.settings': 'Settings',
      'template.created': 'Template created successfully',
      'template.updated': 'Template updated successfully',
      'template.deleted': 'Template deleted successfully',
      'template.published': 'Template published successfully',
      'template.unpublished': 'Template unpublished successfully',
      'template.noTemplates': 'No templates found',
      'template.createFirst': 'Create your first template',
      
      // Responses
      'response.view': 'View Response',
      'response.edit': 'Edit Response',
      'response.delete': 'Delete Response',
      'response.export': 'Export Responses',
      'response.status': 'Status',
      'response.draft': 'Draft',
      'response.submitted': 'Submitted',
      'response.reviewed': 'Reviewed',
      'response.approved': 'Approved',
      'response.rejected': 'Rejected',
      'response.submittedBy': 'Submitted By',
      'response.submittedAt': 'Submitted At',
      'response.reviewedBy': 'Reviewed By',
      'response.reviewedAt': 'Reviewed At',
      'response.noResponses': 'No responses found',
      'response.exportSuccess': 'Responses exported successfully',
      'response.exportError': 'Export failed',
      
      // Analytics
      'analytics.dashboard': 'Analytics Dashboard',
      'analytics.overview': 'Overview',
      'analytics.performance': 'Performance',
      'analytics.trends': 'Trends',
      'analytics.reports': 'Reports',
      'analytics.customReport': 'Custom Report',
      'analytics.scheduleReport': 'Schedule Report',
      'analytics.totalSubmissions': 'Total Submissions',
      'analytics.conversionRate': 'Conversion Rate',
      'analytics.averageCompletion': 'Average Completion',
      'analytics.dropOffRate': 'Drop-off Rate',
      'analytics.topPerformers': 'Top Performers',
      'analytics.timeOfDay': 'Time of Day',
      'analytics.dayOfWeek': 'Day of Week',
      'analytics.deviceType': 'Device Type',
      'analytics.referralSource': 'Referral Source',
      
      // Settings
      'settings.general': 'General',
      'settings.account': 'Account',
      'settings.security': 'Security',
      'settings.notifications': 'Notifications',
      'settings.billing': 'Billing',
      'settings.integrations': 'Integrations',
      'settings.advanced': 'Advanced',
      'settings.language': 'Language',
      'settings.timezone': 'Timezone',
      'settings.dateFormat': 'Date Format',
      'settings.theme': 'Theme',
      'settings.lightMode': 'Light Mode',
      'settings.darkMode': 'Dark Mode',
      'settings.systemMode': 'System Mode',
      'settings.emailNotifications': 'Email Notifications',
      'settings.pushNotifications': 'Push Notifications',
      'settings.smsNotifications': 'SMS Notifications',
      'settings.changePassword': 'Change Password',
      'settings.currentPassword': 'Current Password',
      'settings.newPassword': 'New Password',
      'settings.twoFactorAuth': 'Two-Factor Authentication',
      'settings.apiKeys': 'API Keys',
      'settings.webhooks': 'Webhooks',
      'settings.dataExport': 'Data Export',
      'settings.dataImport': 'Data Import',
      'settings.backup': 'Backup',
      'settings.restore': 'Restore',
      'settings.deleteAccount': 'Delete Account',
      'settings.dangerZone': 'Danger Zone',
      
      // Collaboration
      'collaboration.activeUsers': 'Active Users',
      'collaboration.comments': 'Comments',
      'collaboration.addComment': 'Add Comment',
      'collaboration.resolveComment': 'Resolve Comment',
      'collaboration.replyToComment': 'Reply to Comment',
      'collaboration.fieldLocked': 'Field is locked by {{user}}',
      'collaboration.versionConflict': 'Version conflict detected',
      'collaboration.userJoined': '{{user}} joined',
      'collaboration.userLeft': '{{user}} left',
      'collaboration.liveChanges': 'Live Changes',
      'collaboration.changes': 'Changes',
      'collaboration.approval': 'Approval',
      'collaboration.approvalRequired': 'Approval Required',
      'collaboration.approvalPending': 'Approval Pending',
      'collaboration.approve': 'Approve',
      'collaboration.reject': 'Reject',
      'collaboration.approvalNotes': 'Approval Notes',
      
      // Payments
      'payment.amount': 'Amount',
      'payment.currency': 'Currency',
      'payment.method': 'Payment Method',
      'payment.status': 'Payment Status',
      'payment.pending': 'Pending',
      'payment.processing': 'Processing',
      'payment.succeeded': 'Succeeded',
      'payment.failed': 'Failed',
      'payment.refunded': 'Refunded',
      'payment.cardNumber': 'Card Number',
      'payment.expiryDate': 'Expiry Date',
      'payment.cvv': 'CVV',
      'payment.billingAddress': 'Billing Address',
      'payment.payNow': 'Pay Now',
      'payment.payWithCard': 'Pay with Card',
      'payment.payWithPayPal': 'Pay with PayPal',
      'payment.paymentRequired': 'Payment Required',
      'payment.paymentSuccess': 'Payment successful',
      'payment.paymentError': 'Payment failed',
      'payment.receipt': 'Receipt',
      'payment.downloadReceipt': 'Download Receipt',
      'payment.refund': 'Refund',
      'payment.refundSuccess': 'Refund successful',
      'payment.refundError': 'Refund failed',
      
      // Offline
      'offline.title': 'Offline Mode',
      'offline.description': 'You are currently offline. Your changes will be saved locally and synced when you reconnect.',
      'offline.syncPending': 'Sync pending',
      'offline.syncInProgress': 'Syncing...',
      'offline.syncComplete': 'Sync complete',
      'offline.syncError': 'Sync error',
      'offline.lastSync': 'Last sync: {{time}}',
      'offline.enableOffline': 'Enable Offline Mode',
      'offline.disableOffline': 'Disable Offline Mode',
      'offline.downloadForOffline': 'Download for Offline Use',
      'offline.offlineFormsAvailable': '{{count}} forms available offline',
      'offline.noOfflineForms': 'No forms available offline',
      'offline.storageUsage': 'Storage Usage',
      'offline.clearOfflineData': 'Clear Offline Data',
      'offline.offlineDataCleared': 'Offline data cleared successfully',
      
      // Media
      'media.upload': 'Upload Media',
      'media.camera': 'Camera',
      'media.gallery': 'Gallery',
      'media.record': 'Record',
      'media.photo': 'Photo',
      'media.video': 'Video',
      'media.audio': 'Audio',
      'media.document': 'Document',
      'media.takePhoto': 'Take Photo',
      'media.recordVideo': 'Record Video',
      'media.recordAudio': 'Record Audio',
      'media.selectFile': 'Select File',
      'media.dragAndDrop': 'Drag and drop files here',
      'media.fileSize': 'File size: {{size}}',
      'media.fileType': 'File type: {{type}}',
      'media.uploadProgress': 'Upload progress: {{progress}}%',
      'media.uploadComplete': 'Upload complete',
      'media.uploadError': 'Upload failed',
      'media.previewNotAvailable': 'Preview not available',
      'media.downloadFile': 'Download File',
      'media.deleteFile': 'Delete File',
      
      // QR Code
      'qr.scan': 'Scan QR Code',
      'qr.scanning': 'Scanning...',
      'qr.scanSuccess': 'QR Code scanned successfully',
      'qr.scanError': 'QR Code scan failed',
      'qr.cameraPermission': 'Camera permission required',
      'qr.cameraNotAvailable': 'Camera not available',
      'qr.invalidQR': 'Invalid QR code',
      'qr.result': 'Scan result: {{result}}',
      
      // GPS
      'gps.location': 'Location',
      'gps.latitude': 'Latitude',
      'gps.longitude': 'Longitude',
      'gps.accuracy': 'Accuracy',
      'gps.getCurrentLocation': 'Get Current Location',
      'gps.locationCaptured': 'Location captured successfully',
      'gps.locationError': 'Location capture failed',
      'gps.permissionDenied': 'Location permission denied',
      'gps.serviceUnavailable': 'Location service unavailable',
      'gps.timeout': 'Location request timeout',
      'gps.unknownError': 'Unknown location error',
      
      // Signature
      'signature.sign': 'Sign Here',
      'signature.clear': 'Clear',
      'signature.signatureRequired': 'Signature required',
      'signature.signatureCaptured': 'Signature captured',
      'signature.signatureCleared': 'Signature cleared',
      'signature.pleaseSign': 'Please sign in the area below',
      'signature.useFingerOrStylus': 'Use your finger or stylus to sign',
      
      // Accessibility
      'accessibility.skipToContent': 'Skip to content',
      'accessibility.mainNavigation': 'Main navigation',
      'accessibility.pageContent': 'Page content',
      'accessibility.complementaryContent': 'Complementary content',
      'accessibility.closeDialog': 'Close dialog',
      'accessibility.openMenu': 'Open menu',
      'accessibility.closeMenu': 'Close menu',
      'accessibility.searchField': 'Search field',
      'accessibility.sortBy': 'Sort by',
      'accessibility.filterBy': 'Filter by',
      'accessibility.pageOf': 'Page {{current}} of {{total}}',
      'accessibility.selectedItems': '{{count}} items selected',
      'accessibility.expandSection': 'Expand section',
      'accessibility.collapseSection': 'Collapse section',
      'accessibility.required': 'Required field',
      'accessibility.optional': 'Optional field',
      'accessibility.errorMessage': 'Error message',
      'accessibility.helpText': 'Help text',
      'accessibility.loading': 'Loading content',
      'accessibility.menuToggle': 'Toggle menu',
      'accessibility.themeToggle': 'Toggle theme',
      'accessibility.languageSelection': 'Language selection',
      
      // Errors
      'error.generic': 'An error occurred',
      'error.network': 'Network error',
      'error.unauthorized': 'Unauthorized',
      'error.forbidden': 'Forbidden',
      'error.notFound': 'Not found',
      'error.serverError': 'Server error',
      'error.validationError': 'Validation error',
      'error.timeout': 'Request timeout',
      'error.offline': 'You are offline',
      'error.retry': 'Retry',
      'error.reportIssue': 'Report Issue',
      'error.goHome': 'Go Home',
      'error.goBack': 'Go Back',
      'error.refreshPage': 'Refresh Page',
      
      // Success Messages
      'success.saved': 'Saved successfully',
      'success.updated': 'Updated successfully',
      'success.deleted': 'Deleted successfully',
      'success.created': 'Created successfully',
      'success.sent': 'Sent successfully',
      'success.uploaded': 'Uploaded successfully',
      'success.downloaded': 'Downloaded successfully',
      'success.exported': 'Exported successfully',
      'success.imported': 'Imported successfully',
      'success.synced': 'Synced successfully',
      'success.approved': 'Approved successfully',
      'success.rejected': 'Rejected successfully',
      'success.published': 'Published successfully',
      'success.unpublished': 'Unpublished successfully',
      
      // Validation
      'validation.required': 'This field is required',
      'validation.email': 'Please enter a valid email address',
      'validation.url': 'Please enter a valid URL',
      'validation.number': 'Please enter a valid number',
      'validation.integer': 'Please enter a valid integer',
      'validation.decimal': 'Please enter a valid decimal number',
      'validation.phone': 'Please enter a valid phone number',
      'validation.date': 'Please enter a valid date',
      'validation.time': 'Please enter a valid time',
      'validation.minLength': 'Minimum length is {{min}} characters',
      'validation.maxLength': 'Maximum length is {{max}} characters',
      'validation.minValue': 'Minimum value is {{min}}',
      'validation.maxValue': 'Maximum value is {{max}}',
      'validation.pattern': 'Please match the requested format',
      'validation.fileSize': 'File size must be less than {{size}}',
      'validation.fileType': 'Please select a valid file type',
      'validation.passwordStrength': 'Password must be at least 8 characters with uppercase, lowercase, and number',
      'validation.passwordMatch': 'Passwords must match',
      'validation.unique': 'This value must be unique',
      'validation.exists': 'This value does not exist',
      'validation.future': 'Date must be in the future',
      'validation.past': 'Date must be in the past',
    }
  },
  es: {
    translation: {
      // Common
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.submit': 'Enviar',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'common.required': 'Requerido',
      'common.optional': 'Opcional',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.finish': 'Finalizar',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.export': 'Exportar',
      'common.import': 'Importar',
      'common.upload': 'Subir',
      'common.download': 'Descargar',
      'common.preview': 'Vista previa',
      'common.settings': 'Configuración',
      'common.help': 'Ayuda',
      'common.close': 'Cerrar',
      'common.confirm': 'Confirmar',
      'common.yes': 'Sí',
      'common.no': 'No',
      
      // Navigation
      'nav.dashboard': 'Panel de Control',
      'nav.templates': 'Plantillas',
      'nav.responses': 'Respuestas',
      'nav.analytics': 'Analíticas',
      'nav.settings': 'Configuración',
      'nav.profile': 'Perfil',
      'nav.logout': 'Cerrar Sesión',
      'nav.login': 'Iniciar Sesión',
      'nav.register': 'Registrarse',
      
      // Authentication
      'auth.login': 'Iniciar Sesión',
      'auth.register': 'Registrarse',
      'auth.email': 'Correo Electrónico',
      'auth.password': 'Contraseña',
      'auth.confirmPassword': 'Confirmar Contraseña',
      'auth.firstName': 'Nombre',
      'auth.lastName': 'Apellido',
      'auth.companyName': 'Nombre de la Empresa',
      'auth.forgotPassword': '¿Olvidaste tu contraseña?',
      'auth.rememberMe': 'Recordarme',
      'auth.loginSuccess': 'Inicio de sesión exitoso',
      'auth.loginError': 'Error al iniciar sesión',
      'auth.registerSuccess': 'Registro exitoso',
      'auth.registerError': 'Error en el registro',
      'auth.passwordMismatch': 'Las contraseñas no coinciden',
      'auth.invalidCredentials': 'Credenciales inválidas',
      'auth.accountDeactivated': 'Cuenta desactivada',
      
      // Forms
      'form.title': 'Título del Formulario',
      'form.description': 'Descripción',
      'form.category': 'Categoría',
      'form.field': 'Campo',
      'form.section': 'Sección',
      'form.addField': 'Agregar Campo',
      'form.addSection': 'Agregar Sección',
      'form.fieldType': 'Tipo de Campo',
      'form.fieldLabel': 'Etiqueta del Campo',
      'form.fieldPlaceholder': 'Marcador de Posición',
      'form.fieldRequired': 'Requerido',
      'form.fieldOptions': 'Opciones',
      'form.fieldValidation': 'Validación',
      'form.fieldHelpText': 'Texto de Ayuda',
      'form.conditionalLogic': 'Lógica Condicional',
      'form.saveProgress': 'Guardar Progreso',
      'form.submitForm': 'Enviar Formulario',
      'form.progressSaved': 'Progreso guardado exitosamente',
      'form.submitSuccess': 'Formulario enviado exitosamente',
      'form.submitError': 'Error al enviar formulario',
      'form.completionPercentage': 'Completado: {{percentage}}%',
      
      // Add more Spanish translations as needed...
    }
  },
  fr: {
    translation: {
      // Common
      'common.save': 'Sauvegarder',
      'common.cancel': 'Annuler',
      'common.submit': 'Soumettre',
      'common.edit': 'Modifier',
      'common.delete': 'Supprimer',
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      'common.required': 'Requis',
      'common.optional': 'Optionnel',
      'common.back': 'Retour',
      'common.next': 'Suivant',
      'common.previous': 'Précédent',
      'common.finish': 'Terminer',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.export': 'Exporter',
      'common.import': 'Importer',
      'common.upload': 'Télécharger',
      'common.download': 'Télécharger',
      'common.preview': 'Aperçu',
      'common.settings': 'Paramètres',
      'common.help': 'Aide',
      'common.close': 'Fermer',
      'common.confirm': 'Confirmer',
      'common.yes': 'Oui',
      'common.no': 'Non',
      
      // Navigation
      'nav.dashboard': 'Tableau de Bord',
      'nav.templates': 'Modèles',
      'nav.responses': 'Réponses',
      'nav.analytics': 'Analyses',
      'nav.settings': 'Paramètres',
      'nav.profile': 'Profil',
      'nav.logout': 'Déconnexion',
      'nav.login': 'Connexion',
      'nav.register': "S'inscrire",
      
      // Add more French translations as needed...
    }
  }
};

// RTL languages
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

// Initialize i18n
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    react: {
      useSuspense: false,
    },
  });

// Helper functions
export const getCurrentLanguage = () => i18n.language;
export const isRTL = (language?: string) => rtlLanguages.includes(language || i18n.language);
export const getDirection = (language?: string) => isRTL(language) ? 'rtl' : 'ltr';

// Language options
export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];

// Format functions
export const formatDate = (date: Date, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (date: Date, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateTime = (date: Date, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatNumber = (number: number, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.NumberFormat(lang).format(number);
};

export const formatCurrency = (amount: number, currency: string, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercent = (number: number, language?: string) => {
  const lang = language || i18n.language;
  return new Intl.NumberFormat(lang, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number / 100);
};

// Pluralization helper
export const pluralize = (count: number, singular: string, plural?: string) => {
  if (count === 1) {
    return i18n.t(singular, { count });
  }
  return i18n.t(plural || singular, { count });
};

// Template translation helper
export const translateTemplate = (template: any, targetLanguage: string) => {
  if (!template.translations || !template.translations[targetLanguage]) {
    return template;
  }
  
  const translation = template.translations[targetLanguage];
  
  return {
    ...template,
    name: translation.name || template.name,
    description: translation.description || template.description,
    sections: template.sections.map((section: any) => ({
      ...section,
      title: translation.sections?.[section.id]?.title || section.title,
      description: translation.sections?.[section.id]?.description || section.description,
      fields: section.fields.map((field: any) => ({
        ...field,
        label: translation.fields?.[field.id]?.label || field.label,
        placeholder: translation.fields?.[field.id]?.placeholder || field.placeholder,
        helpText: translation.fields?.[field.id]?.helpText || field.helpText,
        options: field.options?.map((option: any) => ({
          ...option,
          label: translation.fields?.[field.id]?.options?.[option.value] || option.label,
        })),
      })),
    })),
  };
};

export default i18n;