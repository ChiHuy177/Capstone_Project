import { Form, Input, Button, Checkbox, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/Auth/AuthContext';
import useForm from 'antd/es/form/hooks/useForm';

const { Title, Link } = Typography;

const LoginForm = () => {
    const { login } = useAuth();
    const [form] = useForm();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        try {
            const loginData = {
                username: values.username,
                email: values.username,
                password: values.password,
            };
            await login(loginData);
            message.success('Đăng nhập thành công!');
            // navigate('/');
        } catch (error: unknown) {
            const anyError = error as { response?: { data?: unknown } };
            let serverMessage = 'Đăng nhập thất bại.';
            const data = anyError?.response?.data;
            if (typeof data === 'string') {
                serverMessage = data;
            } else if (data && typeof data === 'object' && 'message' in data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                serverMessage = (data as any).message ?? serverMessage;
            }
            console.log(serverMessage);
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
            <Card
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                    border: 'none',
                    background: '#ffffff',
                }}
                bodyStyle={{
                    padding: '48px 40px 40px 40px',
                }}
            >
                {/* Logo Section */}
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: '40px',
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
                        Đăng nhập vào Hệ thống
                    </Title>
                    <Title
                        level={3}
                        style={{
                            color: '#133F68',
                            fontSize: '22px',
                            fontWeight: '600',
                            margin: '0',
                            marginTop: '4px',
                        }}
                    >
                        EIU
                    </Title>
                </div>

                {/* Login Form */}
                <Form
                    form={form}
                    name="ueh_login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
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
                                Email hoặc tên đăng nhập
                            </span>
                        }
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập email hoặc tên đăng nhập!',
                            },
                        ]}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                            style={{
                                height: '52px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                border: '2px solid #e5e7eb',
                                backgroundColor: '#f9fafb',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        className="password-item"
                        label={
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                            >
                                <span
                                    style={{
                                        color: '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    Mật khẩu
                                </span>
                                <div style={{ marginLeft: 'auto' }}>
                                    <Link
                                        href="#"
                                        style={{
                                            color: '#133F68',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                            </div>
                        }
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mật khẩu!',
                            },
                        ]}
                        style={{ marginBottom: '28px' }}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                            style={{
                                height: '52px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                border: '2px solid #e5e7eb',
                                backgroundColor: '#f9fafb',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="remember"
                        valuePropName="checked"
                        style={{ marginBottom: '32px' }}
                    >
                        <Checkbox
                            style={{
                                color: '#374151',
                                fontSize: '14px',
                            }}
                        >
                            <span style={{ marginLeft: '8px' }}>Lưu thông tin đăng nhập</span>
                        </Checkbox>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: '32px' }}>
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
                                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
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
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    {/* Register Link */}
                    <div
                        style={{
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '14px',
                        }}
                    >
                        Chưa có tài khoản?{' '}
                        <Link
                            href="#"
                            style={{
                                color: '#133F68',
                                fontWeight: '600',
                                textDecoration: 'none',
                            }}
                        >
                            Đăng ký tài khoản
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default LoginForm;
