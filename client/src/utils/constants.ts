/**
 * Application constants
 * Centralized configuration values
 */

export const APPLICATION_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_MARRIAGE_CERT_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  TOTAL_STEPS: 6, // Updated after removing UniversitySelection step (kept IntendedPrograms)
  STORAGE_KEYS: {
    APPLICATION_WIZARD: 'applicationWizard',
  },
} as const;

export const DOCUMENT_TYPES = {
  OL_CERTIFICATE: 'OL_CERTIFICATE',
  AL_CERTIFICATE: 'AL_CERTIFICATE',
  BACHELORS_CERTIFICATE: 'BACHELORS_CERTIFICATE',
  MASTERS_CERTIFICATE: 'MASTERS_CERTIFICATE',
  LANGUAGE_PROFICIENCY: 'LANGUAGE_PROFICIENCY',
  PASSPORT: 'PASSPORT',
  PHOTOGRAPH: 'PHOTOGRAPH',
  CV: 'CV',
  RECOMMENDATION_LETTER: 'RECOMMENDATION_LETTER',
  MARRIAGE_CERTIFICATE: 'MARRIAGE_CERTIFICATE',
  OTHER: 'OTHER',
} as const;

export const REQUIRED_DOCUMENTS = [
  DOCUMENT_TYPES.OL_CERTIFICATE,
  DOCUMENT_TYPES.PASSPORT,
] as const;

