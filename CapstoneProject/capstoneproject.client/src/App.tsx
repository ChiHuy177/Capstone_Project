import { BrowserRouter } from 'react-router-dom';
import 'antd/dist/reset.css';
import RoutesApp from './routes';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/Auth/AuthContext';
import UEHChatbot from './pages/Client/Chat/Chat';



function App() {
    return (
        <AuthProvider>
            <ConfigProvider>
                <BrowserRouter>
                    <RoutesApp />
                </BrowserRouter>
            </ConfigProvider>
        </AuthProvider>
        // <UEHChatbot/>
    );
}

export default App;
