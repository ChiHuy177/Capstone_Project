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
    Empty,
    Spin,
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
    EyeOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    CommentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ChatService from '../services/ChatService';
import type { CountChatModel } from '../models/CountChatModel';
import { Activity, Clock } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid,
    AreaChart,
    Area,
} from 'recharts';

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
    const [tableLoading, setTableLoading] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [viewMode, setViewMode] = useState<'messages' | 'sessions'>('sessions');
    const [numberOfMessages, setNumberOfMessages] = useState<CountChatModel>();

    const byDay = React.useMemo(() => {
        const toVNDayKey = (d: Date) => {
            const ms = d.getTime() + 7 * 60 * 60 * 1000; // UTC+7
            const nd = new Date(ms);
            const y = nd.getUTCFullYear();
            const m = String(nd.getUTCMonth() + 1).padStart(2, '0');
            const day = String(nd.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${day}`; // sortable key
        };
        const map = new Map<string, number>();
        chatMessages.forEach((m) => {
            const key = toVNDayKey(new Date(m.timestamp));
            map.set(key, (map.get(key) || 0) + 1);
        });
        const items = Array.from(map.entries()).map(([dateKey, count]) => ({
            date: dateKey,
            count,
        }));
        items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return items.slice(-14);
    }, [chatMessages]);

    const byHour = React.useMemo(() => {
        const arr: { hour: string; count: number }[] = Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}h`,
            count: 0,
        }));
        chatMessages.forEach((m) => {
            const d = new Date(m.timestamp);
            const h = (d.getUTCHours() + 7) % 24; // UTC+7
            if (h >= 0 && h < 24) arr[h].count += 1;
        });
        return arr;
    }, [chatMessages]);

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

    const handleRefresh = async () => {
        if (tableLoading) return;
        setTableLoading(true);
        const minDisplayMs = 500;
        const start = Date.now();
        try {
            await fetchChatMessages();
        } finally {
            const elapsed = Date.now() - start;
            const remaining = minDisplayMs - elapsed;
            if (remaining > 0) {
                await new Promise((resolve) => setTimeout(resolve, remaining));
            }
            setTableLoading(false);
        }
    };

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
            width: 140,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedSession(record);
                            setIsModalVisible(true);
                        }}
                        style={{
                            borderRadius: 6,
                            fontWeight: 500,
                            boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                        }}
                    >
                        Chi tiết
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
                    style={{
                        borderRadius: 6,
                        fontWeight: 500,
                        padding: '4px 8px',
                        fontSize: '12px',
                    }}
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
        <Layout className="dashboard-layout" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Header
                style={{
                    background: '#fff',
                    padding: '0 24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderBottom: '1px solid #f0f0f0',
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
                    <Title level={3} style={{ margin: 0, color: '#124170', fontWeight: 600 }}>
                        <DashboardOutlined style={{ color: '#67C090', marginRight: 8 }} />
                        <span className="hidden-xs">Hệ thống quản lý Chat</span>
                        <span className="visible-xs">Dashboard</span>
                    </Title>
                </div>
            </Header>

            <Content style={{ padding: '0 24px', margin: '24px 0' }}>
                <Breadcrumb style={{ margin: '0 0 24px 0' }}>
                    <Breadcrumb.Item href="/">
                        <HomeOutlined style={{ color: '#67C090' }} />
                        <span className="hidden-xs">Trang chủ</span>
                        <span className="visible-xs">Trang chủ</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <DashboardOutlined style={{ color: '#67C090' }} />
                        <span className="hidden-xs">Dashboard</span>
                        <span className="visible-xs">Dashboard</span>
                    </Breadcrumb.Item>
                </Breadcrumb>

                <div
                    style={{
                        background: '#fff',
                        padding: '24px',
                        minHeight: 360,
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    {/* Statistics Overview */}
                    <div style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ marginBottom: 16, color: '#124170' }}>
                            <DashboardOutlined style={{ marginRight: 8, color: '#67C090' }} />
                            Tổng quan hệ thống
                        </Title>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} sm={12} lg={6}>
                                <Spin spinning={loading || tableLoading}>
                                    <Card
                                        bordered={false}
                                        hoverable
                                        style={{
                                            borderRadius: 12,
                                            background: 'linear-gradient(135deg, #124170 50%)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid rgba(38, 102, 127, 0.1)',
                                        }}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Tổng tin nhắn
                                                </span>
                                            }
                                            value={numberOfMessages?.allMessage || 0}
                                            prefix={
                                                <MessageOutlined
                                                    style={{
                                                        color: 'rgba(255,255,255,0.95)',
                                                        fontSize: '18px',
                                                    }}
                                                />
                                            }
                                            valueStyle={{
                                                color: '#fff',
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            }}
                                            loading={loading}
                                        />
                                    </Card>
                                </Spin>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Spin spinning={loading || tableLoading}>
                                    <Card
                                        bordered={false}
                                        hoverable
                                        style={{
                                            borderRadius: 12,
                                            background: 'linear-gradient(135deg, #67C090)',
                                            color: '#124170',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid rgba(103, 192, 144, 0.2)',
                                        }}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        color: '#26667F',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Tin nhắn người dùng
                                                </span>
                                            }
                                            value={numberOfMessages?.userMessage || 0}
                                            prefix={
                                                <UserOutlined
                                                    style={{
                                                        color: '#124170',
                                                        fontSize: '18px',
                                                    }}
                                                />
                                            }
                                            valueStyle={{
                                                color: '#124170',
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            }}
                                            loading={loading}
                                        />
                                    </Card>
                                </Spin>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Spin spinning={loading || tableLoading}>
                                    {' '}
                                    <Card
                                        bordered={false}
                                        hoverable
                                        style={{
                                            borderRadius: 12,
                                            background: 'linear-gradient(135deg, #26667F)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid rgba(103, 192, 144, 0.1)',
                                        }}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Tin nhắn AI-agent
                                                </span>
                                            }
                                            value={numberOfMessages?.botMessage || 0}
                                            prefix={
                                                <RobotOutlined
                                                    style={{
                                                        color: 'rgba(255,255,255,0.95)',
                                                        fontSize: '18px',
                                                    }}
                                                />
                                            }
                                            valueStyle={{
                                                color: '#fff',
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            }}
                                            loading={loading}
                                        />
                                    </Card>
                                </Spin>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Spin spinning={loading || tableLoading}>
                                    <Card
                                        bordered={false}
                                        hoverable
                                        style={{
                                            borderRadius: 12,
                                            background:
                                                'linear-gradient(135deg, #124170 0%, #26667F 100%)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid rgba(18, 65, 112, 0.1)',
                                        }}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <Statistic
                                            title={
                                                <span
                                                    style={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Số người dùng
                                                </span>
                                            }
                                            value={numberOfMessages?.numberOfUsers || 0}
                                            prefix={
                                                <TeamOutlined
                                                    style={{
                                                        color: 'rgba(255,255,255,0.95)',
                                                        fontSize: '18px',
                                                    }}
                                                />
                                            }
                                            valueStyle={{
                                                color: '#fff',
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            }}
                                            loading={loading}
                                        />
                                    </Card>
                                </Spin>
                            </Col>
                        </Row>
                    </div>

                    <Divider style={{ margin: '24px 0' }} />

                    {/* Charts Section */}
                    <div style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ marginBottom: 16, color: '#124170' }}>
                            <DashboardOutlined style={{ marginRight: 8, color: '#67C090' }} />
                            Biểu đồ
                        </Title>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Card
                                    title={
                                        <span>
                                            <Activity size={18} style={{ marginRight: 8 }} />
                                            Thống kê theo ngày
                                        </span>
                                    }
                                    style={{ borderRadius: 12 }}
                                >
                                    <div style={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={byDay}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={(v: string) => {
                                                        // v is YYYY-MM-DD
                                                        const parts = v.split('-');
                                                        const m = parts[1];
                                                        const d = parts[2];
                                                        return `${d}/${m}`;
                                                    }}
                                                />
                                                <YAxis allowDecimals={false} />
                                                <RechartsTooltip />
                                                <Line
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#1677ff"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Col>

                            <Col span={24}>
                                <Card
                                    title={
                                        <span>
                                            <Clock size={18} style={{ marginRight: 8 }} />
                                            Phân bố theo giờ
                                        </span>
                                    }
                                    style={{ borderRadius: 12 }}
                                >
                                    <div style={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={byHour}>
                                                <defs>
                                                    <linearGradient
                                                        id="hourFill"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor="#1677ff"
                                                            stopOpacity={0.35}
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor="#1677ff"
                                                            stopOpacity={0.05}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="hour" />
                                                <YAxis allowDecimals={false} />
                                                <RechartsTooltip />
                                                <Area
                                                    dataKey="count"
                                                    stroke="#1677ff"
                                                    fill="url(#hourFill)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* Controls Section */}
                    <div style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ marginBottom: 16, color: '#124170' }}>
                            <CommentOutlined style={{ marginRight: 8, color: '#67C090' }} />
                            Quản lý dữ liệu
                        </Title>

                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} sm={24} md={16} lg={18}>
                                <Space wrap size="middle">
                                    <Button
                                        type="primary"
                                        icon={<ReloadOutlined />}
                                        onClick={handleRefresh}
                                        loading={loading || tableLoading}
                                        size="middle"
                                        style={{
                                            borderRadius: 8,
                                            fontWeight: 500,
                                            boxShadow: '0 2px 4px rgba(103, 192, 144, 0.2)',
                                            background:
                                                'linear-gradient(135deg, #67C090 0%, #26667F 100%)',
                                            border: 'none',
                                        }}
                                    >
                                        <span className="hidden-xs">Làm mới dữ liệu</span>
                                        <span className="visible-xs">Làm mới</span>
                                    </Button>

                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        <Button
                                            type={viewMode === 'sessions' ? 'primary' : 'default'}
                                            icon={<AppstoreOutlined />}
                                            onClick={() => setViewMode('sessions')}
                                            style={{
                                                borderRadius: 0,
                                                fontWeight: 500,
                                                borderRight:
                                                    viewMode === 'sessions'
                                                        ? 'none'
                                                        : '1px solid #d9d9d9',
                                            }}
                                        >
                                            <span className="hidden-xs">Theo Session</span>
                                            <span className="visible-xs">Session</span>
                                        </Button>
                                        <Button
                                            type={viewMode === 'messages' ? 'primary' : 'default'}
                                            icon={<UnorderedListOutlined />}
                                            onClick={() => setViewMode('messages')}
                                            style={{
                                                borderRadius: 0,
                                                fontWeight: 500,
                                                borderLeft:
                                                    viewMode === 'messages'
                                                        ? 'none'
                                                        : '1px solid #d9d9d9',
                                            }}
                                        >
                                            <span className="hidden-xs">Theo Tin nhắn</span>
                                            <span className="visible-xs">Tin nhắn</span>
                                        </Button>
                                    </div>

                                    <Badge
                                        count={
                                            viewMode === 'sessions'
                                                ? filteredSessions.length
                                                : filteredMessages.length
                                        }
                                        style={{ backgroundColor: '#67C090' }}
                                    >
                                        <Button
                                            size="middle"
                                            style={{
                                                borderRadius: 8,
                                                fontWeight: 500,
                                                background: '#DDF4E7',
                                                borderColor: '#67C090',
                                                color: '#124170',
                                            }}
                                        >
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
                                    enterButton={<SearchOutlined />}
                                    size="middle"
                                    style={{
                                        width: '100%',
                                        borderRadius: 8,
                                    }}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </Col>
                        </Row>
                    </div>

                    {/* Data Table Section */}
                    <div
                        style={{
                            background: '#fafafa',
                            padding: '20px',
                            borderRadius: 12,
                            border: '1px solid #f0f0f0',
                        }}
                    >
                        <Title level={5} style={{ marginBottom: 16, color: '#124170' }}>
                            <UnorderedListOutlined style={{ marginRight: 8, color: '#67C090' }} />
                            {viewMode === 'sessions' ? 'Danh sách Session' : 'Danh sách Tin nhắn'}
                        </Title>

                        <Spin spinning={loading || tableLoading} tip="Đang tải..." size="large">
                            {viewMode === 'sessions' ? (
                                filteredSessions.length > 0 ? (
                                    <Table
                                        columns={sessionColumns}
                                        dataSource={filteredSessions}
                                        rowKey="sessionId"
                                        pagination={{
                                            pageSize: 10,
                                            showSizeChanger: true,
                                            showQuickJumper: true,
                                            showTotal: (total, range) => (
                                                <span style={{ color: '#666', fontSize: '14px' }}>
                                                    {`${range[0]}-${range[1]} của ${total} session`}
                                                </span>
                                            ),
                                            size: 'default',
                                            style: { marginTop: 16 },
                                        }}
                                        scroll={{ x: 1000, y: 400 }}
                                        bordered={false}
                                        size="small"
                                        className="modern-table"
                                        style={{
                                            background: '#fff',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                        }}
                                    />
                                ) : (
                                    <Empty
                                        description="Không có dữ liệu session nào"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        style={{ padding: '40px 0' }}
                                    />
                                )
                            ) : filteredMessages.length > 0 ? (
                                <Table
                                    columns={columns}
                                    dataSource={filteredMessages}
                                    rowKey="id"
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) => (
                                            <span style={{ color: '#666', fontSize: '14px' }}>
                                                {`${range[0]}-${range[1]} của ${total} tin nhắn`}
                                            </span>
                                        ),
                                        size: 'default',
                                        style: { marginTop: 16 },
                                    }}
                                    scroll={{ x: 800, y: 400 }}
                                    bordered={false}
                                    size="small"
                                    rowClassName={(record) =>
                                        record.isUserMessage
                                            ? 'user-message-row'
                                            : 'bot-message-row'
                                    }
                                    className="modern-table"
                                    style={{
                                        background: '#fff',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                    }}
                                />
                            ) : (
                                <Empty
                                    description="Không có dữ liệu tin nhắn nào"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    style={{ padding: '40px 0' }}
                                />
                            )}
                        </Spin>
                    </div>
                </div>
            </Content>

            <Modal
                title={
                    <Space>
                        <MessageOutlined style={{ color: '#1890ff' }} />
                        <span style={{ fontWeight: 600 }}>Chi tiết Session</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button
                        key="close"
                        onClick={() => setIsModalVisible(false)}
                        style={{
                            borderRadius: 6,
                            fontWeight: 500,
                            minWidth: 80,
                        }}
                    >
                        Đóng
                    </Button>,
                ]}
                width="95%"
                style={{ maxWidth: 1600 }}
                bodyStyle={{ padding: '24px' }}
            >
                {selectedSession && (
                    <div>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={8}>
                                <Card
                                    size="small"
                                    title={
                                        <Space>
                                            <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                            <span style={{ fontWeight: 600 }}>
                                                Thông tin Session
                                            </span>
                                        </Space>
                                    }
                                    style={{ borderRadius: 8 }}
                                    headStyle={{
                                        background: '#fafafa',
                                        borderRadius: '8px 8px 0 0',
                                        fontWeight: 600,
                                    }}
                                >
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ color: '#262626' }}>
                                            Session ID:
                                        </Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text
                                                code
                                                style={{ fontSize: '12px', background: '#f5f5f5' }}
                                            >
                                                {selectedSession.sessionId}
                                            </Text>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ color: '#262626' }}>
                                            User ID:
                                        </Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Space>
                                                <Avatar size="small" icon={<UserOutlined />} />
                                                <Text>{selectedSession.userId}</Text>
                                            </Space>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ color: '#262626' }}>
                                            Số tin nhắn:
                                        </Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Badge
                                                count={selectedSession.messageCount}
                                                style={{ backgroundColor: '#52c41a' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ color: '#262626' }}>
                                            Thời gian bắt đầu:
                                        </Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text style={{ fontSize: '13px', color: '#666' }}>
                                                {convertToVietnamTime(
                                                    selectedSession.startTime
                                                ).toLocaleString('vi-VN')}
                                            </Text>
                                        </div>
                                    </div>

                                    <div>
                                        <Text strong style={{ color: '#262626' }}>
                                            Thời gian kết thúc:
                                        </Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text style={{ fontSize: '13px', color: '#666' }}>
                                                {convertToVietnamTime(
                                                    selectedSession.endTime
                                                ).toLocaleString('vi-VN')}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} md={16}>
                                <Card
                                    size="small"
                                    title={
                                        <Space>
                                            <UnorderedListOutlined style={{ color: '#1890ff' }} />
                                            <span style={{ fontWeight: 600 }}>
                                                Tất cả tin nhắn trong session
                                            </span>
                                        </Space>
                                    }
                                    style={{ borderRadius: 8 }}
                                    headStyle={{
                                        background: '#fafafa',
                                        borderRadius: '8px 8px 0 0',
                                        fontWeight: 600,
                                    }}
                                >
                                    <Table
                                        columns={columns}
                                        dataSource={selectedSession.messages}
                                        rowKey="id"
                                        loading={loading}
                                        pagination={false}
                                        scroll={{ x: 800, y: 400 }}
                                        bordered={false}
                                        size="small"
                                        rowClassName={(record) =>
                                            record.isUserMessage
                                                ? 'user-message-row'
                                                : 'bot-message-row'
                                        }
                                        style={{
                                            background: '#fff',
                                            borderRadius: 8,
                                        }}
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

