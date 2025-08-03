import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Button, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

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

  const columns: ColumnsType<ChatMessage> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
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
      width: 100,
      render: (isUser: boolean) => (
        <Tag color={isUser ? 'blue' : 'green'}>
          {isUser ? 'User' : 'ChatGPT'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setSelectedMessage(record);
              setIsModalVisible(true);
            }}
          >
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Dashboard - Quản lý Chat" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={fetchChatMessages} loading={loading}>
            Làm mới dữ liệu
          </Button>
          <span>Tổng số tin nhắn: {chatMessages.length}</span>
        </Space>
        
        <Table
          columns={columns}
          dataSource={chatMessages}
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
        />
      </Card>

      <Modal
        title="Chi tiết tin nhắn"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {selectedMessage && (
          <div>
            <p><strong>ID:</strong> {selectedMessage.id}</p>
            <p><strong>User ID:</strong> {selectedMessage.userId}</p>
            <p><strong>Loại:</strong> 
              <Tag color={selectedMessage.isUserMessage ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
                {selectedMessage.isUserMessage ? 'User' : 'ChatGPT'}
              </Tag>
            </p>
            <p><strong>Thời gian:</strong> {new Date(selectedMessage.timestamp).toLocaleString('vi-VN')}</p>
            <p><strong>Tin nhắn:</strong></p>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '6px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {selectedMessage.message}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage; 