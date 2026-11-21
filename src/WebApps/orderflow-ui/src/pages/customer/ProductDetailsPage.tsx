import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Database,
  Radio,
  Plus,
  Minus,
} from 'lucide-react';
import type { Product } from '../../types';
import { inventoryApi } from '../../api/inventoryApi';
import { useCart } from '../../contexts/CartContext';

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const loadProduct = async () => {
    if (!id) return;
    try {
      const data = await inventoryApi.getProductById(id);
      if (data) {
        setProduct(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    const interval = setInterval(loadProduct, 2500);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Loading product information...</div>;
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-400">Product not found.</p>
        <Link to="/products" className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.availableQuantity <= 0;
  const maxBuyable = Math.max(1, product.availableQuantity);

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Catalog</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8">
        {/* Product Image */}
        <div className="rounded-2xl bg-slate-800/80 overflow-hidden flex items-center justify-center p-6 border border-slate-700/50">
          <img
            src={
              product.imageUrl ||
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'
            }
            alt={product.productName}
            className="w-full max-h-96 object-contain rounded-xl shadow-2xl"
          />
        </div>

        {/* Product Information */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SKU: {product.sku}
              </span>
              <span className="text-xs font-medium text-blue-400">{product.category || 'Electronics'}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {product.productName}
            </h1>

            <div className="text-2xl font-black text-blue-400">
              ${product.unitPrice.toLocaleString()}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description ||
                'High performance flagship device equipped with the latest generation hardware, enterprise-grade distributed inventory lock support and rapid checkout guarantee.'}
            </p>

            {/* 2-Tier Real-Time Concurrency Inspector for CV showcase */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Live 2-Tier Stock Watch (Auto-polling 2.5s)</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    <span>Redis Cache:</span>
                  </div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    {product.redisStock} units
                  </div>
                  <div className="text-[10px] text-slate-500">Atomic Lua TTL 15m</div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span>PostgreSQL DB:</span>
                  </div>
                  <div className="text-base font-bold text-blue-400 font-mono">
                    {product.availableQuantity} / {product.totalQuantity}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Reserved: {product.reservedQuantity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Zone */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-400">Quantity:</span>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxBuyable, q + 1))}
                  disabled={quantity >= maxBuyable || isOutOfStock}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {isOutOfStock ? (
                  <span className="text-rose-400">Out of Stock</span>
                ) : (
                  `${product.availableQuantity} in stock`
                )}
              </span>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => addToCart(product, quantity)}
                disabled={isOutOfStock}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Overselling Guaranteed by Distributed Transaction Saga</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
