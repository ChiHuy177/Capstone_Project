import React, { useState } from 'react';
import { Layout, Menu, Input, Button, Typography, Avatar, Dropdown } from 'antd';
import {
    SendOutlined,
    DownOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import '../index.scss';   

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Text} = Typography;

const UEHChatbot: React.FC = () => {
    const [inputValue, setInputValue] = useState('');

    const menuItems = [
        {
            key: '1',
            label: 'Lịch sử chat',
            children: [
                {
                    key: '1-1',
                    label: 'Đại học',
                },
            ],
        },
    ];

    const userMenuItems = [
        {
            key: '1',
            label: 'Profile',
        },
        {
            key: '2',
            label: 'Settings',
        },
        {
            key: '3',
            label: 'Logout',
        },
    ];

    return (
        <Layout style={{ height: '100vh' }}>
            {/* Header */}
            <Header
                style={{
                    background: '#fff',
                    padding: '0 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                        }}
                    >
                        <img src="EIU_Logo.png" alt="EIU Logo" style={{ width: 150 }} />
                    </div>
                    <Text strong style={{ fontSize: 24, fontWeight: '800', color: '#133F68' }}>
                        EIU Chatbot
                    </Text>
                </div>

                <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                        }}
                    >
                        <Avatar size={32} style={{ backgroundColor: '#133F68' }}>
                            N
                        </Avatar>
                        <Text>Nguyễn Chí Huy</Text>
                        <DownOutlined style={{ fontSize: 12 }} />
                    </div>
                </Dropdown>
            </Header>

            <Layout>
                {/* Sidebar */}
                <Sider
                    width={280}
                    style={{
                        background: '#fafafa',
                        borderRight: '1px solid #f0f0f0',
                    }}
                >
                    <div style={{ padding: 16 }}>
                        <Button
                            type="default"
                            icon={<PlusOutlined />}
                            block
                            style={{ marginBottom: 16, color: 'white', backgroundColor: '#133F68' }}
                        >
                            Chat mới
                        </Button>

                        <Menu
                            mode="inline"
                            defaultSelectedKeys={['1-1']}
                            defaultOpenKeys={['1']}
                            items={menuItems}
                            style={{
                                background: 'transparent',
                                border: 'none',
                            }}
                        />
                    </div>
                </Sider>

                {/* Main Content */}
                <Content style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Chat Messages Area */}
                    <div
                        style={{
                            flex: 1,
                            padding: '24px 32px',
                            overflow: 'auto',
                            background: '#fff',
                        }}
                    >
                        <div style={{ maxWidth: 800, margin: '0 auto' }}></div>
                    </div>

                    {/* Input Area */}
                    <div
                        style={{
                            padding: '16px 32px',
                            borderTop: '1px solid #f0f0f0',
                            background: '#fff',
                        }}
                    >
                        <div style={{ maxWidth: 1200, minHeight: 100, margin: '0 auto' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                                <TextArea
                                    placeholder="Nhập tin nhắn của bạn..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    autoSize={{ minRows: 4, maxRows: 10 }}
                                    style={{
                                        flex: 1,
                                        borderRadius: 10,
                                        borderColor: '#133F68',
                                        minHeight: 100,
                                    }}
                                    onPressEnter={(e) => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            // Handle send message
                                        }
                                    }}
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    style={{
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    disabled={!inputValue.trim()}
                                />
                            </div>
                        </div>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default UEHChatbot;
