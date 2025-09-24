import { BrowserRouter } from 'react-router-dom';
import 'antd/dist/reset.css';
import RoutesApp from './routes';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/Auth/AuthContext';
import AntdServerClock from '@components/TimeClock';




function App() {
    return (
        <AuthProvider>
            <ConfigProvider>
                <BrowserRouter>
                    <RoutesApp />
                </BrowserRouter>
            </ConfigProvider>
        </AuthProvider>
        // <AntdServerClock apiUrl='https://localhost:5026/api/Time/now' timeZone='Asia/Ho_Chi_Minh' hour12={false} showSeconds/>
    );
}

export default App;
