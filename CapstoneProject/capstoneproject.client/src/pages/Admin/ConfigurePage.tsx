import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    Card,
    message,
    Space,
    Typography,
    Divider,
    Layout,
    Breadcrumb,
    Row,
    Col,
    Tooltip,
} from 'antd';
import apiClient from '../../utils/apiClient';
import {
    SettingOutlined,
    SaveOutlined,
    ApiOutlined,
    RobotOutlined,
    HomeOutlined,
    KeyOutlined,
    CopyOutlined,
    CheckOutlined,
    ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface ConfigFormData {
    apiToken: string;
    aiModel: string;
}

const { TextArea } = Input;

const ConfigurePage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [configText, setConfigText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Danh sách các model AI
    const aiModels = [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gemini-pro', label: 'Gemini Pro' },
    ];

    // Hàm để fetch nội dung script
    const fetchScriptContent = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/scriptChatBox.js');
            if (!response.ok) {
                throw new Error('Không thể tải nội dung script');
            }
            const text = await response.text();
            setConfigText(text);
        } catch (err) {
            setError('Có lỗi khi tải nội dung script. Vui lòng thử lại sau.');
            console.error('Lỗi khi tải script:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load cấu hình hiện tại khi component mount
    const loadCurrentConfig = async () => {
        try {
            const response = await apiClient.get('/api/config');
            const configs = response.data;

            form.setFieldsValue({
                apiToken: configs.apiToken || '',
                aiModel: configs.aiModel || 'gpt-3.5-turbo',
            });
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    // Fetch script content và load config khi component mount
    useEffect(() => {
        fetchScriptContent();
        loadCurrentConfig();
    }, []);

    const handleSave = async (values: ConfigFormData) => {
        console.log('handleSave called with values:', values);
        setLoading(true);

        try {
            // Lưu từng cấu hình vào database
            const configs = [
                {
                    key: 'apiToken',
                    value: values.apiToken,
                    description: 'API Token cho dịch vụ AI',
                    isEncrypted: true,
                },
                { key: 'aiModel', value: values.aiModel, description: 'Model AI được sử dụng' },
            ];

            for (const config of configs) {
                console.log('Sending config:', config);
                const response = await apiClient.put('/api/config', config);
                console.log('Response:', response.data);
            }

            message.success('Cấu hình đã được lưu thành công!');
        } catch (error: any) {
            console.error('Error saving configuration:', error);
            const errorMessage =
                error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu cấu hình!';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        message.info('Đã reset form');
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '0 24px', margin: '16px 0' }}>
                <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item href="/">
                        <HomeOutlined /> Trang chủ
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <SettingOutlined /> Cấu hình
                    </Breadcrumb.Item>
                </Breadcrumb>

                <div style={{ background: '#fff', padding: 24, minHeight: 360, borderRadius: 8 }}>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={2}>
                            <SettingOutlined style={{ marginRight: 8 }} />
                            Cấu hình hệ thống
                        </Title>
                        <Text type="secondary">
                            Thiết lập các thông số cần thiết cho hệ thống AI Chat
                        </Text>
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <Card
                                title={
                                    <Space>
                                        <ApiOutlined />
                                        <span>Cấu hình API</span>
                                    </Space>
                                }
                                bordered={false}
                                style={{ marginBottom: 24 }}
                            >
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSave}
                                    initialValues={{
                                        apiToken: 'sk-test123456789',
                                        aiModel: 'gpt-3.5-turbo',
                                    }}
                                >
                                    <Form.Item
                                        label={
                                            <Space>
                                                <KeyOutlined />
                                                <span>API Token</span>
                                            </Space>
                                        }
                                        name="apiToken"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập API Token!' },
                                            {
                                                min: 10,
                                                message: 'API Token phải có ít nhất 10 ký tự!',
                                            },
                                        ]}
                                        tooltip="Nhập API Token để kết nối với dịch vụ AI"
                                    >
                                        <Input.Password
                                            placeholder="Nhập API Token (ví dụ: sk-...)"
                                            size="large"
                                            prefix={<KeyOutlined />}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <Space>
                                                <RobotOutlined />
                                                <span>Model AI</span>
                                            </Space>
                                        }
                                        name="aiModel"
                                        rules={[
                                            { required: true, message: 'Vui lòng chọn Model AI!' },
                                        ]}
                                        tooltip="Chọn model AI để sử dụng cho chat"
                                    >
                                        <Select
                                            placeholder="Chọn Model AI"
                                            size="large"
                                            showSearch
                                            optionFilterProp="label"
                                            filterOption={(input, option) => {
                                                const labelText = String(option?.label ?? '');
                                                return labelText
                                                    .toLowerCase()
                                                    .includes(input.toLowerCase());
                                            }}
                                        >
                                            {aiModels.map((model) => (
                                                <Option
                                                    key={model.value}
                                                    value={model.value}
                                                    label={model.label}
                                                >
                                                    <Space>
                                                        <RobotOutlined />
                                                        {model.label}
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <Space>
                                                <CopyOutlined />
                                                <span>Script Chat Box</span>
                                            </Space>
                                        }
                                        tooltip="Copy script chat box"
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <TextArea
                                                value={configText}
                                                onChange={(e) => setConfigText(e.target.value)}
                                                autoSize={{ minRows: 6, maxRows: 10 }}
                                                style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '14px',
                                                    backgroundColor: '#f5f5f5',
                                                }}
                                                disabled={isLoading}
                                                placeholder={
                                                    isLoading
                                                        ? 'Đang tải nội dung script...'
                                                        : 'Nội dung script sẽ hiển thị ở đây'
                                                }
                                            />
                                            <Space
                                                style={{ position: 'absolute', right: 8, top: 8 }}
                                            >
                                                <Tooltip title="Tải lại nội dung">
                                                    <Button
                                                        icon={<ReloadOutlined spin={isLoading} />}
                                                        onClick={fetchScriptContent}
                                                        loading={isLoading}
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    title={copied ? 'Đã copy!' : 'Copy script'}
                                                >
                                                    <Button
                                                        icon={
                                                            copied ? (
                                                                <CheckOutlined />
                                                            ) : (
                                                                <CopyOutlined />
                                                            )
                                                        }
                                                        style={{
                                                            backgroundColor: copied
                                                                ? '#52c41a'
                                                                : undefined,
                                                            borderColor: copied
                                                                ? '#52c41a'
                                                                : undefined,
                                                            color: copied ? 'white' : undefined,
                                                        }}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                configText
                                                            );
                                                            setCopied(true);
                                                            message.success(
                                                                'Đã copy nội dung script!'
                                                            );
                                                            setTimeout(
                                                                () => setCopied(false),
                                                                2000
                                                            );
                                                        }}
                                                        disabled={isLoading || !configText}
                                                    />
                                                </Tooltip>
                                            </Space>
                                            {error && (
                                                <div
                                                    style={{
                                                        color: '#ff4d4f',
                                                        marginTop: 8,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {error}
                                                </div>
                                            )}
                                        </div>
                                    </Form.Item>
                                </Form>
                            </Card>

                            <Card bordered={false}>
                                <Space size="middle">
                                    <Button
                                        type="primary"
                                        loading={loading}
                                        icon={<SaveOutlined />}
                                        size="large"
                                        onClick={() => {
                                            console.log('Button clicked!');
                                            form.submit();
                                        }}
                                    >
                                        Lưu cấu hình
                                    </Button>
                                    <Button onClick={handleReset} size="large">
                                        Reset
                                    </Button>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title="Hướng dẫn" bordered={false} style={{ height: '100%' }}>
                                <Space direction="vertical" size="middle">
                                    <div>
                                        <Title level={5}>
                                            <KeyOutlined /> API Token
                                        </Title>
                                        <Text type="secondary">
                                            Lấy API Token từ trang web của nhà cung cấp AI
                                        </Text>
                                    </div>

                                    <Divider />

                                    <div>
                                        <Title level={5}>
                                            <RobotOutlined /> Model AI
                                        </Title>
                                        <Text type="secondary">
                                            GPT-3.5 Turbo: Nhanh, tiết kiệm chi phí
                                            <br />
                                            GPT-4: Chất lượng cao, suy luận
                                            <br />
                                            Gemini: Đa phương tiện
                                        </Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
    );
};

export default ConfigurePage;
