import React from 'react';
import { Layout, Menu } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    VideoCameraOutlined,

} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AvatarDropdown from '../components/AvatarDropdown';
import { NavLink } from 'react-router-dom';


const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const items: MenuProps['items'] = [
    {
        key: '1',
        icon: <UserOutlined />,
        // label: <a href="/index">Analystics</a>
        label: <NavLink to='/'>Analystics</NavLink>
    },
    {
        key: '2',
        icon: <VideoCameraOutlined />,
        // label: <a href="/configure">Configure</a>,
        label: <NavLink to='/configure'>Configure</NavLink>
    },
    
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.3)' }} />
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={items} />
            </Sider>
            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger',
                            style: { padding: '0 24px', fontSize: 20, cursor: 'pointer' },
                            onClick: () => setCollapsed(!collapsed),
                        })}
                        <span style={{ fontWeight: 'bold', fontSize: 18 }}> Dashboard </span>
                    </div>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 24, paddingRight: 24 }}
                    >
                        <AvatarDropdown/>
                    </div>
                </Header>
                <Content
                    style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;
