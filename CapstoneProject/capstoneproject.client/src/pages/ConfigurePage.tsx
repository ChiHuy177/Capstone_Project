import React, { useState } from 'react';
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
} from 'antd';
import {
    SettingOutlined,
    SaveOutlined,
    ApiOutlined,
    RobotOutlined,
    HomeOutlined,
    KeyOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface ConfigFormData {
    apiToken: string;
    aiModel: string;
}

const ConfigurePage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Danh sách các model AI
    const aiModels = [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'gemini-pro', label: 'Gemini Pro' },
        { value: 'gemini-ultra', label: 'Gemini Ultra' },
    ];

    const handleSave = async (values: ConfigFormData) => {
        setLoading(true);

        try {
            // Log data ra console như yêu cầu
            console.log('=== CONFIGURATION DATA ===');
            console.log('API Token:', values.apiToken);
            console.log('Selected AI Model:', values.aiModel);
            console.log('Timestamp:', new Date().toISOString());
            console.log('========================');

            // Giả lập việc lưu dữ liệu
            await new Promise((resolve) => setTimeout(resolve, 1000));

            message.success('Cấu hình đã được lưu thành công!');
        } catch (error) {
            console.error('Error saving configuration:', error);
            message.error('Có lỗi xảy ra khi lưu cấu hình!');
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
                                style={{ height: '100%' }}
                            >
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSave}
                                    initialValues={{
                                        apiToken: '',
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
                                            optionFilterProp="children"
                                            filterOption={(input, option) =>
                                                (option?.children as unknown as string)
                                                    ?.toLowerCase()
                                                    ?.includes(input.toLowerCase())
                                            }
                                        >
                                            {aiModels.map((model) => (
                                                <Option key={model.value} value={model.value}>
                                                    <Space>
                                                        <RobotOutlined />
                                                        {model.label}
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Divider />

                                    <Form.Item style={{ marginBottom: 0 }}>
                                        <Space size="middle">
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={loading}
                                                icon={<SaveOutlined />}
                                                size="large"
                                            >
                                                Lưu cấu hình
                                            </Button>
                                            <Button onClick={handleReset} size="large">
                                                Reset
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
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
                                            • Lấy API Token từ trang web của nhà cung cấp AI
                                            <br />
                                            • Đảm bảo token có quyền truy cập cần thiết
                                            <br />• Giữ bí mật API Token của bạn
                                        </Text>
                                    </div>

                                    <Divider />

                                    <div>
                                        <Title level={5}>
                                            <RobotOutlined /> Model AI
                                        </Title>
                                        <Text type="secondary">
                                            • GPT-3.5 Turbo: Nhanh, tiết kiệm chi phí
                                            <br />
                                            • GPT-4: Chất lượng cao, suy luận tốt
                                            <br />
                                            • Claude: Hiểu ngữ cảnh tốt
                                            <br />• Gemini: Đa phương tiện
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
