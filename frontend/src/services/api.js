import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}` 
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000 // 2 minutes for larger file uploads
});

/**
 * Upload multiple files with real-time progress callback
 */
export async function uploadFiles(files, expiryHours = 24, onProgress) {
  const formData = new FormData();
  formData.append('expiryHours', expiryHours);

  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
      }
    }
  });

  return response.data;
}

/**
 * Fetch sharing session info and file listing
 */
export async function getSession(token) {
  const response = await api.get(`/session/${token}`);
  return response.data;
}

/**
 * Revoke/delete a sharing session
 */
export async function revokeSession(shareToken, revokeToken) {
  const response = await api.post('/revoke', {
    shareToken,
    revokeToken
  });
  return response.data;
}

/**
 * Get direct download URL for a specific file
 */
export function getSingleFileDownloadUrl(token, fileId) {
  return `${API_BASE}/download/${token}/${fileId}`;
}

/**
 * Get direct download URL for all files bundled as a ZIP
 */
export function getZipDownloadUrl(token) {
  return `${API_BASE}/download-all/${token}`;
}

/**
 * Health check
 */
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

export default {
  uploadFiles,
  getSession,
  revokeSession,
  getSingleFileDownloadUrl,
  getZipDownloadUrl,
  checkHealth
};
