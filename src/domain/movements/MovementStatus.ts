export enum MovementStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PROCESSED = 'processed',
}

export type MovementStatusType = `${MovementStatus}`
