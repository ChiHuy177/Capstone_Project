import React from 'react';
import { Avatar, Dropdown, type MenuProps } from 'antd';
import { useAuth } from '../contexts/Auth/AuthContext';

const AvatarDropdown: React.FC = () => {
    const { logout } = useAuth();

    const items: MenuProps['items'] = [
        {
            label: 'Đăng xuất',
            key: '3',
            onClick: async () => {
                await logout();
            },
        },
    ];
    return (
        <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']} arrow>
            <Avatar
                style={{ cursor: 'pointer' }}
                src="https://api.dicebear.com/7.x/miniavs/svg?seed=3"
            />
        </Dropdown>
    );
};

export default AvatarDropdown;
