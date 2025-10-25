import { BrowserRouter } from 'react-router-dom';
import 'antd/dist/reset.css';
import RoutesApp from './routes';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './contexts/Auth/AuthContext';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
// import AntdServerClock from '@components/TimeClock';

const AppContent = () => {
    const { isDarkMode } = useTheme();

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            <AuthProvider>
                <ConfigProvider>
                    <BrowserRouter>
                        <RoutesApp />
                    </BrowserRouter>
                </ConfigProvider>
            </AuthProvider>
        </ConfigProvider>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
        // <AuthProvider>
        //     <ConfigProvider>
        //         <BrowserRouter>
        //             <RoutesApp />
        //         </BrowserRouter>
        //     </ConfigProvider>
        // </AuthProvider>
        // <AntdServerClock apiUrl='https://localhost:5026/api/Time/now' timeZone='Asia/Ho_Chi_Minh' hour12={false} showSeconds/>
    );
}

export default App;
