import React from 'react';
import { Layout, Menu } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    VideoCameraOutlined,
    DashboardOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AvatarDropdown from '../components/AvatarDropdown';
import { NavLink, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

type DashboardLayoutProps = object;

const items: MenuProps['items'] = [
    {
        key: '1',
        icon: <DashboardOutlined />,
        label: <NavLink to="/">Dashboard</NavLink>,
    },
    {
        key: '2',
        icon: <VideoCameraOutlined />,
        label: <NavLink to="/configure">Configure</NavLink>,
    },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    background: '#174168',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1000,
                    overflow: 'auto',
                    height: '100vh',
                }}
            >
                <div
                    style={{
                        height: 32,
                        margin: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {collapsed ? (
                        <img src="/EIU_Logo_Square.png" style={{ height: 32 }} alt="EIU Logo" />
                    ) : (
                        <img src="/EIU_Logo.png" style={{ height: 32 }} alt="EIU Logo" />
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    items={items}
                    style={{ background: '#174168' }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
                <Header
                    style={{
                        padding: 0,
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        left: collapsed ? 80 : 200,
                        zIndex: 999,
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                        <AvatarDropdown />
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '88px 16px 24px 16px',
                        padding: 24,
                        background: '#fff',
                        minHeight: 280,
                        transition: 'margin-left 0.2s',
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;
