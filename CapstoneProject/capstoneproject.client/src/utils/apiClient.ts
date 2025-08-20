import axios from 'axios';

axios.defaults.baseURL = 'https://localhost:5026/';
axios.defaults.timeout = 10000;

export default axios;
