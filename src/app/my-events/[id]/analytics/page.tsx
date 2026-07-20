"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, TrendingUp, DollarSign, Ticket, PackageOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getEvent, getTicketTiers, TicketTier } from "@/lib/events";
import { ReservationData, EventData } from "@/types";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]; 

export default function AnalyticsDashboard() {
  const params = useParams();
  const rawId = params.id as string;
  // Extract event ID if it is a slug
  const eventId = rawId.includes("-") ? rawId.split("-").pop()! : rawId;

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [event, tiers] = await Promise.all([
          getEvent(eventId),
          getTicketTiers(eventId),
        ]);
        
        setEventData(event);
        setTicketTiers(tiers);

        // Fetch reservations for CSV & Time Series
        const resRef = collection(db, `events/${eventId}/reservations`);
        const resSnap = await getDocs(resRef);
        const resData = resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReservationData));
        setReservations(resData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const handleExportCSV = () => {
    if (!reservations.length) return alert("No reservations to export.");

    const headers = ["Reservation ID", "User ID", "Status", "Total Amount ($)", "Items (Tier, Qty)", "Created At"];
    const rows = reservations.map((res) => {
      const itemsStr = res.items.map(i => `${i.name} x${i.quantity}`).join("; ");
      const dateStr = res.createdAt ? new Date(res.createdAt).toISOString() : "";
      return [
        res.id,
        res.userId,
        res.status,
        res.totalAmount,
        `"${itemsStr}"`, 
        dateStr
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_${eventId}_sales.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0e] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // --- Calculations ---
  const totalTicketsSold = ticketTiers.reduce((acc, tier) => acc + tier.sold, 0);
  const totalGrossRevenue = ticketTiers.reduce((acc, tier) => acc + (tier.sold * tier.price), 0);
  const remainingInventory = ticketTiers.reduce((acc, tier) => acc + (tier.inventory - tier.sold - (tier.reserved || 0)), 0);
  const totalInventory = ticketTiers.reduce((acc, tier) => acc + tier.inventory, 0);

  // Pie Chart: Tickets Sold by Tier
  const ticketTypeData = ticketTiers
    .filter(t => t.sold > 0)
    .map((tier) => ({
      name: tier.name,
      value: tier.sold
    }));

  // Bar Chart: Remaining vs Sold by Tier
  const inventoryData = ticketTiers.map(tier => ({
    name: tier.name,
    Sold: tier.sold,
    Remaining: tier.inventory - tier.sold - (tier.reserved || 0),
  }));

  // Time Series: Revenue over time
  // Group paid/approved reservations by date
  const paidRes = reservations.filter(r => r.status === 'paid' || r.status === 'approved');
  const revenueByDate: Record<string, { sales: number; tickets: number }> = {};
  
  paidRes.forEach(res => {
    if (!res.createdAt) return;
    const dateObj = new Date(res.createdAt);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!revenueByDate[dateStr]) {
      revenueByDate[dateStr] = { sales: 0, tickets: 0 };
    }
    revenueByDate[dateStr].sales += res.totalAmount || 0;
    revenueByDate[dateStr].tickets += res.items.reduce((acc, item) => acc + item.quantity, 0);
  });

  const timeSeriesData = Object.keys(revenueByDate)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(date => ({
      date,
      sales: revenueByDate[date].sales,
      tickets: revenueByDate[date].tickets
    }));

  const summaryStats = [
    { title: "Gross Revenue", value: `$${totalGrossRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
    { title: "Tickets Sold", value: totalTicketsSold.toString(), icon: Ticket, color: "text-purple-400" },
    { title: "Remaining Inventory", value: remainingInventory.toString(), icon: PackageOpen, color: "text-blue-400" },
    { title: "Sell-Through Rate", value: totalInventory > 0 ? `${Math.round((totalTicketsSold / totalInventory) * 100)}%` : "0%", icon: TrendingUp, color: "text-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white p-6 md:p-10 font-sans selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight">
              Event Analytics
            </h1>
            <p className="text-white/50 mt-1">
              Real-time insights for {eventData?.title || "your event"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-[0_0_0_rgba(168,85,247,0)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            >
              <Download className="w-4 h-4 text-white/70 group-hover:text-purple-400 transition-colors group-hover:-translate-y-0.5 transform duration-300" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className={`w-16 h-16 ${stat.color}`} />
              </div>
              <p className="text-sm font-medium text-white/50 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold tracking-tight text-white/90 mb-3">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Revenue Chart */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white/80 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Gross Revenue Over Time
            </h3>
            {timeSeriesData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-white/40">
                Not enough data yet.
              </div>
            )}
          </div>

          {/* Ticket Breakdown Chart */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl flex flex-col">
            <h3 className="text-lg font-semibold text-white/80 mb-2 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-400" />
              Ticket Sales by Tier
            </h3>
            {ticketTypeData.length > 0 ? (
              <>
                <div className="flex-1 h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {ticketTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-4 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                  {ticketTypeData.map((type, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm text-white/70">{type.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-white/90">{type.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/40">
                No tickets sold yet.
              </div>
            )}
          </div>

          {/* Inventory Bar Chart */}
          <div className="lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl mt-2">
            <h3 className="text-lg font-semibold text-white/80 mb-6 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-emerald-400" />
              Inventory Status
            </h3>
            {inventoryData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Sold" stackId="a" fill="#8b5cf6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Remaining" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-white/40">
                No inventory data available.
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* Add some basic scrollbar styling for the ticket breakdown if it overflows */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />
    </div>
  );
}
