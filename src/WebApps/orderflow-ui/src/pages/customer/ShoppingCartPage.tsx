import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export const ShoppingCartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-400 mt-2">
          Add items from our distributed catalog to test high-concurrency order creation.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review your items before generating a unique Idempotency Key
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items Table */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img
                  src={
                    item.product.imageUrl ||
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=60'
                  }
                  alt={item.product.productName}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-800 shrink-0"
                />
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">{item.product.sku}</div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">
                    {item.product.productName}
                  </h3>
                  <div className="text-xs text-blue-400 font-semibold mt-1">
                    ${item.product.unitPrice.toLocaleString()} each
                  </div>
                </div>
              </div>

              {/* Quantity controller & actions */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-black text-white font-mono">
                    ${(item.product.unitPrice * item.quantity).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Items</span>
                <span className="font-mono text-white font-semibold">{totalItems}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-white font-semibold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping (Express Microservice)</span>
                <span className="font-mono text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-sm">
                <span className="font-bold text-white">Estimated Total</span>
                <span className="font-black text-blue-400 font-mono text-base">
                  ${subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected by X-Idempotency-Key Filter</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
