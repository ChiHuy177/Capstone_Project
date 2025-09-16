import React from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuth } from '@contexts/Auth/AuthContext';
import { motion } from 'framer-motion';

const { Title, Link } = Typography;

const RegisterForm = () => {
    const [form] = Form.useForm();
    const { register } = useAuth();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        try {
            const registerData = {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
            };
            console.log('Register data:', registerData);
            await register(registerData);
            message.success('Đăng ký tài khoản thành công!');
        } catch (error) {
            message.error('Đăng ký thất bại. Vui lòng thử lại!');
            console.error('Registration error:', error);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(135deg, #174168 0%, #1E5A8A 40%, #2D7BBF 80%, #7FB3E4 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '16px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <Card
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                        border: 'none',
                        background: '#ffffff',
                    }}
                    bodyStyle={{
                        padding: '40px 40px 32px 40px',
                    }}
                >
                    {/* Logo Section */}
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: '5px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '56px',
                                fontWeight: '900',
                                color: '#0f766e',
                                letterSpacing: '-2px',
                                lineHeight: '1',
                                marginBottom: '8px',
                            }}
                        >
                            <img src="EIU_Logo.png" style={{ maxWidth: '100%' }} />
                        </div>

                        <Title
                            level={3}
                            style={{
                                color: '#133F68',
                                fontSize: '22px',
                                fontWeight: '600',
                                margin: '0',
                                lineHeight: '1.3',
                            }}
                        >
                            Đăng ký vào Hệ thống EIU Chatbot Management System
                        </Title>
                    </div>

                    {/* Register Form */}
                    <Form
                        form={form}
                        name="eiu_register"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        requiredMark={false}
                        scrollToFirstError
                    >
                        <Form.Item
                            label={
                                <span
                                    style={{
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    Họ và tên
                                </span>
                            }
                            name="fullName"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên!',
                                },
                                {
                                    min: 2,
                                    message: 'Họ và tên phải có ít nhất 2 ký tự!',
                                },
                            ]}
                            style={{ marginBottom: '18px' }}
                        >
                            <Input
                                prefix={<IdcardOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Nhập họ và tên đầy đủ"
                                style={{
                                    height: '48px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    border: '2px solid #e5e7eb',
                                    backgroundColor: '#f9fafb',
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span
                                    style={{
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    Email
                                </span>
                            }
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập email!',
                                },
                                {
                                    type: 'email',
                                    message: 'Email không hợp lệ!',
                                },
                            ]}
                            style={{ marginBottom: '18px' }}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="example@eiu.edu.vn"
                                style={{
                                    height: '48px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    border: '2px solid #e5e7eb',
                                    backgroundColor: '#f9fafb',
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span
                                    style={{
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    Mật khẩu
                                </span>
                            }
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mật khẩu!',
                                },
                                {
                                    min: 6,
                                    message: 'Mật khẩu phải có ít nhất 6 ký tự!',
                                },
                            ]}
                            style={{ marginBottom: '18px' }}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Nhập mật khẩu"
                                style={{
                                    height: '48px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    border: '2px solid #e5e7eb',
                                    backgroundColor: '#f9fafb',
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span
                                    style={{
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    Xác nhận mật khẩu
                                </span>
                            }
                            name="confirmPassword"
                            dependencies={['password']}
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng xác nhận mật khẩu!',
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(
                                            new Error('Mật khẩu xác nhận không khớp!')
                                        );
                                    },
                                }),
                            ]}
                            style={{ marginBottom: '24px' }}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Nhập lại mật khẩu"
                                style={{
                                    height: '48px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    border: '2px solid #e5e7eb',
                                    backgroundColor: '#f9fafb',
                                }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '28px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                style={{
                                    height: '52px',
                                    borderRadius: '8px',
                                    backgroundColor: '#133F68',
                                    borderColor: '#133F68',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 12px rgba(19, 63, 104, 0.3)',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    const el = e.currentTarget;
                                    el.style.backgroundColor = '#133F68';
                                    el.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    const el = e.currentTarget;
                                    el.style.backgroundColor = '#133F68';
                                    el.style.transform = 'translateY(0)';
                                }}
                            >
                                Đăng ký tài khoản
                            </Button>
                        </Form.Item>

                        {/* Login Link */}
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#6b7280',
                                fontSize: '14px',
                            }}
                        >
                            Đã có tài khoản?{' '}
                            <Link
                                href="/login"
                                style={{
                                    color: '#133F68',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                }}
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </Form>
                </Card>
            </motion.div>
        </div>
    );
};

export default RegisterForm;
