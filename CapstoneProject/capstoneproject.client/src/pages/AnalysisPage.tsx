import React from 'react';
import { Table, Tag } from 'antd';
import type { Key } from 'antd/es/table/interface';

interface User {
  key: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  status: 'active' | 'inactive';
}

const data: User[] = [
  {
    key: '1',
    name: 'Nguyễn Văn A',
    email: 'a.nguyen@example.com',
    phone: '0901234567',
    registeredAt: '2023-01-15',
    status: 'active',
  },
  {
    key: '2',
    name: 'Trần Thị B',
    email: 'b.tran@example.com',
    phone: '0912345678',
    registeredAt: '2023-02-20',
    status: 'inactive',
  },
  {
    key: '3',
    name: 'Lê Văn C',
    email: 'c.le@example.com',
    phone: '0923456789',
    registeredAt: '2023-03-10',
    status: 'active',
  },
];

const columns = [
  {
    title: 'Tên người dùng',
    dataIndex: 'name',
    key: 'name',
    sorter: (a: User, b: User) => a.name.localeCompare(b.name),
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    sorter: (a: User, b: User) => a.email.localeCompare(b.email),
  },
  {
    title: 'Số điện thoại',
    dataIndex: 'phone',
    key: 'phone',
    sorter: (a: User, b: User) => a.phone.localeCompare(b.phone),
  },
  {
    title: 'Ngày đăng ký',
    dataIndex: 'registeredAt',
    key: 'registeredAt',
    sorter: (a: User, b: User) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: 'Hoạt động', value: 'active' },
      { text: 'Khóa', value: 'inactive' },
    ],
    onFilter: (value: boolean | Key, record: User) => record.status === String(value),
    render: (status: 'active' | 'inactive') => (
      <Tag color={status === 'active' ? 'green' : 'volcano'}>
        {status === 'active' ? 'Hoạt động' : 'Khóa'}
      </Tag>
    ),
  },
];

const AnalysisPage: React.FC = () => {
  return (
    <div>
      <h1>Phân tích dữ liệu (Analysis)</h1>
      <p>Đây là trang hiển thị các phân tích dữ liệu của bạn.</p>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default AnalysisPage; 