import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, Contact, ServiceRequest, Quote, MaintenanceReminder, MaintenanceRecord, JobLog, ToolCheckItem, JobPhoto, StatusTimestamp, ServiceStatus, MechanicVerification } from '@/types/service';
import { PRODUCTION_CONFIG, logProductionEvent } from '@/utils/firebase-config';

interface JobPart {
  name: string;
  description: string;
  price: number;
  quantity: number;
  source?: string;
}

interface AppState {
  // User data
  contact: Contact | null;
  vehicles: Vehicle[];
  
  // Service requests
  serviceRequests: ServiceRequest[];
  quotes: Quote[];
  maintenanceReminders: MaintenanceReminder[];
  maintenanceHistory: MaintenanceRecord[];
  jobLogs: JobLog[];
  jobParts: { [jobId: string]: JobPart[] };
  
  // Mechanic verification
  mechanicVerifications: MechanicVerification[];
  
  // UI state
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  
  // Actions
  setContact: (contact: Contact) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  
  addServiceRequest: (request: ServiceRequest) => void;
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  updateJobStatus: (jobId: string, status: ServiceStatus, mechanicId: string, notes?: string) => void;
  cancelJob: (jobId: string, reason: string, mechanicId: string) => void;
  
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  
  addMaintenanceReminder: (reminder: MaintenanceReminder) => void;
  updateMaintenanceReminder: (id: string, updates: Partial<MaintenanceReminder>) => void;
  removeMaintenanceReminder: (id: string) => void;
  
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  
  addJobLog: (log: JobLog) => void;
  updateJobLog: (id: string, updates: Partial<JobLog>) => void;
  
  setCurrentLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
  
  // Tools management
  updateJobTools: (jobId: string, toolsChecked: { [toolId: string]: boolean }) => void;
  completeToolsCheck: (jobId: string, notes?: string) => void;
  getJobToolsStatus: (jobId: string) => { total: number; checked: number; allRequired: boolean };
  
  // Parts management
  addJobParts: (jobId: string, parts: JobPart[]) => void;
  updateJobParts: (jobId: string, parts: JobPart[]) => void;
  getJobParts: (jobId: string) => JobPart[];
  
  // Photo management
  addJobPhotos: (jobId: string, photos: JobPhoto[]) => void;
  getJobPhotos: (jobId: string) => JobPhoto[];
  removeJobPhoto: (jobId: string, photoId: string) => void;
  
  // Timeline management
  getJobTimeline: (jobId: string) => StatusTimestamp[];
  getJobDuration: (jobId: string) => { estimated: number; actual: number };
  
  // Maintenance tracking
  getVehicleMaintenanceHistory: (vehicleId: string) => MaintenanceRecord[];
  getUpcomingMaintenance: (vehicleId: string) => MaintenanceReminder[];
  markReminderAsSent: (reminderId: string) => void;
  completeMaintenanceReminder: (reminderId: string, serviceRecord: MaintenanceRecord) => void;
  
  // Job tracking
  getJobLogs: (jobId: string) => JobLog[];
  getActiveJobTimer: (jobId: string) => JobLog | null;
  getTotalJobTime: (jobId: string) => number;
  
  // Payment tracking
  getQuotesByStatus: (status: Quote['status']) => Quote[];
  getTotalRevenue: (startDate?: Date, endDate?: Date) => number;
  getPaymentHistory: () => Quote[];
  
  // Verification management
  addMechanicVerification: (verification: MechanicVerification) => void;
  updateMechanicVerification: (id: string, updates: Partial<MechanicVerification>) => void;
  getMechanicVerification: (userId: string) => MechanicVerification | null;
  getAllVerifications: () => MechanicVerification[];
  
