import React from 'react';
import { Avatar, Dropdown, type MenuProps } from 'antd';

const items: MenuProps['items'] = [
    {
        label: (
            <a href="https://www.antgroup.com" target="_blank" rel="noopener noreferrer">
                1st menu item
            </a>
        ),
        key: '0',
    },
    {
        label: (
            <a href="https://www.aliyun.com" target="_blank" rel="noopener noreferrer">
                2nd menu item
            </a>
        ),
        key: '1',
    },
    {
        type: 'divider',
    },
    {
        label: '3rd menu item',
        key: '3',
    },
];

const AvatarDropdown: React.FC = () => (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']} arrow>
        <Avatar style={{ cursor: 'pointer' }}>HUY</Avatar>
    </Dropdown>
);

export default AvatarDropdown;
