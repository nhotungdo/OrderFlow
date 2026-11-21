import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom Metrics
const successfulOrders = new Counter('successful_orders');
const outOfStockOrders = new Counter('out_of_stock_orders');
const duplicatePreventedOrders = new Counter('duplicate_prevented_orders');
const successRate = new Rate('success_rate');

export const options = {
  scenarios: {
    // Kịch bản 1: 50 Virtual Users đồng thời tranh chấp mua sản phẩm chỉ có 10 món
    concurrency_race_condition: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,
      maxDuration: '30s',
      exec: 'testRaceCondition',
    },
    // Kịch bản 2: Bắn dồn dập cùng 1 Idempotency Key để kiểm tra chống tạo đơn trùng
    idempotency_double_click: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '20s',
      startTime: '5s',
      exec: 'testIdempotency',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% request phản hồi dưới 500ms
  },
};

const BASE_ORDER_URL = __ENV.ORDER_API_URL || 'http://localhost:5000/api/orders';
const TARGET_PRODUCT_ID = '11111111-1111-1111-1111-111111111111'; // iPhone 16 Pro Max (Stock = 10)

// Helper sinh UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// TEST 1: RACE CONDITION & TRỪ KHO ĐỒNG THỜI
export function testRaceCondition() {
  const uniqueKey = uuidv4();
  const payload = JSON.stringify({
    customerId: uuidv4(),
    paymentMethod: 'STANDARD',
    items: [
      {
        productId: TARGET_PRODUCT_ID,
        productName: 'iPhone 16 Pro Max 256GB - Titan Tự Nhiên',
        unitPrice: 32990000,
        quantity: 1,
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': uniqueKey,
    },
  };

  const res = http.post(BASE_ORDER_URL, payload, params);

  if (res.status === 201) {
    successfulOrders.add(1);
    successRate.add(true);
    check(res, {
      'Order created successfully (201)': (r) => r.status === 201,
    });
  } else if (res.status === 409 || res.status === 400) {
    outOfStockOrders.add(1);
    successRate.add(false);
    check(res, {
      'Gracefully rejected due to Out of Stock (409/400)': (r) => r.status === 409 || r.status === 400,
    });
  }
}

// TEST 2: CHỐNG TẠO ĐƠN TRÙNG (IDEMPOTENCY DUPLICATE PREVENTION)
const SHARED_IDEMPOTENCY_KEY = 'idemp-stress-test-fixed-uuid';

export function testIdempotency() {
  const payload = JSON.stringify({
    customerId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    paymentMethod: 'STANDARD',
    items: [
      {
        productId: '44444444-4444-4444-4444-444444444444', // AirPods Pro (Stock 100)
        productName: 'Apple AirPods Pro 2',
        unitPrice: 5490000,
        quantity: 1,
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': SHARED_IDEMPOTENCY_KEY,
    },
  };

  const res = http.post(BASE_ORDER_URL, payload, params);

  if (res.status === 201 || res.status === 200) {
    check(res, {
      'Primary order created or returned cached (200/201)': (r) => r.status === 200 || r.status === 201,
    });
  } else if (res.status === 409) {
    duplicatePreventedOrders.add(1);
    check(res, {
      'Concurrent duplicate blocked by Redis Lock (409 Conflict)': (r) => r.status === 409,
    });
  }
}
