// Event names from TRD section 12, kept in one place so server and clients agree.
export const EVENTS = {
  shiftRequested: 'shift:requested',
  shiftUpdated: 'shift:updated',
  shiftOtp: 'shift:otp',
  workerLocation: 'worker:location',
  timesheetReady: 'timesheet:ready',
  notificationNew: 'notification:new',
} as const;
