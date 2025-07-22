import React from 'react';
import { Menu } from 'antd';
import {
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const items: MenuProps['items'] = [
  {
    key: '1',
    icon: <UserOutlined />,
    label: 'Người dùng',
  },
  {
    key: '2',
    icon: <VideoCameraOutlined />,
    label: 'Video',
  },
  {
    key: '3',
    icon: <UploadOutlined />,
    label: 'Tải lên',
  },
];

interface SidebarMenuProps {
  selectedKeys?: string[];
  onClick?: MenuProps['onClick'];
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ selectedKeys = ['1'], onClick }) => (
  <Menu
    theme="dark"
    mode="inline"
    defaultSelectedKeys={['1']}
    selectedKeys={selectedKeys}
    items={items}
    onClick={onClick}
  />
);

export default SidebarMenu; 