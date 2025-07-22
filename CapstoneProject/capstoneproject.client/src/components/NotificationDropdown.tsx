import React from 'react';
import { List } from 'antd';

const notificationData = [
  { title: 'Thông báo 1', description: 'Nội dung thông báo 1' },
  { title: 'Thông báo 2', description: 'Nội dung thông báo 2' },
  { title: 'Thông báo 3', description: 'Nội dung thông báo 3' },
];

const NotificationDropdown: React.FC = () => (
  <div style={{ width: 300, maxWidth: '80vw' }}>
    <List
      itemLayout="horizontal"
      dataSource={notificationData}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta title={item.title} description={item.description} />
        </List.Item>
      )}
    />
  </div>
);

export default NotificationDropdown; 