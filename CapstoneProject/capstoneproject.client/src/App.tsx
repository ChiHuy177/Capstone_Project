
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import RoutesApp from './routes';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <RoutesApp />
      </Layout>
    </BrowserRouter>
  );
}

export default App;
