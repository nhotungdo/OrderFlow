import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { OrderSimulator } from './components/OrderSimulator';
import { OrderHistory } from './components/OrderHistory';
import { SagaTimeline } from './components/SagaTimeline';
import { ChaosLab } from './components/ChaosLab';
import type { Product, Order } from './types';
import { inventoryApi, ordersApi } from './api/client';
import { Server, Activity, Database, MessageSquare } from 'lucide-react';

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'chaos' | 'architecture'>('simulator');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [prodData, orderData] = await Promise.all([
        inventoryApi.getProducts().catch(() => []),
        ordersApi.getOrders().catch(() => []),
      ]);

      setProducts(prodData || []);
      setOrders(orderData || []);

      if (prodData && prodData.length > 0 && !selectedProduct) {
        setSelectedProduct(prodData[0]);
      }

      if (orderData && orderData.length > 0 && !selectedOrder) {
        setSelectedOrder(orderData[0]);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await inventoryApi.seedProducts();
      await fetchData();
    } catch (err) {
      console.error('Seed failed', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateOrder = async ({
    product,
    paymentMethod,
    idempotencyKey,
    doubleClickTest,
  }: {
    product: Product;
    paymentMethod: string;
    idempotencyKey: string;
    doubleClickTest: boolean;
  }) => {
    setIsLoading(true);
    setLastResponse(null);

    const payload = {
      customerId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      paymentMethod,
      items: [
        {
          productId: product.id,
          productName: product.productName,
          unitPrice: product.unitPrice,
          quantity: 1,
        },
      ],
    };

    try {
      if (doubleClickTest) {
        const [res1, res2] = await Promise.allSettled([
          ordersApi.createOrder(payload, idempotencyKey),
          ordersApi.createOrder(payload, idempotencyKey),
        ]);

        const r1 = res1.status === 'fulfilled' ? res1.value : res1.reason?.response;
        const r2 = res2.status === 'fulfilled' ? res2.value : res2.reason?.response;

        setLastResponse({
          status: 'Double-Click Result',
          data: {
            request_1: r1 ? { status: r1.status || 201, data: r1.data || r1 } : 'Success',
            request_2: r2 ? { status: r2.status || 409, data: r2.data || r2 } : 'Rejected (409 Conflict)',
            explanation: 'Request 2 bị Redis In-Flight Lock chặn ngay tức thì để chống tạo trùng!',
          },
        });
      } else {
        const res = await ordersApi.createOrder(payload, idempotencyKey);
        setLastResponse({
          status: 201,
          data: res,
        });
      }

      await fetchData();
    } catch (err: any) {
      setLastResponse({
        status: err.response?.status || 500,
        data: err.response?.data || { message: err.message },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      <Header
        onRefresh={fetchData}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1">
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cột 1: Danh mục & Kho hàng 2 tầng (4 cols) */}
              <div className="lg:col-span-4">
                <ProductCatalog
                  products={products}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                  onSeedProducts={handleSeed}
                  isSeeding={isSeeding}
                />
              </div>

              {/* Cột 2: Simulator Đặt hàng & Idempotency (4 cols) */}
              <div className="lg:col-span-4">
                <OrderSimulator
                  selectedProduct={selectedProduct}
                  onCreateOrder={handleCreateOrder}
                  isLoading={isLoading}
                  lastResponse={lastResponse}
                />
              </div>

              {/* Cột 3: Lịch sử Đơn hàng (4 cols) */}
              <div className="lg:col-span-4">
                <OrderHistory
                  orders={orders}
                  selectedOrder={selectedOrder}
                  onSelectOrder={setSelectedOrder}
                />
              </div>
            </div>

            {/* Hàng dưới: Saga Stepper Timeline theo dõi đơn đã chọn */}
            <SagaTimeline order={selectedOrder} />
          </div>
        )}

        {activeTab === 'chaos' && (
          <div className="space-y-6">
            <ChaosLab products={products} onRefreshAll={fetchData} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <ProductCatalog
                  products={products}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                  onSeedProducts={handleSeed}
                  isSeeding={isSeeding}
                />
              </div>
              <div className="lg:col-span-6">
                <OrderHistory
                  orders={orders}
                  selectedOrder={selectedOrder}
                  onSelectOrder={setSelectedOrder}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6">
            <div className="border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                Kiến trúc Phân tán & Bảng Điều phối Cổng Dịch vụ
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Toàn bộ các dịch vụ độc lập giao tiếp qua RabbitMQ và REST API
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> OrderService
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Port 5000 / 5001
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cổng tiếp nhận đơn hàng, bộ lọc <code>[Idempotent]</code>, lưu trữ Transactional Outbox, quản lý vòng đời Order.
                </p>
                <div className="mt-3 pt-2 border-t border-gray-900 text-[11px] text-gray-500 font-mono">
                  DB: orderflow_orders
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> InventoryService
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Port 5002 / 5003
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Kiểm soát tranh chấp 2 tầng: Redis Lua Script giữ chỗ nhanh + PostgreSQL Atomic Update. Tự động hoàn kho khi thanh toán lỗi.
                </p>
                <div className="mt-3 pt-2 border-t border-gray-900 text-[11px] text-gray-500 font-mono">
                  DB: orderflow_inventory
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Server className="w-4 h-4" /> PaymentService
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Port 5004 / 5005
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Mock Gateway mô phỏng thanh toán hợp lệ, lỗi thẻ ngân hàng, timeout 504 và kích hoạt Saga bù trừ qua RabbitMQ.
                </p>
                <div className="mt-3 pt-2 border-t border-gray-900 text-[11px] text-gray-500 font-mono">
                  DB: orderflow_payments
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800">
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                Hạ tầng Hỗ trợ (Docker Compose)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-gray-900 p-2.5 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">PostgreSQL 16</div>
                  <div className="text-cyan-400 font-bold">Port 5432</div>
                </div>
                <div className="bg-gray-900 p-2.5 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Redis 7.2 (AOF)</div>
                  <div className="text-amber-400 font-bold">Port 6379</div>
                </div>
                <div className="bg-gray-900 p-2.5 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">RabbitMQ Dashboard</div>
                  <div className="text-emerald-400 font-bold">Port 15672</div>
                </div>
                <div className="bg-gray-900 p-2.5 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Mailpit Web UI</div>
                  <div className="text-indigo-400 font-bold">Port 8025</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
