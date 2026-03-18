import React, { useState } from 'react';
import {
    Upload,
    Button,
    Card,
    Select,
    message,
    Table,
    Typography,
    Space,
    Progress,
    Alert,
    Divider,
    Tag,
    Input,
    InputNumber,
    List,
    Collapse,
} from 'antd';
import {
    InboxOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import PdfService from '@services/PdfService';
import type { ProcessPdfResponse, SearchResult } from '@models/PdfModel';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface UploadResult {
    key: string;
    fileName: string;
    status: 'success' | 'error';
    documentId?: string;
    numChunks?: number;
    message: string;
    uploadedAt: Date;
}

const PdfUploadPage: React.FC = () => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
    const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchYear, setSearchYear] = useState<number | undefined>(undefined);
    const [searchTopK, setSearchTopK] = useState<number>(5);
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    // Kiểm tra trạng thái service khi component mount
    React.useEffect(() => {
        checkServiceHealth();
    }, []);

    const checkServiceHealth = async () => {
        setServiceStatus('checking');
        try {
            await PdfService.healthCheck();
            setServiceStatus('online');
        } catch {
            setServiceStatus('offline');
        }
    };

    // Tạo danh sách năm học (từ 2020 đến 2030)
    const yearOptions = Array.from({ length: 11 }, (_, i) => ({
        value: 2020 + i,
        label: `Năm ${2020 + i}`,
    }));

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Vui lòng chọn file PDF để upload');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const results: UploadResult[] = [];

        for (const file of fileList) {
            try {
                const response: ProcessPdfResponse = await PdfService.uploadPdf(
                    file.originFileObj as File,
                    selectedYear,
                    (percent) => setUploadProgress(percent)
                );

                results.push({
                    key: file.uid,
                    fileName: file.name,
                    status: response.success ? 'success' : 'error',
                    documentId: response.documentId,
                    numChunks: response.numChunks,
                    message: response.message,
                    uploadedAt: new Date(),
                });

                if (response.success) {
                    message.success(`Upload thành công: ${file.name}`);
                } else {
                    message.error(`Upload thất bại: ${file.name} - ${response.message}`);
                }
            } catch (error: any) {
                results.push({
                    key: file.uid,
                    fileName: file.name,
                    status: 'error',
                    message: error.response?.data?.message || error.message || 'Lỗi không xác định',
                    uploadedAt: new Date(),
                });
                message.error(`Lỗi upload: ${file.name}`);
            }
        }

        setUploadResults((prev) => [...results, ...prev]);
        setFileList([]);
        setUploading(false);
        setUploadProgress(0);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            message.warning('Vui lòng nhập từ khóa tìm kiếm');
            return;
        }

        setSearching(true);
        setSearchResults([]);

        try {
            const response = await PdfService.search({
                query: searchQuery,
                topK: searchTopK,
                year: searchYear,
            });
            setSearchResults(response.results || []);
            if (response.results?.length === 0) {
                message.info('Không tìm thấy kết quả nào');
            } else {
                message.success(`Tìm thấy ${response.results?.length} kết quả`);
            }
        } catch (error: any) {
            console.error('Search error:', error);
            message.error(error.response?.data?.message || 'Lỗi khi tìm kiếm');
        } finally {
            setSearching(false);
        }
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: true,
        accept: '.pdf',
        fileList,
        beforeUpload: (file) => {
            const isPdf = file.type === 'application/pdf';
            if (!isPdf) {
                message.error(`${file.name} không phải là file PDF`);
                return Upload.LIST_IGNORE;
            }

            const isLt50M = file.size / 1024 / 1024 < 50;
            if (!isLt50M) {
                message.error('File phải nhỏ hơn 50MB');
                return Upload.LIST_IGNORE;
            }

            return false; // Không upload tự động
        },
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList);
        },
        onRemove: (file) => {
            setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
        },
    };

    const resultColumns = [
        {
            title: 'Tên file',
            dataIndex: 'fileName',
            key: 'fileName',
            render: (text: string) => (
                <Space>
                    <FileTextOutlined />
                    <Text>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: 'success' | 'error') =>
                status === 'success' ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Thành công
                    </Tag>
                ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error">
                        Thất bại
                    </Tag>
                ),
        },
        {
            title: 'Document ID',
            dataIndex: 'documentId',
            key: 'documentId',
            render: (id: string) => (id ? <Text code>{id.substring(0, 8)}...</Text> : '-'),
        },
        {
            title: 'Số chunks',
            dataIndex: 'numChunks',
            key: 'numChunks',
            width: 100,
            render: (num: number) => (num ? <Tag color="blue">{num}</Tag> : '-'),
        },
        {
            title: 'Thông báo',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
        },
        {
            title: 'Thời gian',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            width: 180,
            render: (date: Date) => date.toLocaleString('vi-VN'),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={3}>Upload PDF Documents</Title>
            <Text type="secondary">
                Upload file PDF để hệ thống xử lý và tạo chunks cho việc tìm kiếm
            </Text>

            <Divider />

            {/* Service Status */}
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Text>Trạng thái dịch vụ:</Text>
                    {serviceStatus === 'checking' && <Tag color="processing">Đang kiểm tra...</Tag>}
                    {serviceStatus === 'online' && <Tag color="success">Online</Tag>}
                    {serviceStatus === 'offline' && <Tag color="error">Offline</Tag>}
                    <Button
                        icon={<ReloadOutlined />}
                        size="small"
                        onClick={checkServiceHealth}
                        loading={serviceStatus === 'checking'}
                    >
                        Kiểm tra lại
                    </Button>
                </Space>
            </div>

            {serviceStatus === 'offline' && (
                <Alert
                    message="Dịch vụ xử lý PDF đang offline"
                    description="Vui lòng kiểm tra lại kết nối hoặc liên hệ quản trị viên."
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Card style={{ marginBottom: 24 }}>
                {/* Year Selection */}
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Năm học: </Text>
                    <Select
                        value={selectedYear}
                        onChange={setSelectedYear}
                        options={yearOptions}
                        style={{ width: 150 }}
                    />
                </div>

                {/* Upload Area */}
                <Dragger {...uploadProps} disabled={uploading || serviceStatus === 'offline'}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Kéo thả file PDF vào đây hoặc click để chọn</p>
                    <p className="ant-upload-hint">
                        Hỗ trợ upload nhiều file cùng lúc. Chỉ chấp nhận file PDF, tối đa 50MB/file.
                    </p>
                </Dragger>

                {/* Upload Progress */}
                {uploading && (
                    <div style={{ marginTop: 16 }}>
                        <Progress percent={uploadProgress} status="active" />
                        <Text type="secondary">Đang xử lý file...</Text>
                    </div>
                )}

                {/* Upload Button */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Button
                        type="primary"
                        onClick={handleUpload}
                        disabled={fileList.length === 0 || serviceStatus === 'offline'}
                        loading={uploading}
                        size="large"
                        icon={<InboxOutlined />}
                    >
                        {uploading ? 'Đang upload...' : `Upload ${fileList.length} file`}
                    </Button>
                </div>
            </Card>

            {/* Search Section */}
            <Card title="Tìm kiếm trong PDF" style={{ marginBottom: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Space wrap>
                        <Input
                            placeholder="Nhập từ khóa tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{ width: 300 }}
                            prefix={<SearchOutlined />}
                            disabled={serviceStatus === 'offline'}
                        />
                        <Select
                            placeholder="Năm học (tất cả)"
                            value={searchYear}
                            onChange={setSearchYear}
                            options={[
                                { value: undefined, label: 'Tất cả năm' },
                                ...yearOptions,
                            ]}
                            style={{ width: 150 }}
                            allowClear
                        />
                        <Space>
                            <Text>Top K:</Text>
                            <InputNumber
                                min={1}
                                max={20}
                                value={searchTopK}
                                onChange={(value) => setSearchTopK(value || 5)}
                                style={{ width: 80 }}
                            />
                        </Space>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={searching}
                            disabled={serviceStatus === 'offline'}
                        >
                            Tìm kiếm
                        </Button>
                    </Space>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div>
                            <Divider orientation="left">
                                Kết quả tìm kiếm ({searchResults.length})
                            </Divider>
                            <Collapse
                                items={searchResults.map((result, index) => ({
                                    key: index,
                                    label: (
                                        <Space>
                                            <Tag color="blue">Score: {result.score?.toFixed(4)}</Tag>
                                            <Tag color="green">Trang {result.metadata?.page}</Tag>
                                            <Text ellipsis style={{ maxWidth: 400 }}>
                                                {result.metadata?.source || result.metadata?.sourceFile}
                                            </Text>
                                        </Space>
                                    ),
                                    children: (
                                        <div>
                                            <div style={{
                                                background: '#f5f5f5',
                                                padding: 12,
                                                borderRadius: 4,
                                                whiteSpace: 'pre-wrap',
                                                marginBottom: 12
                                            }}>
                                                {result.content}
                                            </div>
                                            <Space wrap>
                                                {result.metadata?.documentId && (
                                                    <Tag>Document ID: {result.metadata.documentId.substring(0, 8)}...</Tag>
                                                )}
                                                <Tag>Chunk: {result.metadata?.chunkIndex}</Tag>
                                                <Tag color="cyan">
                                                    File: {(result.metadata?.source || result.metadata?.sourceFile)?.split('/').pop()}
                                                </Tag>
                                                {result.metadata?.academicYear && (
                                                    <Tag color="purple">Năm {result.metadata.academicYear}</Tag>
                                                )}
                                            </Space>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>
                    )}
                </Space>
            </Card>

            {/* Upload Results */}
            {uploadResults.length > 0 && (
                <Card title="Lịch sử upload" extra={
                    <Button size="small" onClick={() => setUploadResults([])}>
                        Xóa lịch sử
                    </Button>
                }>
                    <Table
                        columns={resultColumns}
                        dataSource={uploadResults}
                        pagination={{ pageSize: 5 }}
                        size="small"
                    />
                </Card>
            )}
        </div>
    );
};

export default PdfUploadPage;
