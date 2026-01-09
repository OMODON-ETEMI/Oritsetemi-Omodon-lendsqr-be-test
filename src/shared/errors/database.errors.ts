
export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromKnexError(error: any): DatabaseError {
    const code = error.code || error.errno;
    

    switch (code) {
      case 'ER_DUP_ENTRY':
      case 1062:
        return new DuplicateEntryError(
          this.extractDuplicateField(error.message),
          error
        );
      
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
      case 1216:
      case 1452:
        return new ForeignKeyError('Referenced record does not exist', error);
      
      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
      case 1217:
      case 1451:
        return new ForeignKeyError('Cannot delete: record is referenced', error);
      
      case 'ECONNREFUSED':
        return new DatabaseConnectionError('Database connection refused', error);
      
      case 'ER_LOCK_WAIT_TIMEOUT':
      case 1205:
        return new DatabaseError('Lock wait timeout exceeded', error, code);
      
      case 'ER_LOCK_DEADLOCK':
      case 1213:
        return new DatabaseError('Deadlock detected', error, code);
      
      default:
        return new DatabaseError(
          error.message || 'Database operation failed',
          error,
          code
        );
    }
  }

  private static extractDuplicateField(message: string): string {
    const match = message.match(/key '(.+?)'/);
    return match ? `Duplicate value for ${match[1]}` : 'Duplicate entry';
  }
}

export class DuplicateEntryError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(message, originalError, 'DUPLICATE_ENTRY');
    this.name = 'DuplicateEntryError';
  }
}

export class ForeignKeyError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(message, originalError, 'FOREIGN_KEY_VIOLATION');
    this.name = 'ForeignKeyError';
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(message, originalError, 'CONNECTION_ERROR');
    this.name = 'DatabaseConnectionError';
  }
}