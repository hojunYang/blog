import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000']
  }
};

export default function () {
  const response = http.get('https://hojunyang.xyz/score');

  check(response, {
    '200 응답': (r) => r.status === 200
  });

  sleep(3);
}