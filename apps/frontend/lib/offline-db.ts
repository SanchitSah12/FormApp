import Dexie, { Table } from 'dexie';

// Define interfaces for offline data
export interface OfflineTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  sections: any[];
  fields: any[];
  version: number;
  lastSynced: Date;
  isActive: boolean;
  offlineEnabled: boolean;
}

export interface OfflineResponse {
  id: string;
  templateId: string;
  responses: Record<string, any>;
  status: 'draft' | 'submitted' | 'pending-sync';
  completionPercentage: number;
  submittedAt?: Date;
  submitterInfo?: any;
  sessionId?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  mediaFiles?: OfflineMediaFile[];
  lastModified: Date;
  syncRetryCount: number;
}

export interface OfflineMediaFile {
  id: string;
  responseId: string;
  fieldId: string;
  file: File;
  type: 'image' | 'audio' | 'video' | 'document';
  name: string;
  size: number;
  createdAt: Date;
  synced: boolean;
}

export interface OfflineSettings {
  id: string;
  userId?: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  maxRetries: number;
  enableGPS: boolean;
  enableMediaCapture: boolean;
  enableQRScanning: boolean;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
}

export interface OfflineQueueItem {
  id: string;
  type: 'response' | 'media' | 'template';
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  createdAt: Date;
  lastAttempt?: Date;
  error?: string;
}

// Define the database
export class OfflineDatabase extends Dexie {
  templates!: Table<OfflineTemplate>;
  responses!: Table<OfflineResponse>;
  mediaFiles!: Table<OfflineMediaFile>;
  settings!: Table<OfflineSettings>;
  syncQueue!: Table<OfflineQueueItem>;

  constructor() {
    super('FormAppOfflineDB');

    this.version(1).stores({
      templates: 'id, name, category, lastSynced, isActive',
      responses: 'id, templateId, status, lastModified, sessionId',
      mediaFiles: 'id, responseId, fieldId, type, synced',
      settings: 'id, userId',
      syncQueue: 'id, type, action, createdAt, retryCount'
    });
  }
}

// Initialize database
export const offlineDB = new OfflineDatabase();

// Database operations
export class OfflineManager {
  private static instance: OfflineManager;
  private syncInProgress = false;
  private syncTimer?: NodeJS.Timeout;

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // Template operations
  async saveTemplate(template: any): Promise<void> {
    const offlineTemplate: OfflineTemplate = {
      id: template._id || template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      sections: template.sections || [],
      fields: template.fields || [],
      version: template.version || 1,
      lastSynced: new Date(),
      isActive: template.isActive !== false,
      offlineEnabled: template.offlineSettings?.enabled || false
    };

    await offlineDB.templates.put(offlineTemplate);
  }

  async getTemplate(id: string): Promise<OfflineTemplate | undefined> {
    return await offlineDB.templates.get(id);
  }

  async getOfflineTemplates(): Promise<OfflineTemplate[]> {
    return await offlineDB.templates.where('offlineEnabled').equals(1).toArray();
  }

  // Response operations
  async saveResponse(response: any, templateId: string): Promise<string> {
    const id = response.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const offlineResponse: OfflineResponse = {
      id,
      templateId,
      responses: response.responses || {},
      status: response.status || 'draft',
      completionPercentage: response.completionPercentage || 0,
      submittedAt: response.submittedAt ? new Date(response.submittedAt) : undefined,
      submitterInfo: response.submitterInfo,
      sessionId: response.sessionId,
      gpsLocation: response.gpsLocation,
      mediaFiles: response.mediaFiles || [],
      lastModified: new Date(),
      syncRetryCount: 0
    };

    await offlineDB.responses.put(offlineResponse);

    // Add to sync queue if not already synced
    if (response.status !== 'synced') {
      await this.addToSyncQueue('response', 'create', offlineResponse);
    }

    return id;
  }

  async getResponse(id: string): Promise<OfflineResponse | undefined> {
    return await offlineDB.responses.get(id);
  }

  async getResponsesByTemplate(templateId: string): Promise<OfflineResponse[]> {
    return await offlineDB.responses.where('templateId').equals(templateId).toArray();
  }

  async getPendingResponses(): Promise<OfflineResponse[]> {
    return await offlineDB.responses.where('status').equals('pending-sync').toArray();
  }

