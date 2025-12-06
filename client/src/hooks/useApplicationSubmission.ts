import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { resetApplication, setDocumentS3Url } from '@/state/applicationSlice';
import { useBatchUpload } from '@/hooks/batchUpload';
import { useGetUniversitiesQuery } from '@/state/api';
import { cleanupSessionStorage, clearAllSessionFiles } from '@/utils/getFileFromSessionStorage';
import { CreateApplicationRequest, UpdateApplicationRequest } from '@/types/applications';
import { logger } from '@/utils/logger';
import { showToast } from '@/utils/toast';
import { APPLICATION_CONSTANTS } from '@/utils/constants';

interface UseApplicationSubmissionOptions {
  mode: 'create' | 'edit';
  applicationId?: string;
  onSubmitSuccess?: (result: any) => void;
  onSubmitError?: (error: any) => void;
}

export const useApplicationSubmission = ({
  mode,
  applicationId,
  onSubmitSuccess,
  onSubmitError,
}: UseApplicationSubmissionOptions) => {
  const dispatch = useAppDispatch();
  const {
    student,
    selectedUniversity,
    academicQualifications,
    documents,
    maritalStatus,
    marriageCertificate,
    intendedPrograms,
  } = useAppSelector((state) => state.application);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { batchUpload } = useBatchUpload();
  const { data: universities } = useGetUniversitiesQuery();

  const uni = universities?.find(
    (u) => u.id.toString() === selectedUniversity?.id?.toString()
  ) || selectedUniversity;

  const prepareFilesForUpload = () => {
    const filesToUpload: Array<{
      fileId: string;
      documentType: string;
      fileName: string;
      studentId?: string;
    }> = [];
    const fileIds: string[] = [];

    // Add regular documents - only upload if:
    // 1. Has fileId (file in sessionStorage) AND
    // 2. Does NOT have a valid URL (not already uploaded to S3)
    for (const doc of documents) {
      // Skip if document already has a valid S3 URL (already uploaded)
      const hasValidUrl = doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://'));

      if (doc.fileId && !hasValidUrl) {
        filesToUpload.push({
          fileId: doc.fileId,
          documentType: doc.documentType,
          fileName: doc.fileName,
          studentId: student?.id?.toString(),
        });
        fileIds.push(doc.fileId);
      }
    }

    // Add marriage certificate if exists - only if not already uploaded
    if (marriageCertificate?.fileId) {
      const hasValidUrl = marriageCertificate.url &&
        (marriageCertificate.url.startsWith('http://') || marriageCertificate.url.startsWith('https://'));

      if (!hasValidUrl) {
        filesToUpload.push({
          fileId: marriageCertificate.fileId,
          documentType: marriageCertificate.documentType,
          fileName: marriageCertificate.fileName,
          studentId: student?.id?.toString(),
        });
        fileIds.push(marriageCertificate.fileId);
      }
    }

    return { filesToUpload, fileIds };
  };

  const prepareApplicationData = (uploadResults: any[]): CreateApplicationRequest | UpdateApplicationRequest => {
    // Ensure university has required fields - handle both API structures
    const universityData = uni || selectedUniversity;
    if (!universityData) {
      throw new Error('University is required');
    }

    // Extract countryId from either structure (countryId field or country.id)
    const countryId = (universityData as any).countryId ||
      ((universityData as any).country?.id) ||
      (selectedUniversity as any)?.countryId ||
      undefined;

    // Validate that countryId exists and is a valid number
    if (countryId === undefined || countryId === null || countryId === 0) {
      throw new Error('University countryId is required');
    }

    const university = {
      id: universityData.id,
      name: universityData.name,
      countryId: countryId,
      website: (universityData as any).website,
      ranking: (universityData as any).ranking,
      tuitionFeeRange: (universityData as any).tuitionFeeRange || (universityData as any).tuition_fee_range,
    };

    // Ensure academic qualifications preserve IDs if they exist
    const academicQualificationsToSubmit = (academicQualifications || []).map((qual) => ({
      ...(qual.id !== undefined && qual.id !== null ? { id: qual.id } : {}),
      name: qual.name || '',
      educationLevel: qual.educationLevel || 'OTHER',
      institutionName: qual.institutionName || '',
      programName: qual.programName || undefined,
      startDate: qual.startDate || '',
      endDate: qual.endDate || undefined,
      grade: qual.grade || undefined,
      gpa: qual.gpa !== undefined ? qual.gpa : undefined,
      isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
      documentPath: qual.documentPath || undefined,
    }));

    logger.log('Preparing academic qualifications for submission:', {
      originalCount: academicQualifications?.length || 0,
      preparedCount: academicQualificationsToSubmit.length,
      original: academicQualifications,
      prepared: academicQualificationsToSubmit,
    });

    const baseData = {
      student: student!,
      university: university,
      academicQualifications: academicQualificationsToSubmit,
      documents: documents.map((doc) => {
        const uploadResult = uploadResults.find(
          (r: any) => r.documentType === doc.documentType && r.success
        );
        return {
          documentType: doc.documentType,
          fileName: doc.fileName,
          filePath: uploadResult?.url || doc.url || doc.filePath || '',
          fileSize: doc.fileSize,
          fileType: doc.fileType,
          verified: false,
        };
      }),
      maritalStatus,
      marriageCertificate: marriageCertificate
        ? {
          documentType: marriageCertificate.documentType,
          fileName: marriageCertificate.fileName,
          filePath:
            uploadResults.find(
              (r: any) => r.documentType === marriageCertificate.documentType && r.success
            )?.url || marriageCertificate.url || marriageCertificate.filePath || '',
          fileSize: marriageCertificate.fileSize,
          verified: false,
        }
        : undefined,
      intendedPrograms,
    };

    if (mode === 'edit' && applicationId) {
      return {
        ...baseData,
        applicationId: parseInt(applicationId),
      } as UpdateApplicationRequest;
    }

    return baseData as CreateApplicationRequest;
  };

  const submitApplication = async (
    createMutation: (data: CreateApplicationRequest) => Promise<any>,
    updateMutation?: (data: UpdateApplicationRequest) => Promise<any>
  ): Promise<any> => {
    if (!student || !selectedUniversity || !uni) {
      throw new Error('Missing required application data');
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare files from sessionStorage
      const { filesToUpload, fileIds } = prepareFilesForUpload();

      logger.log('Files to upload:', filesToUpload.length);

      // 2. Upload all files to S3 (only new files that have fileId)
      let uploadResults: any[] = [];
      if (filesToUpload.length > 0) {
        uploadResults = await batchUpload(filesToUpload);

        // Check for failed uploads
        const failedUploads = uploadResults.filter((r: any) => !r.success);
        if (failedUploads.length > 0) {
          logger.error('Failed uploads:', failedUploads);
          const errorMessage = `Failed to upload ${failedUploads.length} document(s). Please try again.`;
          showToast.error(errorMessage);
          throw new Error(errorMessage);
        }

        logger.log('All files uploaded successfully');

        // 3. Update Redux with S3 URLs
        uploadResults.forEach((result: any) => {
          if (result.success && result.url) {
            dispatch(
              setDocumentS3Url({
                documentType: result.documentType,
                s3Url: result.url,
              })
            );
          }
        });
      }

      // 4. Prepare application data
      const applicationData = prepareApplicationData(uploadResults);

      logger.log(`${mode === 'create' ? 'Creating' : 'Updating'} application with data:`, applicationData);
      logger.log('Academic qualifications in submission:', {
        count: applicationData.academicQualifications?.length || 0,
        qualifications: applicationData.academicQualifications,
        hasIds: applicationData.academicQualifications?.every(q => q.id !== undefined) || false,
      });

      // 5. Create or update application in database
      let result;
      if (mode === 'edit' && updateMutation && applicationId) {
        result = await updateMutation(applicationData as UpdateApplicationRequest);
      } else {
        result = await createMutation(applicationData as CreateApplicationRequest);
      }

      logger.log(`Application ${mode === 'create' ? 'created' : 'updated'} successfully:`, result);

      showToast.success(
        mode === 'create'
          ? 'Application submitted successfully!'
          : 'Application updated successfully!'
      );

      // 6. Clean up sessionStorage
      if (fileIds.length > 0) {
        cleanupSessionStorage(fileIds);
      }

      dispatch(resetApplication());
      clearAllSessionFiles();
      localStorage.removeItem(APPLICATION_CONSTANTS.STORAGE_KEYS.APPLICATION_WIZARD);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }

      return result;
    } catch (error: any) {
      logger.error('Submission failed:', error);

      // Show user-friendly error message
      const errorMessage = error?.message ||
        error?.data?.message ||
        'Failed to submit application. Please try again.';

      showToast.error(errorMessage);

      if (onSubmitError) {
        onSubmitError(error);
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitApplication,
    canSubmit: !!(student && selectedUniversity && selectedUniversity.id && uni),
  };
};

