import apiClient from '@utils/apiClient';
import type { ProcessPdfResponse, SearchRequest, SearchResponse, HealthCheckResponse, ApiResponse } from '@models/PdfModel';

const API_BASE = 'api/langchain';

export class PdfService {
    /**
     * Upload PDF file và xử lý thành chunks
     * @param file - File PDF cần upload
     * @param year - Năm học (mặc định 2026)
     * @param onProgress - Callback theo dõi tiến trình upload
     */
    static async uploadPdf(
        file: File,
        year: number = 2026,
        onProgress?: (percent: number) => void
    ): Promise<ProcessPdfResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<ApiResponse<ProcessPdfResponse>>(
            `${API_BASE}/upload?year=${year}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 300000, // 5 phút cho file lớn
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                },
            }
        );

        return response.data.data;
    }

    /**
     * Tìm kiếm trong các document đã upload
     * @param request - Thông tin tìm kiếm
     */
    static async search(request: SearchRequest): Promise<SearchResponse> {
        const response = await apiClient.post<ApiResponse<SearchResponse>>(`${API_BASE}/search`, request);
        return response.data.data;
    }

    /**
     * Kiểm tra trạng thái service
     */
    static async healthCheck(): Promise<HealthCheckResponse> {
        const response = await apiClient.get<HealthCheckResponse>(`${API_BASE}/health`);
        return response.data;
    }
}

export default PdfService;
