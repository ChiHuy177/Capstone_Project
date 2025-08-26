import { BrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import RoutesApp from './routes';
import { ConfigProvider } from 'antd';

function App() {
    return (
        <ConfigProvider>
            <BrowserRouter>
                <Layout>
                    <RoutesApp />
                </Layout>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;
