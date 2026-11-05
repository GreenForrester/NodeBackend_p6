import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = { vus: 1, duration: '3m', thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<200'], checks: ['rate>0.99'] } };
export default function () {
  const result = http.get(`${__ENV.BASE_URL || 'http://localhost:3000'}/v1/api/customers?limit=20`, { headers: { 'x-api-key': __ENV.API_READ_KEY } });
  check(result, { 'status is 200': r => r.status === 200 });
  sleep(1);
}
