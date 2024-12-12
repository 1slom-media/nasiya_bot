import axios from 'axios';
import config from '../config/index.js';

const Billing_API = axios.create({
  baseURL: config.BILLING_URL,
});

export default Billing_API;