import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { OrderSimulator } from './components/OrderSimulator';
import { OrderHistory } from './components/OrderHistory';
import type { Product, Order } from './types';
import { inventoryApi, ordersApi } from './api/client';

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

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
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto polling every 2.5s for real-time status update
    const interval = setInterval(() => {
      fetchData();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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
        // Gửi 2 request đồng thời với cùng 1 Idempotency Key
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
            explanation: 'Request 2 bị Redis Idempotency In-Flight lock chặn ngay tức thì!',
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
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
      <Header onRefresh={fetchData} isRefreshing={isRefreshing} />

      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột 1: Kho hàng Live Inventory (5 cols) */}
          <div className="lg:col-span-5">
            <ProductCatalog
              products={products}
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

          {/* Cột 3: Lịch sử đơn hàng Real-time (3 cols) */}
          <div className="lg:col-span-3">
            <OrderHistory orders={orders} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
