import React from 'react';
import type { Product } from '../types';
import { Database, Zap, ShoppingCart, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
  onSeedProducts: () => void;
  isSeeding: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
  onSeedProducts,
  isSeeding,
}) => {
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Live Inventory (2-Tier Watcher)
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Đồng bộ theo thời gian thực giữa <span className="text-amber-400 font-medium">Redis Lua Cache</span> và{' '}
            <span className="text-emerald-400 font-medium">PostgreSQL ACID</span>
          </p>
        </div>

        <button
          onClick={onSeedProducts}
          disabled={isSeeding}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isSeeding ? 'Đang nạp...' : 'Seed Data Kho'}
        </button>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="text-center py-10 bg-gray-950/40 rounded-xl border border-dashed border-gray-800 text-gray-400 text-xs">
            Kho hàng hiện đang trống. Nhấn nút <strong>Seed Data Kho</strong> ở trên để nạp các sản phẩm mẫu!
          </div>
        ) : (
          products.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            const isOutOfStock = p.availableQuantity <= 0;
            const isLowStock = p.availableQuantity > 0 && p.availableQuantity <= 5;

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && onSelectProduct(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : isOutOfStock
                    ? 'bg-gray-950/40 border-gray-800/60 opacity-60 cursor-not-allowed'
                    : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                        {p.sku}
                      </span>

                      {isOutOfStock ? (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Hết hàng
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Sắp hết
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Sẵn sàng
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-semibold text-white mt-1.5 line-clamp-1">
                      {p.productName}
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {p.unitPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* 2-Tier Concurrency Indicator */}
                <div className="grid grid-cols-3 gap-2 my-2 text-center">
                  <div className="bg-gray-900/90 p-2 rounded-lg border border-gray-800/80">
                    <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
                      <Zap className="w-3 h-3 text-amber-400" /> Redis Cache
                    </div>
                    <div className="text-sm font-bold font-mono text-amber-300">
                      {p.redisStock}
                    </div>
                  </div>

                  <div className="bg-gray-900/90 p-2 rounded-lg border border-gray-800/80">
                    <div className="text-[10px] text-gray-400 mb-0.5">DB Available</div>
                    <div className={`text-sm font-bold font-mono ${p.availableQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.availableQuantity}
                    </div>
                  </div>

                  <div className="bg-gray-900/90 p-2 rounded-lg border border-gray-800/80">
                    <div className="text-[10px] text-gray-400 mb-0.5">Reserved (TTL)</div>
                    <div className="text-sm font-bold font-mono text-cyan-400">
                      {p.reservedQuantity}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-gray-400">
                    Tổng kho: <span className="font-mono font-medium text-gray-200">{p.totalQuantity}</span>
                  </span>

                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      isSelected ? 'text-cyan-400 font-bold' : isOutOfStock ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isSelected ? 'Đang chọn mua' : isOutOfStock ? 'Không thể đặt' : 'Bấm để chọn'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
