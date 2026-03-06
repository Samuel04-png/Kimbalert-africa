import React from 'react';
import { Package, Trash2, CheckCircle, Clock, Search } from 'lucide-react';
import { useAppContext } from '../../app/AppContext';
import { BraceletOrder } from '../../types';

export default function AdminOrdersPage() {
    const { orders, updateOrderStatus, children } = useAppContext();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filter, setFilter] = React.useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

    const filteredOrders = orders.filter((order) => {
        if (filter !== 'all' && order.status !== filter) return false;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            return (
                order.guardianName.toLowerCase().includes(lower) ||
                order.id.toLowerCase().includes(lower) ||
                order.phone.includes(lower)
            );
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-[#0b1220] px-4 pb-24 pt-4 text-slate-100 md:px-6 md:pb-8">
            <header className="rounded-[var(--r-xl)] border border-slate-700 bg-[var(--gradient-navy)] p-4 shadow-lg mb-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Administration</p>
                <h1 className="mt-1 font-display text-4xl font-bold">Bracelet Orders</h1>
            </header>

            <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-[var(--r-sm)] border border-slate-700 bg-[#111a2b] p-1">
                    {(['all', 'pending', 'shipped', 'delivered'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setFilter(tab)}
                            className={`rounded-[var(--r-sm)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${filter === tab ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b] py-2 pl-9 pr-4 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                </div>
            </section>

            <section className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-700 bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-300">Order ID & Date</th>
                                <th className="px-4 py-3 font-semibold text-slate-300">Guardian Info</th>
                                <th className="px-4 py-3 font-semibold text-slate-300">Delivery Address</th>
                                <th className="px-4 py-3 font-semibold text-slate-300">Qty</th>
                                <th className="px-4 py-3 font-semibold text-slate-300">Status</th>
                                <th className="px-4 py-3 font-semibold text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : null}
                            {filteredOrders.map((order) => {
                                const child = children.find(c => c.id === order.childId);
                                return (
                                    <tr key={order.id} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-[10px] text-slate-400">{order.id}</p>
                                            <p className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold">{order.guardianName}</p>
                                            <p className="text-xs text-slate-400">{order.phone}</p>
                                            <p className="text-[10px] text-brand-orange mt-1">Child: {child?.name || order.childId}</p>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <p className="truncate text-xs" title={order.address}>{order.address}</p>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">
                                            {order.quantity}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-[var(--r-pill)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${order.status === 'delivered' ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' :
                                                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                }`}>
                                                {order.status === 'pending' ? <Clock className="h-3 w-3" /> :
                                                    order.status === 'shipped' ? <Package className="h-3 w-3" /> :
                                                        <CheckCircle className="h-3 w-3" />}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                                        className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                                                    >
                                                        Mark Shipped
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                        className="rounded border border-brand-green/30 bg-brand-green/10 px-2 py-1 text-xs font-semibold text-brand-green hover:bg-brand-green/20"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
