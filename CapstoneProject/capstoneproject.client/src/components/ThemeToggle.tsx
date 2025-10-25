import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@contexts/ThemeContext';
import { Switch } from 'antd';

export const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <Switch
            checked={isDarkMode}
            checkedChildren={<SunOutlined />}
            unCheckedChildren={<MoonOutlined />}
            onChange={toggleTheme}
        />
    );
};