  // Production logging
  logEvent: (event: string, data: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      contact: null,
      vehicles: [],
      serviceRequests: [],
      quotes: [],
      maintenanceReminders: [],
      maintenanceHistory: [],
      jobLogs: [],
      jobParts: {},
      mechanicVerifications: [],
      currentLocation: null,
      
      // Actions
      setContact: (contact) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('contact_updated', { contactId: contact.id });
        }
        set({ contact });
      },
      
      addVehicle: (vehicle) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('vehicle_added', { 
            vehicleId: vehicle.id, 
            make: vehicle.make, 
            model: vehicle.model, 
            year: vehicle.year 
          });
        }
        set((state) => ({
          vehicles: [...state.vehicles, vehicle]
        }));
      },
      
      updateVehicle: (id, updates) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('vehicle_updated', { vehicleId: id, updates: Object.keys(updates) });
        }
        set((state) => ({
          vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
        }));
      },
      
      removeVehicle: (id) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('vehicle_removed', { vehicleId: id });
        }
        set((state) => ({
          vehicles: state.vehicles.filter(v => v.id !== id),
          maintenanceHistory: state.maintenanceHistory.filter(r => r.vehicleId !== id),
          maintenanceReminders: state.maintenanceReminders.filter(r => r.vehicleId !== id),
        }));
      },
      
      addServiceRequest: (request) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('service_request_added', { 
            requestId: request.id, 
            serviceType: request.type, 
            urgency: request.urgency,
            toolsCount: request.requiredTools?.length || 0
          });
        }
        set((state) => ({
          serviceRequests: [...state.serviceRequests, request]
        }));
      },
      
      updateServiceRequest: (id, updates) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('service_request_updated', { 
            requestId: id, 
            updates: Object.keys(updates),
            newStatus: updates.status
          });
        }
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
      },
      
      updateJobStatus: (jobId: string, status: ServiceStatus, mechanicId: string, notes?: string) => {
        const timestamp = new Date();
        
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_status_updated', { 
            jobId, 
            status, 
            mechanicId, 
            timestamp: timestamp.toISOString(),
            hasNotes: !!notes
          });
        }
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => {
            if (r.id === jobId) {
              const newTimestamp: StatusTimestamp = {
                status,
                timestamp,
                mechanicId,
                notes
              };
              
              const statusTimeline = [...(r.statusTimeline || []), newTimestamp];
              
              // Update specific timestamp fields based on status
              const statusUpdates: Partial<ServiceRequest> = {
                status,
                statusTimeline,
                updatedAt: timestamp
              };
              
              switch (status) {
                case 'accepted':
                  statusUpdates.claimedAt = timestamp;
                  break;
                case 'scheduled':
                  statusUpdates.scheduledAt = timestamp;
                  break;
                case 'in_progress':
                  statusUpdates.startedAt = timestamp;
                  break;
                case 'paused':
                  statusUpdates.pausedAt = timestamp;
                  break;
                case 'completed':
                  statusUpdates.completedAt = timestamp;
                  // Calculate actual duration
                  if (r.startedAt) {
                    const duration = Math.round((timestamp.getTime() - r.startedAt.getTime()) / (1000 * 60));
                    statusUpdates.actualDuration = duration;
                  }
                  break;
                case 'cancelled':
                  statusUpdates.cancelledAt = timestamp;
                  statusUpdates.cancelledBy = mechanicId;
                  statusUpdates.cancellationReason = notes || 'No reason provided';
                  break;
              }
              
              return { ...r, ...statusUpdates };
            }
            return r;
          })
        }));
      },
      
      cancelJob: (jobId: string, reason: string, mechanicId: string) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_cancelled', { jobId, reason, mechanicId });
        }
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { 
              ...r, 
              status: 'cancelled',
              cancelledAt: new Date(),
              cancelledBy: mechanicId,
              cancellationReason: reason
            } : r
          )
        }));
      },
      
      addQuote: (quote) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('quote_added', { 
            quoteId: quote.id, 
            serviceRequestId: quote.serviceRequestId, 
            totalCost: quote.totalCost 
          });
        }
        set((state) => ({
          quotes: [...state.quotes, quote]
        }));
      },
      
      updateQuote: (id, updates) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('quote_updated', { 
            quoteId: id, 
            updates: Object.keys(updates),
            newStatus: updates.status
          });
        }
        set((state) => ({
          quotes: state.quotes.map(q => q.id === id ? { ...q, ...updates } : q)
        }));
      },
      
      addMaintenanceReminder: (reminder) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('maintenance_reminder_added', { 
            reminderId: reminder.id, 
            vehicleId: reminder.vehicleId, 
            serviceType: reminder.serviceType 
          });
        }
        set((state) => ({
          maintenanceReminders: [...state.maintenanceReminders, reminder]
        }));
      },
      
      updateMaintenanceReminder: (id, updates) => set((state) => ({
        maintenanceReminders: state.maintenanceReminders.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      removeMaintenanceReminder: (id) => set((state) => ({
        maintenanceReminders: state.maintenanceReminders.filter(r => r.id !== id)
      })),
      
      addMaintenanceRecord: (record) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('maintenance_record_added', { 
            recordId: record.id, 
            vehicleId: record.vehicleId, 
            serviceType: record.serviceType,
            cost: record.cost
          });
        }
        
        set((state) => {
          // Also update the vehicle's maintenance history
          const updatedVehicles = state.vehicles.map(vehicle => {
            if (vehicle.id === record.vehicleId) {
              return {
                ...vehicle,
                maintenanceHistory: [...(vehicle.maintenanceHistory || []), record],
                lastServiceDate: record.performedAt,
                nextServiceDue: record.nextDueDate,
              };
            }
            return vehicle;
          });

          return {
            maintenanceHistory: [...state.maintenanceHistory, record],
            vehicles: updatedVehicles,
          };
        });
      },
      
      updateMaintenanceRecord: (id, updates) => set((state) => ({
        maintenanceHistory: state.maintenanceHistory.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      addJobLog: (log) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_log_added', { 
            logId: log.id, 
            jobId: log.jobId, 
            mechanicId: log.mechanicId,
            startTime: log.startTime.toISOString()
          });
        }
        set((state) => ({
          jobLogs: [...state.jobLogs, log]
        }));
      },
      
      updateJobLog: (id, updates) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_log_updated', { 
            logId: id, 
            updates: Object.keys(updates),
            duration: updates.duration
          });
        }
        set((state) => ({
          jobLogs: state.jobLogs.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
      },
      
      setCurrentLocation: (location) => set({ currentLocation: location }),
      
      // Tools management
      updateJobTools: (jobId: string, toolsChecked: { [toolId: string]: boolean }) => {
        const checkedCount = Object.values(toolsChecked).filter(Boolean).length;
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_tools_updated', { 
            jobId, 
            mechanicId: 'mechanic-cody',
            checkedCount,
            totalTools: Object.keys(toolsChecked).length
          });
        }
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { ...r, toolsChecked } : r
          )
        }));
      },
      
      completeToolsCheck: (jobId: string, notes?: string) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('tools_check_completed', { 
            jobId, 
            mechanicId: 'mechanic-cody',
            hasNotes: !!notes
          });
        }
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { 
              ...r, 
              toolsCheckCompletedAt: new Date(),
              toolsNotes: notes
            } : r
          )
        }));
      },
      
      getJobToolsStatus: (jobId: string) => {
        const state = get();
        const job = state.serviceRequests.find(r => r.id === jobId);
        if (!job || !job.requiredTools) return { total: 0, checked: 0, allRequired: false };
        
        const total = job.requiredTools.length;
        const checked = Object.values(job.toolsChecked || {}).filter(Boolean).length;
        const requiredTools = job.requiredTools; // All tools in requiredTools are required
        const allRequired = requiredTools.every(toolId => job.toolsChecked?.[toolId]);
        
        return { total, checked, allRequired };
      },
      
      // Parts management
      addJobParts: (jobId: string, parts: JobPart[]) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_parts_added', { 
            jobId, 
            mechanicId: 'mechanic-cody',
            partsCount: parts.length,
            totalCost: parts.reduce((sum, part) => sum + (part.price * part.quantity), 0)
          });
        }
        
        set((state) => ({
          jobParts: {
            ...state.jobParts,
            [jobId]: [...(state.jobParts[jobId] || []), ...parts]
          }
        }));
      },
      
      updateJobParts: (jobId: string, parts: JobPart[]) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_parts_updated', { 
            jobId, 
            mechanicId: 'mechanic-cody',
            partsCount: parts.length,
            totalCost: parts.reduce((sum, part) => sum + (part.price * part.quantity), 0)
          });
        }
        
        set((state) => ({
          jobParts: {
            ...state.jobParts,
            [jobId]: parts
          }
        }));
      },
      
      getJobParts: (jobId: string) => {
        const state = get();
        return state.jobParts[jobId] || [];
      },
      
      // Photo management
      addJobPhotos: (jobId: string, photos: JobPhoto[]) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_photos_added', { 
            jobId, 
            mechanicId: 'mechanic-cody',
            photoCount: photos.length,
            photoTypes: photos.map(p => p.type)
          });
        }
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { 
              ...r, 
              jobPhotos: [...(r.jobPhotos || []), ...photos]
            } : r
          )
        }));
      },
      
      getJobPhotos: (jobId: string) => {
        const state = get();
        const job = state.serviceRequests.find(r => r.id === jobId);
        return job?.jobPhotos || [];
      },
      
      removeJobPhoto: (jobId: string, photoId: string) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('job_photo_removed', { 
            jobId, 
            photoId,
            mechanicId: 'mechanic-cody'
          });
        }
        
        set((state) => ({
          serviceRequests: state.serviceRequests.map(r => 
            r.id === jobId ? { 
              ...r, 
              jobPhotos: (r.jobPhotos || []).filter(p => p.id !== photoId)
            } : r
          )
        }));
      },
      
      // Timeline management
      getJobTimeline: (jobId: string) => {
        const state = get();
        const job = state.serviceRequests.find(r => r.id === jobId);
        return job?.statusTimeline || [];
      },
      
      getJobDuration: (jobId: string) => {
        const state = get();
        const job = state.serviceRequests.find(r => r.id === jobId);
        return {
          estimated: job?.estimatedDuration || 0,
          actual: job?.actualDuration || 0
        };
      },
      
      // Maintenance tracking helpers
      getVehicleMaintenanceHistory: (vehicleId: string) => {
        const state = get();
        return state.maintenanceHistory.filter(record => record.vehicleId === vehicleId)
          .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
      },
      
      getUpcomingMaintenance: (vehicleId: string) => {
        const state = get();
        const today = new Date();
        return state.maintenanceReminders
          .filter(reminder => 
            reminder.vehicleId === vehicleId && 
            reminder.dueDate >= today &&
            !reminder.completed
          )
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      },
      
      markReminderAsSent: (reminderId: string) => set((state) => ({
        maintenanceReminders: state.maintenanceReminders.map(r => 
          r.id === reminderId ? { ...r, reminderSent: true } : r
        )
      })),

      completeMaintenanceReminder: (reminderId: string, serviceRecord: MaintenanceRecord) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('maintenance_reminder_completed', { 
            reminderId, 
            serviceRecordId: serviceRecord.id,
            vehicleId: serviceRecord.vehicleId
          });
        }
        
        set((state) => {
          // Mark reminder as completed
          const updatedReminders = state.maintenanceReminders.map(r => 
            r.id === reminderId ? { ...r, completed: true, completedAt: new Date() } : r
          );

          // Add service record
          const updatedHistory = [...state.maintenanceHistory, serviceRecord];

          // Update vehicle
          const updatedVehicles = state.vehicles.map(vehicle => {
            if (vehicle.id === serviceRecord.vehicleId) {
              return {
                ...vehicle,
                maintenanceHistory: [...(vehicle.maintenanceHistory || []), serviceRecord],
                lastServiceDate: serviceRecord.performedAt,
                nextServiceDue: serviceRecord.nextDueDate,
              };
            }
            return vehicle;
          });

          return {
            maintenanceReminders: updatedReminders,
            maintenanceHistory: updatedHistory,
            vehicles: updatedVehicles,
          };
        });
      },
      
      // Job tracking helpers
      getJobLogs: (jobId: string) => {
        const state = get();
        return state.jobLogs.filter(log => log.jobId === jobId)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      },
      
      getActiveJobTimer: (jobId: string) => {
        const state = get();
        return state.jobLogs.find(log => log.jobId === jobId && !log.endTime) || null;
      },

      getTotalJobTime: (jobId: string) => {
        const state = get();
        const logs = state.jobLogs.filter(log => log.jobId === jobId && log.endTime);
        return logs.reduce((total, log) => {
          if (log.endTime) {
            return total + (log.endTime.getTime() - log.startTime.getTime());
          }
          return total;
        }, 0);
      },

      // Payment tracking helpers
      getQuotesByStatus: (status: Quote['status']) => {
        const state = get();
        return state.quotes.filter(quote => quote.status === status);
      },

      getTotalRevenue: (startDate?: Date, endDate?: Date) => {
        const state = get();
        return state.quotes
          .filter(quote => {
            if (!['paid', 'deposit_paid'].includes(quote.status) || !quote.paidAt) return false;
            if (startDate && quote.paidAt < startDate) return false;
            if (endDate && quote.paidAt > endDate) return false;
            return true;
          })
          .reduce((total, quote) => total + quote.totalCost, 0);
      },

      getPaymentHistory: () => {
        const state = get();
        return state.quotes
          .filter(quote => ['paid', 'deposit_paid'].includes(quote.status) && quote.paidAt)
          .sort((a, b) => (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0));
      },

      // Verification management
      addMechanicVerification: (verification: MechanicVerification) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('mechanic_verification_added', { 
            verificationId: verification.id, 
            userId: verification.userId,
            status: verification.status
          });
        }
        set((state) => ({
          mechanicVerifications: [...state.mechanicVerifications, verification]
        }));
      },

      updateMechanicVerification: (id: string, updates: Partial<MechanicVerification>) => {
        if (typeof logProductionEvent === 'function') {
          logProductionEvent('mechanic_verification_updated', { 
            verificationId: id, 
            updates: Object.keys(updates),
            newStatus: updates.status
          });
        }
        set((state) => ({
          mechanicVerifications: state.mechanicVerifications.map(v => 
            v.id === id ? { ...v, ...updates } : v
          )
        }));
      },

      getMechanicVerification: (userId: string) => {
        const state = get();
        return state.mechanicVerifications
          .filter(v => v.userId === userId)
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0] || null;
      },

      getAllVerifications: () => {
        const state = get();
        return state.mechanicVerifications
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      },
      
      // Production logging
      logEvent: (event: string, data: any) => {
        const timestamp = new Date().toISOString();
        const logData = {
          event,
          data,
          timestamp,
          environment: 'production',
          mechanicId: 'mechanic-cody', // Production: Cody only
        };
        
        // Console logging for production monitoring
        console.log('App Event:', logData);
        
        // Production: Send to analytics service
        if (PRODUCTION_CONFIG && PRODUCTION_CONFIG.enableToolsModule && typeof logProductionEvent === 'function') {
          logProductionEvent(event, { ...data, timestamp });
        }
      },
    }),
    {
      name: 'heinicus-mechanic-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contact: state.contact,
        vehicles: state.vehicles,
        serviceRequests: state.serviceRequests,
        quotes: state.quotes,
        maintenanceReminders: state.maintenanceReminders,
        maintenanceHistory: state.maintenanceHistory,
        jobLogs: state.jobLogs,
        jobParts: state.jobParts,
        mechanicVerifications: state.mechanicVerifications,
      }),
    }
  )
);