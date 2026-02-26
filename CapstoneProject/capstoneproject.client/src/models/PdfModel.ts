export interface ProcessPdfResponse {
    success: boolean;
    message: string;
    documentId: string;
    numChunks: number;
}

export interface ApiResponse<T> {
    metadata: {
        code: number;
        message: string;
        timestamp: string;
    };
    data: T;
}

export interface PdfInfo {
    numberOfPages: number;
    title?: string;
    author?: string;
    creationDate?: string;
    fileSize: number;
}

export interface SearchRequest {
    query: string;
    topK?: number;
    year?: number;
}

export interface SearchMetadata {
    documentId: string;
    chunkIndex: number;
    page: number;
    sourceFile: string;
    source: string;
    totalPages: number;
    uploadedAt: string;
    academicYear?: number | null;
    isActive?: boolean | null;
}

export interface SearchResult {
    content: string;
    metadata: SearchMetadata;
    score: number;
}

export interface SearchResponse {
    results: SearchResult[];
}

export interface HealthCheckResponse {
    status: string;
    service: string;
    timestamp: string;
}