  // Media file operations
  async saveMediaFile(file: File, responseId: string, fieldId: string): Promise<string> {
    const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const mediaFile: OfflineMediaFile = {
      id,
      responseId,
      fieldId,
      file,
      type: this.getMediaType(file.type),
      name: file.name,
      size: file.size,
      createdAt: new Date(),
      synced: false
    };

    await offlineDB.mediaFiles.put(mediaFile);
    return id;
  }

  async getMediaFile(id: string): Promise<OfflineMediaFile | undefined> {
    return await offlineDB.mediaFiles.get(id);
  }

  async getMediaFilesByResponse(responseId: string): Promise<OfflineMediaFile[]> {
    return await offlineDB.mediaFiles.where('responseId').equals(responseId).toArray();
  }

  private getMediaType(mimeType: string): 'image' | 'audio' | 'video' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  // GPS location capture
  async captureGPSLocation(): Promise<{ latitude: number; longitude: number; accuracy: number; timestamp: Date; } | null> {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          });
        },
        (error) => {
          console.error('GPS location capture failed:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Sync queue operations
  async addToSyncQueue(type: 'response' | 'media' | 'template', action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    const queueItem: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      data,
      retryCount: 0,
      createdAt: new Date()
    };

    await offlineDB.syncQueue.put(queueItem);
  }

  async getSyncQueue(): Promise<OfflineQueueItem[]> {
    return await offlineDB.syncQueue.orderBy('createdAt').toArray();
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await offlineDB.syncQueue.delete(id);
  }

  // Sync operations
  async startSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline sync...');

    try {
      const queueItems = await this.getSyncQueue();

      for (const item of queueItems) {
        try {
          await this.syncQueueItem(item);
          await this.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);

          // Increment retry count
          item.retryCount++;
          item.lastAttempt = new Date();
          item.error = error instanceof Error ? error.message : 'Unknown error';

          // Remove from queue if max retries reached
          if (item.retryCount >= 5) {
            await this.removeSyncQueueItem(item.id);
            console.error(`Max retries reached for item ${item.id}, removing from queue`);
          } else {
            await offlineDB.syncQueue.put(item);
          }
        }
      }

      // Update settings
      await this.updateSyncSettings({ lastSuccessfulSync: new Date() });

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      console.log('Sync completed');
    }
  }

  private async syncQueueItem(item: OfflineQueueItem): Promise<void> {
    const { type, action, data } = item;

    // This would integrate with your API
    // For now, we'll just simulate the sync

    switch (type) {
      case 'response':
        if (action === 'create') {
          // POST to /api/responses
          console.log('Syncing response:', data.id);
        }
        break;
      case 'media':
        if (action === 'create') {
          // POST to /api/uploads
          console.log('Syncing media file:', data.id);
        }
        break;
      case 'template':
        // Handle template sync
        console.log('Syncing template:', data.id);
        break;
    }
  }

  // Settings operations
  async getSettings(): Promise<OfflineSettings> {
    const settings = await offlineDB.settings.get('default');
    return settings || {
      id: 'default',
      autoSync: true,
      syncInterval: 5,
      maxRetries: 5,
      enableGPS: true,
      enableMediaCapture: true,
      enableQRScanning: true
    };
  }

  async updateSettings(updates: Partial<OfflineSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await offlineDB.settings.put(updated);
  }

  private async updateSyncSettings(updates: Partial<OfflineSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await offlineDB.settings.put(updated);
  }

  // Auto-sync setup
  async setupAutoSync(): Promise<void> {
    const settings = await this.getSettings();

    if (settings.autoSync) {
      this.syncTimer = setInterval(async () => {
        await this.startSync();
      }, settings.syncInterval * 60 * 1000); // Convert minutes to milliseconds
    }
  }

  async stopAutoSync(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  // Data cleanup
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean up old synced responses
    await offlineDB.responses
      .where('lastModified')
      .below(cutoffDate)
      .and(response => response.status === 'submitted')
      .delete();

    // Clean up old media files
    await offlineDB.mediaFiles
      .where('createdAt')
      .below(cutoffDate)
      .and(file => file.synced)
      .delete();

    // Clean up old sync queue items
    await offlineDB.syncQueue
      .where('createdAt')
      .below(cutoffDate)
      .delete();
  }

  // Network status monitoring
  setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('Device came online, starting sync...');
      this.startSync();
    });

    window.addEventListener('offline', () => {
      console.log('Device went offline');
    });
  }

  // Storage usage monitoring
  async getStorageUsage(): Promise<{ used: number; quota: number; available: number; }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    }

    return { used: 0, quota: 0, available: 0 };
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();