"use client";

import { bookings } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CalendarDays, Clock, Users, Search, MapPin, ChevronRight, Plus, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<string, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  confirmed: "success", pending: "warning", cancelled: "destructive", completed: "info",
};

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const filtered = bookings.filter((b) => {
    const matchesSearch = b.amenityName.toLowerCase().includes(search.toLowerCase()) || b.propertyName.toLowerCase().includes(search.toLowerCase()) || b.userName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="space-y-3">{[1,2,3,4,5].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Amenity Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage all amenity reservations</p>
        </div>
        <Link href="/amenities"><Button variant="outline"><CalendarDays className="mr-2 h-4 w-4" /> All Amenities</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-muted/50 pl-10 pr-4 text-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["all", "confirmed", "pending", "completed", "cancelled"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize whitespace-nowrap">{s}</Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((booking) => (
          <motion.div key={booking.id} whileHover={{ x: 4 }} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10"><CalendarDays className="h-6 w-6 text-violet-500" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{booking.amenityName}</p>
                <Badge variant={statusColors[booking.status]} className="text-xs capitalize">{booking.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                <MapPin className="inline h-3 w-3 mr-1" />{booking.propertyName} • <Users className="inline h-3 w-3 mr-1" />{booking.userName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <CalendarDays className="h-3 w-3" /> {formatDate(booking.date)}
                <span>•</span><Clock className="h-3 w-3" /> {booking.startTime} - {booking.endTime}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              {booking.guestCount && <p className="font-semibold">{booking.guestCount} guests</p>}
              {booking.notes && <p className="text-xs text-muted-foreground max-w-[200px] truncate">{booking.notes}</p>}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20"><CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold">No bookings found</h3><p className="text-muted-foreground mt-1">Try adjusting your search or filters</p></div>
        )}
      </div>
    </motion.div>
  );
}