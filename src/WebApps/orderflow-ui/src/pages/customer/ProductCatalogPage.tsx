import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Eye, RefreshCw, Zap } from 'lucide-react';
import type { Product } from '../../types';
import { inventoryApi } from '../../api/inventoryApi';
import { useCart } from '../../contexts/CartContext';

export const ProductCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [seeding, setSeeding] = useState(false);
  const { addToCart } = useCart();

  const loadProducts = async () => {
    try {
      const data = await inventoryApi.getProducts();
      setProducts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const interval = setInterval(loadProducts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    await inventoryApi.seedProducts();
    await loadProducts();
    setSeeding(false);
  };

  const categories = ['All', 'Phones', 'Laptops', 'Tablets', 'Audio'];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (selectedCategory === 'All') return matchSearch;
    return matchSearch && (p.category === selectedCategory || p.productName.toLowerCase().includes(selectedCategory.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6 md:p-8 overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium mb-3">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Real-time 2-Tier Stock Watch Enabled</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Distributed Catalog & Inventory
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Every product order is checked against <strong className="text-emerald-400">Redis In-Memory Reservations</strong> and verified with <strong className="text-blue-400">PostgreSQL Atomic Conditional Updates</strong> to guarantee zero overselling.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 relative z-10">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding...' : 'Seed Mock Products (10 & 25 Qty)'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or SKU..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Loading catalog items...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">No products found matching your search.</p>
          <button
            onClick={handleSeed}
            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium"
          >
            Seed Mock Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((prod) => {
            const isOutOfStock = prod.availableQuantity <= 0;
            const isLowStock = prod.availableQuantity > 0 && prod.availableQuantity <= 3;

            return (
              <div
                key={prod.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
              >
                <div>
                  {/* Image / Thumbnail placeholder */}
                  <div className="w-full h-44 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden relative mb-4">
                    <img
                      src={
                        prod.imageUrl ||
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60'
                      }
                      alt={prod.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-950/90 text-rose-300 border border-rose-800 text-[10px] font-bold uppercase tracking-wider">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-950/90 text-amber-300 border border-amber-800 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          Only {prod.availableQuantity} Left!
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          {prod.availableQuantity} Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SKU & Category */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span>{prod.sku}</span>
                    <span className="text-slate-400">{prod.category || 'Electronics'}</span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition">
                    <Link to={`/products/${prod.id}`}>{prod.productName}</Link>
                  </h3>
                </div>

                <div>
                  {/* Price & Concurrency Stats */}
                  <div className="pt-3 border-t border-slate-800/80 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Unit Price</span>
                      <span className="text-lg font-black text-white">
                        ${prod.unitPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right text-[10px] font-mono">
                      <span className="text-slate-400 block">Redis Cache:</span>
                      <span className="text-emerald-400 font-semibold">{prod.redisStock} units</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Link
                      to={`/products/${prod.id}`}
                      className="col-span-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition border border-slate-700/60"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => addToCart(prod, 1)}
                      disabled={isOutOfStock}
                      className="col-span-3 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-600/20"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
