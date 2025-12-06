export interface Student {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    email: string;
    phone?: string;
    nationality?: string;
    passportNumber?: string;
    displayPicture?: string;
    passportExpiry?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    hasEnglishTest: boolean;
    englishTestType?: 'IELTS' | 'TOEFL' | 'PTE' | 'DUOLINGO' | 'none';
    englishTestScore?: string;
    englishTestDate?: string;
}

export interface University {
    id: number;
    name: string;
    countryId?: number;
    website?: string;
    ranking?: number;
    tuitionFeeRange?: string;
}
export interface AcademicQualification {
    id?: number;
    name: string;
    educationLevel: 'OL' | 'AL' | 'BACHELORS' | 'MASTERS' | 'PHD' | 'OTHER';
    institutionName: string;
    programName?: string;
    startDate: string;
    endDate?: string;
    grade?: string;
    gpa?: number;
    isCompleted: boolean;
    documentPath?: string;
}

export interface ApplicationDocument {
    documentType: string;
    fileName: string;
    filePath: string;
    fileSize?: number;
}

export interface IntendedProgram {
    country: string;
    programme: string;
    university: string;
}

export interface CreateApplicationRequest {
    student: Student;
    university: University;
    academicQualifications: AcademicQualification[];
    documents: ApplicationDocument[];
    maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
    marriageCertificate?: ApplicationDocument;
    intendedPrograms: IntendedProgram[];
}

export interface UpdateApplicationRequest extends CreateApplicationRequest {
    applicationId: number;
}