// CSS Styles for enhanced UI
const styles = `
    .dashboard-layout .ant-table-thead > tr > th {
        background: #fafafa !important;
        font-weight: 600 !important;
        color: #262626 !important;
        border-bottom: 2px solid #f0f0f0 !important;
    }
    
    .dashboard-layout .ant-table-tbody > tr:hover > td {
        background: #f5f5f5 !important;
    }
    
    .dashboard-layout .user-message-row {
        background: #f6ffed !important;
    }
    
    .dashboard-layout .bot-message-row {
        background: #f0f9ff !important;
    }
    
    .dashboard-layout .modern-table .ant-table-tbody > tr > td {
        border-bottom: 1px solid #f0f0f0 !important;
        padding: 12px 16px !important;
    }
    
    .dashboard-layout .ant-card-hoverable:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    }
    
    .dashboard-layout .ant-statistic-title {
        font-size: 14px !important;
        font-weight: 500 !important;
        letter-spacing: 0.5px !important;
    }
    
    .dashboard-layout .ant-statistic-content {
        font-size: 28px !important;
        font-weight: 700 !important;
        letter-spacing: -0.5px !important;
    }
    
    .dashboard-layout .ant-btn-primary {
        background: linear-gradient(135deg, #67C090 0%, #26667F 100%) !important;
        border: none !important;
    }
    
    .dashboard-layout .ant-btn-primary:hover {
        background: linear-gradient(135deg, #26667F 0%, #124170 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(103, 192, 144, 0.3) !important;
    }
    
    
    .dashboard-layout .ant-badge-count {
        font-size: 12px !important;
        font-weight: 600 !important;
    }
    
    .dashboard-layout .ant-tag {
        border-radius: 6px !important;
        font-weight: 500 !important;
    }
    
    .dashboard-layout .ant-modal-header {
        border-bottom: 1px solid #f0f0f0 !important;
        padding: 16px 24px !important;
    }
    
    .dashboard-layout .ant-modal-body {
        padding: 24px !important;
    }
    
    .dashboard-layout .ant-pagination {
        margin-top: 16px !important;
    }
    
    .dashboard-layout .ant-pagination-item-active {
        background: #67C090 !important;
        border-color: #67C090 !important;
    }
    
    .dashboard-layout .ant-empty-description {
        color: #999 !important;
        font-size: 14px !important;
    }
    
    @media (max-width: 768px) {
        .dashboard-layout .ant-card {
            margin-bottom: 16px !important;
        }
        
        .dashboard-layout .ant-table {
            font-size: 12px !important;
        }
        
        .dashboard-layout .ant-statistic-content {
            font-size: 20px !important;
        }
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
