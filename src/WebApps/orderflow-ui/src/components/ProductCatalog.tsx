import React from 'react';
import type { Product } from '../types';
import { Database, Zap, ShoppingCart } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSeedProducts: () => void;
  isSeeding: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  onSeedProducts,
  isSeeding,
}) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Live Inventory & 2-Tier Stock Watch
          </h2>
          <p className="text-xs text-gray-400">
            Synchronized across Redis Lua Cache (Fast) and PostgreSQL (ACID)
          </p>
        </div>

        {products.length === 0 && (
          <button
            onClick={onSeedProducts}
            disabled={isSeeding}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50"
          >
            {isSeeding ? 'Seeding...' : 'Seed Sample Products'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {products.map((p) => {
          const isOutOfStock = p.availableQuantity <= 0;
          return (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition-all ${
                isOutOfStock
                  ? 'bg-red-950/20 border-red-900/40 opacity-75'
                  : 'bg-gray-800/40 border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/80'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {p.sku}
                  </span>
                  <h3 className="text-sm font-medium text-white mt-1.5 line-clamp-1">
                    {p.productName}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {p.unitPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* 2-Tier Stock Display */}
              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                  <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Redis Cache
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-300">
                    {p.redisStock}
                  </div>
                </div>

                <div className="bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                  <div className="text-[10px] text-gray-400">DB Available</div>
                  <div className={`text-sm font-bold font-mono ${p.availableQuantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.availableQuantity}
                  </div>
                </div>

                <div className="bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                  <div className="text-[10px] text-gray-400">Reserved</div>
                  <div className="text-sm font-bold font-mono text-cyan-400">
                    {p.reservedQuantity}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectProduct(p)}
                disabled={isOutOfStock}
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  isOutOfStock
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 cursor-pointer'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {isOutOfStock ? 'Hết hàng (Out of Stock)' : 'Chọn mua (Test Concurrency)'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
