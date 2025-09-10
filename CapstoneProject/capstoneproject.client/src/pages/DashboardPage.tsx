import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Tag,
    Space,
    Button,
    Modal,
    message,
    Layout,
    Typography,
    Breadcrumb,
    Row,
    Col,
    Statistic,
    Input,
    Badge,
    Divider,
    Tooltip,
    Avatar,
} from 'antd';
import {
    ReloadOutlined,
    MessageOutlined,
    UserOutlined,
    RobotOutlined,
    SearchOutlined,
    CalendarOutlined,
    HomeOutlined,
    DashboardOutlined,
    UnorderedListOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ChatService from '../services/ChatService';
import type { CountChatModel } from '../models/CountChatModel';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

interface ChatMessage {
    id: number;
    userId: string;
    message: string;
    isUserMessage: boolean;
    timestamp: string;
    sessionId?: string;
}

interface ChatSession {
    sessionId: string;
    userId: string;
    messageCount: number;
    userMessageCount: number;
    botMessageCount: number;
    firstMessage: string;
    lastMessage: string;
    startTime: string;
    endTime: string;
    messages: ChatMessage[];
}

const DashboardPage: React.FC = () => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [viewMode, setViewMode] = useState<'messages' | 'sessions'>('sessions');
    const [numberOfMessages, setNumberOfMessages] = useState<CountChatModel>();

    const fetchChatMessages = async () => {
        setLoading(true);
        try {
            const data = await ChatService.getAllMessage();
            setChatMessages(data);

            // Gom nhóm dữ liệu theo sessionId
            const sessionsMap = new Map<string, ChatMessage[]>();

            data.forEach((message: ChatMessage) => {
                if (message.sessionId) {
                    if (!sessionsMap.has(message.sessionId)) {
                        sessionsMap.set(message.sessionId, []);
                    }
                    sessionsMap.get(message.sessionId)!.push(message);
                }
            });

            // Chuyển đổi thành mảng ChatSession
            const sessions: ChatSession[] = Array.from(sessionsMap.entries()).map(
                ([sessionId, messages]) => {
                    const sortedMessages = messages.sort(
                        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );

                    const userMessages = messages.filter((msg) => msg.isUserMessage);
                    const botMessages = messages.filter((msg) => !msg.isUserMessage);

                    return {
                        sessionId,
                        userId: messages[0]?.userId || 'Unknown',
                        messageCount: messages.length,
                        userMessageCount: userMessages.length,
                        botMessageCount: botMessages.length,
                        firstMessage: sortedMessages[0]?.message || '',
                        lastMessage: sortedMessages[sortedMessages.length - 1]?.message || '',
                        startTime: sortedMessages[0]?.timestamp || '',
                        endTime: sortedMessages[sortedMessages.length - 1]?.timestamp || '',
                        messages: sortedMessages,
                    };
                }
            );

            // Sắp xếp theo thời gian mới nhất
            sessions.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
            setChatSessions(sessions);
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            message.error('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const fetchNumberOfMessages = async () => {
        setLoading(true);
        try {
            const data = await ChatService.countAllMessage();
            setNumberOfMessages(data);
        } catch (error) {
            message.error(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChatMessages();
        fetchNumberOfMessages();
        // Refresh data every 30 seconds
        const interval = setInterval(fetchChatMessages, 30000);
        return () => clearInterval(interval);
    }, []);

    // Lọc sessions theo từ khóa tìm kiếm
    const filteredSessions = searchText
        ? chatSessions.filter(
              (session) =>
                  session.userId.toLowerCase().includes(searchText.toLowerCase()) ||
                  session.firstMessage.toLowerCase().includes(searchText.toLowerCase()) ||
                  session.lastMessage.toLowerCase().includes(searchText.toLowerCase())
          )
        : chatSessions;

    // Lọc tin nhắn theo từ khóa tìm kiếm
    const filteredMessages = searchText
        ? chatMessages.filter(
              (msg) =>
                  msg.message.toLowerCase().includes(searchText.toLowerCase()) ||
                  msg.userId.toLowerCase().includes(searchText.toLowerCase())
          )
        : chatMessages;

    const sessionColumns: ColumnsType<ChatSession> = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => <Text strong>{index + 1}</Text>,
        },
        {
            title: 'User ID',
            dataIndex: 'userId',
            key: 'userId',
            width: 150,
            ellipsis: true,
            filterSearch: true,
            filters: [...new Set(chatSessions.map((session) => session.userId))].map((userId) => ({
                text: userId,
                value: userId,
            })),
            onFilter: (value, record) => record.userId === value,
            render: (userId) => (
                <Tooltip title={userId}>
                    <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text ellipsis style={{ maxWidth: 100 }}>
                            {userId}
                        </Text>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: 'Số tin nhắn',
            key: 'messageCount',
            width: 100,
            sorter: (a, b) => a.messageCount - b.messageCount,
            render: (_, record) => (
                <div style={{ textAlign: 'center' }}>
                    <Badge
                        count={record.messageCount}
                        showZero
                        style={{ backgroundColor: '#52c41a' }}
                    />
                </div>
            ),
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            width: 180,
            sorter: (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
            render: (startTime: string) => (
                <Tooltip title={convertToVietnamTime(startTime).toLocaleString('vi-VN')}>
                    <Space>
                        <CalendarOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ fontSize: '12px' }}>
                            {convertToVietnamTime(startTime).toLocaleString('vi-VN')}
                        </Text>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            width: 180,
            sorter: (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
            render: (endTime: string) => (
                <Tooltip title={convertToVietnamTime(endTime).toLocaleString('vi-VN')}>
                    <Space>
                        <CalendarOutlined style={{ color: '#1890ff' }} />
                        <Text style={{ fontSize: '12px' }}>
                            {convertToVietnamTime(endTime).toLocaleString('vi-VN')}
                        </Text>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: 'Thời gian',
            key: 'timeRange',
            width: 200,
            sorter: (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
            render: (_, record) => (
                <Tooltip
                    title={`Bắt đầu: ${convertToVietnamTime(record.startTime).toLocaleString(
                        'vi-VN'
                    )}\nKết thúc: ${convertToVietnamTime(record.endTime).toLocaleString('vi-VN')}`}
                >
                    <Space direction="vertical" size="small">
                        <div style={{ fontSize: '12px' }}>
                            <CalendarOutlined />{' '}
                            {convertToVietnamTime(record.startTime).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            <CalendarOutlined />{' '}
                            {convertToVietnamTime(record.endTime).toLocaleDateString('vi-VN')}
                        </div>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        size="small"
                        icon={<SearchOutlined />}
                        onClick={() => {
                            setSelectedSession(record);
                            setIsModalVisible(true);
                        }}
                    >
                        Xem chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    const columns: ColumnsType<ChatMessage> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'User ID',
            dataIndex: 'userId',
            key: 'userId',
            width: 150,
            ellipsis: true,
            filterSearch: true,
            filters: [...new Set(chatMessages.map((msg) => msg.userId))].map((userId) => ({
                text: userId,
                value: userId,
            })),
            onFilter: (value, record) => record.userId === value,
            render: (userId) => (
                <Tooltip title={userId}>
                    <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text ellipsis style={{ maxWidth: 100 }}>
                            {userId}
                        </Text>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: 'Tin nhắn',
            dataIndex: 'message',
            key: 'message',
            width: 400,
            ellipsis: true,
            render: (text: string) => (
                <Tooltip title={text}>
                    <div style={{ maxWidth: 400, wordBreak: 'break-word' }}>{text}</div>
                </Tooltip>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'isUserMessage',
            key: 'isUserMessage',
            width: 120,
            filters: [
                { text: 'User', value: true },
                { text: 'EIU', value: false },
            ],
            onFilter: (value, record) => record.isUserMessage === value,
            render: (isUser: boolean) => (
                <Tag
                    color={isUser ? 'blue' : 'green'}
                    icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                >
                    {isUser ? 'User' : 'ChatGPT'}
                </Tag>
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            ellipsis: true,
            sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
            render: (timestamp: string) => (
                <Tooltip title={convertToVietnamTime(timestamp).toLocaleString('vi-VN')}>
                    <Space>
                        <CalendarOutlined />
                        <span>{convertToVietnamTime(timestamp).toLocaleString('vi-VN')}</span>
                    </Space>
                </Tooltip>
            ),
        },
    ];

    // Hàm chuyển đổi UTC sang UTC+7
    const convertToVietnamTime = (utcTime: string): Date => {
        const date = new Date(utcTime);
        // Thêm 7 giờ vào thời gian UTC
        date.setHours(date.getHours() + 7);
        return date;
    };

    return (
        <Layout className="dashboard-layout" style={{ minHeight: '100vh' }}>
            <Header
                style={{
                    background: '#fff',
                    padding: '0 16px',
                    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '100%',
                    }}
                >
                    <Title level={3} style={{ margin: 0 }}>
                        <DashboardOutlined />
                        <span className="hidden-xs">Hệ thống quản lý Chat</span>
                        <span className="visible-xs">Dashboard</span>
                    </Title>
                </div>
            </Header>

            <Content style={{ padding: '0 16px', margin: '16px 0' }}>
                <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item href="/">
                        <HomeOutlined />
                        <span className="hidden-xs">Trang chủ</span>
                        <span className="visible-xs">Trang chủ</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <DashboardOutlined />
                        <span className="hidden-xs">Dashboard</span>
                        <span className="visible-xs">Dashboard</span>
                    </Breadcrumb.Item>
                </Breadcrumb>

                <div
                    style={{ background: '#fff', padding: '16px', minHeight: 360, borderRadius: 4 }}
                >
                    <Row gutter={[16, 24]}>
                        <Col xs={24} sm={8}>
                            <Card bordered={false} hoverable>
                                <Statistic
                                    title="Tổng tin nhắn"
                                    value={numberOfMessages?.allMessage}
                                    prefix={<MessageOutlined />}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card bordered={false} hoverable>
                                <Statistic
                                    title="Tin nhắn người dùng"
                                    value={numberOfMessages?.userMessage}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card bordered={false} hoverable>
                                <Statistic
                                    title="Tin nhắn AI-agent"
                                    value={numberOfMessages?.botMessage}
                                    prefix={<RobotOutlined />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card bordered={false} hoverable>
                                <Statistic
                                    title="Số người dùng"
                                    value={numberOfMessages?.numberOfUsers}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Divider />

                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col xs={24} sm={24} md={16} lg={18}>
                            <Space wrap size="small">
                                <Button
                                    type="primary"
                                    icon={<ReloadOutlined />}
                                    onClick={fetchChatMessages}
                                    loading={loading}
                                    size="small"
                                >
                                    <span className="hidden-xs">Làm mới dữ liệu</span>
                                    <span className="visible-xs">Làm mới</span>
                                </Button>
                                <Button.Group size="small">
                                    <Button
                                        type={viewMode === 'sessions' ? 'primary' : 'default'}
                                        icon={<AppstoreOutlined />}
                                        onClick={() => setViewMode('sessions')}
                                    >
                                        <span className="hidden-xs">Theo Session</span>
                                        <span className="visible-xs">Session</span>
                                    </Button>
                                    <Button
                                        type={viewMode === 'messages' ? 'primary' : 'default'}
                                        icon={<UnorderedListOutlined />}
                                        onClick={() => setViewMode('messages')}
                                    >
                                        <span className="hidden-xs">Theo Tin nhắn</span>
                                        <span className="visible-xs">Tin nhắn</span>
                                    </Button>
                                </Button.Group>
                                <Badge
                                    count={
                                        viewMode === 'sessions'
                                            ? filteredSessions.length
                                            : filteredMessages.length
                                    }
                                >
                                    <Button size="small">
                                        <span className="hidden-xs">
                                            {viewMode === 'sessions'
                                                ? 'Tổng số session'
                                                : 'Tổng số tin nhắn'}{' '}
                                            hiển thị
                                        </span>
                                        <span className="visible-xs">
                                            {viewMode === 'sessions' ? 'Session' : 'Tin nhắn'}
                                        </span>
                                    </Button>
                                </Badge>
                            </Space>
                        </Col>
                        <Col xs={24} sm={24} md={8} lg={6}>
                            <Search
                                placeholder={
                                    viewMode === 'sessions'
                                        ? 'Tìm kiếm session hoặc user ID'
                                        : 'Tìm kiếm tin nhắn hoặc user ID'
                                }
                                allowClear
                                enterButton
                                size="small"
                                style={{ width: '100%' }}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </Col>
                    </Row>

                    {viewMode === 'sessions' ? (
                        <Table
                            columns={sessionColumns}
                            dataSource={filteredSessions}
                            rowKey="sessionId"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => (
                                    <span className="hidden-xs">
                                        {`${range[0]}-${range[1]} của ${total} session`}
                                    </span>
                                ),
                                size: 'small',
                            }}
                            scroll={{ x: 1000, y: 400 }}
                            bordered
                            size="small"
                            className="resizable-table"
                        />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={filteredMessages}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => (
                                    <span className="hidden-xs">
                                        {`${range[0]}-${range[1]} của ${total} tin nhắn`}
                                    </span>
                                ),
                                size: 'small',
                            }}
                            scroll={{ x: 800, y: 400 }}
                            bordered
                            size="small"
                            rowClassName={(record) =>
                                record.isUserMessage ? 'user-message-row' : 'bot-message-row'
                            }
                            className="resizable-table"
                        />
                    )}
                </div>
            </Content>

            <Modal
                title={
                    <Space>
                        <MessageOutlined />
                        <span>Chi tiết Session</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width="90%"
                style={{ maxWidth: 1600 }}
            >
                {selectedSession && (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <Card size="small" title="Thông tin Session">
                                    <p>
                                        <strong>Session ID:</strong>
                                    </p>
                                    <Text code style={{ fontSize: '12px' }}>
                                        {selectedSession.sessionId}
                                    </Text>
                                    <p style={{ marginTop: 8 }}>
                                        <strong>User ID:</strong>
                                        <Space style={{ marginLeft: 8 }}>
                                            <Avatar size="small" icon={<UserOutlined />} />
                                            {selectedSession.userId}
                                        </Space>
                                    </p>
                                    <p>
                                        <strong>Số tin nhắn:</strong> {selectedSession.messageCount}
                                    </p>
                                    <p>
                                        <strong>Thời gian bắt đầu:</strong>
                                        <br />
                                        {convertToVietnamTime(
                                            selectedSession.startTime
                                        ).toLocaleString('vi-VN')}
                                    </p>
                                    <p>
                                        <strong>Thời gian kết thúc:</strong>
                                        <br />
                                        {convertToVietnamTime(
                                            selectedSession.endTime
                                        ).toLocaleString('vi-VN')}
                                    </p>
                                </Card>
                            </Col>
                            <Col xs={24} md={16}>
                                <Card size="small" title="Tất cả tin nhắn trong session">
                                    <Table
                                        columns={columns}
                                        dataSource={selectedSession.messages}
                                        rowKey="id"
                                        loading={loading}
                                        pagination={false}
                                        scroll={{ x: 800, y: 400 }}
                                        bordered
                                        size="small"
                                        rowClassName={(record) =>
                                            record.isUserMessage
                                                ? 'user-message-row'
                                                : 'bot-message-row'
                                        }
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default DashboardPage;
