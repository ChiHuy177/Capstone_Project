import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Tag, Space, Button, Modal, message, 
  Layout, Typography, Breadcrumb, Row, Col, Statistic, 
  Input, Badge, Divider, Tooltip, Avatar
} from 'antd';
import { 
  ReloadOutlined, 
  MessageOutlined, 
  UserOutlined, 
  RobotOutlined,
  SearchOutlined,
  CalendarOutlined,
  HomeOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface ChatMessage {
  id: number;
  userId: string;
  message: string;
  isUserMessage: boolean;
  timestamp: string;
  sessionId?: string;
}

const DashboardPage: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const fetchChatMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://localhost:5026/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      } else {
        message.error('Không thể tải dữ liệu chat');
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      message.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatMessages();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchChatMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tính toán số liệu thống kê
  const userMessages = chatMessages.filter(msg => msg.isUserMessage);
  const botMessages = chatMessages.filter(msg => !msg.isUserMessage);
  const uniqueUsers = [...new Set(chatMessages.map(msg => msg.userId))].length;
  
  // Lọc tin nhắn theo từ khóa tìm kiếm
  const filteredMessages = searchText
    ? chatMessages.filter(msg => 
        msg.message.toLowerCase().includes(searchText.toLowerCase()) ||
        msg.userId.toLowerCase().includes(searchText.toLowerCase())
      )
    : chatMessages;

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
      filterSearch: true,
      filters: [...new Set(chatMessages.map(msg => msg.userId))].map(userId => ({
        text: userId,
        value: userId,
      })),
      onFilter: (value, record) => record.userId === value,
      render: (userId) => (
        <Tooltip title={userId}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text ellipsis style={{ maxWidth: 120 }}>{userId}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Tin nhắn',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text: string) => (
        <div style={{ maxWidth: 300, wordBreak: 'break-word' }}>
          {text.length > 100 ? `${text.substring(0, 100)}...` : text}
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'isUserMessage',
      key: 'isUserMessage',
      width: 120,
      filters: [
        { text: 'User', value: true },
        { text: 'ChatGPT', value: false },
      ],
      onFilter: (value, record) => record.isUserMessage === value,
      render: (isUser: boolean) => (
        <Tag color={isUser ? 'blue' : 'green'} icon={isUser ? <UserOutlined /> : <RobotOutlined />}>
          {isUser ? 'User' : 'ChatGPT'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
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
              setSelectedMessage(record);
              setIsModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
        </Space>
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
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            <DashboardOutlined /> Hệ thống quản lý Chat
          </Title>
        </div>
      </Header>
      
      <Content style={{ padding: '0 24px', margin: '16px 0' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined /> Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <DashboardOutlined /> Dashboard
          </Breadcrumb.Item>
        </Breadcrumb>
        
        <div style={{ background: '#fff', padding: 24, minHeight: 360, borderRadius: 4 }}>
          <Row gutter={[16, 24]}>
            <Col xs={24} sm={8}>
              <Card bordered={false} hoverable>
                <Statistic 
                  title="Tổng tin nhắn" 
                  value={chatMessages.length} 
                  prefix={<MessageOutlined />} 
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} hoverable>
                <Statistic 
                  title="Tin nhắn người dùng" 
                  value={userMessages.length} 
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} hoverable>
                <Statistic 
                  title="Tin nhắn ChatGPT" 
                  value={botMessages.length} 
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} hoverable>
                <Statistic 
                  title="Số người dùng" 
                  value={uniqueUsers} 
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={fetchChatMessages} 
                loading={loading}
              >
                Làm mới dữ liệu
              </Button>
              <Badge count={filteredMessages.length}>
                <Button>Tổng số tin nhắn hiển thị</Button>
              </Badge>
            </Space>
            
            <Search
              placeholder="Tìm kiếm tin nhắn hoặc user ID"
              allowClear
              enterButton
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredMessages}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} tin nhắn`,
            }}
            scroll={{ x: 800 }}
            bordered
            size="middle"
            rowClassName={(record) => record.isUserMessage ? 'user-message-row' : 'bot-message-row'}
          />
        </div>
      </Content>
      
      <Modal
        title={
          <Space>
            <MessageOutlined />
            <span>Chi tiết tin nhắn</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        centered
      >
        {selectedMessage && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Thông tin cơ bản">
                  <p><strong>ID:</strong> {selectedMessage.id}</p>
                  <p>
                    <strong>User ID:</strong> 
                    <Space style={{ marginLeft: 8 }}>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {selectedMessage.userId}
                    </Space>
                  </p>
                  <p>
                    <strong>Loại:</strong> 
                    <Tag 
                      color={selectedMessage.isUserMessage ? 'blue' : 'green'} 
                      style={{ marginLeft: 8 }}
                      icon={selectedMessage.isUserMessage ? <UserOutlined /> : <RobotOutlined />}
                    >
                      {selectedMessage.isUserMessage ? 'User' : 'ChatGPT'}
                    </Tag>
                  </p>
                  {selectedMessage.sessionId && (
                    <p><strong>Session ID:</strong> {selectedMessage.sessionId}</p>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Thời gian">
                  <p><strong>Thời gian tạo:</strong></p>
                  <p>
                    <CalendarOutlined /> {convertToVietnamTime(selectedMessage.timestamp).toLocaleDateString('vi-VN')}
                  </p>
                  <p>
                    <CalendarOutlined /> {convertToVietnamTime(selectedMessage.timestamp).toLocaleTimeString('vi-VN')}
                  </p>
                </Card>
              </Col>
            </Row>
            
            <Card 
              title="Nội dung tin nhắn" 
              style={{ marginTop: 16 }}
              className={selectedMessage.isUserMessage ? 'user-message-card' : 'bot-message-card'}
              bordered
            >
              <div style={{ 
                background: selectedMessage.isUserMessage ? '#f0f8ff' : '#f6ffed', 
                padding: '16px', 
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                border: `1px solid ${selectedMessage.isUserMessage ? '#91caff' : '#b7eb8f'}`
              }}>
                <Paragraph>{selectedMessage.message}</Paragraph>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default DashboardPage; 