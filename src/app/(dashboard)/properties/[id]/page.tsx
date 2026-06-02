"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyDetailsTabs } from "@/components/properties/property-details-tabs";
import { PropertyQuickActions } from "@/components/properties/property-quick-actions";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  DollarSign,
  Calendar,
  Users,
  ArrowLeft,
  Heart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const typeColors: Record<string, string> = {
  apartment: "from-blue-500/20 to-blue-600/10",
  house: "from-emerald-500/20 to-emerald-600/10",
  condo: "from-violet-500/20 to-violet-600/10",
  commercial: "from-orange-500/20 to-orange-600/10",
  townhouse: "from-pink-500/20 to-pink-600/10",
};

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "info"; label: string; dot: string; bg: string }
> = {
  occupied: {
    variant: "success",
    label: "Occupied",
    dot: "bg-emerald-500",
    bg: "from-emerald-500/20 to-emerald-600/5",
  },
  vacant: {
    variant: "destructive",
    label: "Vacant",
    dot: "bg-red-500",
    bg: "from-red-500/20 to-red-600/5",
  },
  maintenance: {
    variant: "warning",
    label: "Under Maintenance",
    dot: "bg-amber-500",
    bg: "from-amber-500/20 to-amber-600/5",
  },
  listed: {
    variant: "info",
    label: "Listed",
    dot: "bg-blue-500",
    bg: "from-blue-500/20 to-blue-600/5",
  },
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        const result = await res.json();
        if (!result.success) {
          setError(result.error ?? "Property not found");
          return;
        }
        setProperty(result.data);
      } catch {
        setError("Failed to load property");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProperty();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete property");
        return;
      }
      toast.success("Property deleted successfully");
      router.push("/properties");
    } catch {
      toast.error("Failed to delete property");
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Error / not found state
  if (error || !property) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto text-center py-20"
      >
        <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
        <p className="text-muted-foreground mb-6">
          {error ?? "The property you're looking for doesn't exist."}
        </p>
        <Link href="/properties">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
      </motion.div>
    );
  }

  const status = statusConfig[property.status] ?? statusConfig.vacant;
  const images = property.images ?? [];
  const allImages =
    images.length > 0
      ? images
      : property.image
        ? [property.image]
        : [];
  const occupancyRate =
    property.units > 0
      ? Math.round((property.occupiedUnits / property.units) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Back Navigation & Quick Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/properties"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>
        <PropertyQuickActions
          propertyId={property.id}
          isFavorite={isFavorite}
          onToggleFavorite={() => setIsFavorite(!isFavorite)}
          onDelete={handleDelete}
          inline
        />
      </div>

      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5">
          <div className="relative aspect-[21/9] bg-muted">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={allImages[selectedImage]}
                alt={`${property.title} - Image ${selectedImage + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedImage((prev: number) =>
                      prev === 0 ? allImages.length - 1 : prev - 1,
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-md p-2 text-white hover:bg-white/40 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setSelectedImage((prev: number) =>
                      prev === allImages.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-md p-2 text-white hover:bg-white/40 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Status Badge */}
            <Badge
              variant={status.variant}
              className="absolute top-4 left-4 capitalize shadow-lg backdrop-blur-sm"
            >
              <span
                className={`mr-1.5 h-2 w-2 rounded-full ${status.dot} animate-pulse`}
              />
              {status.label}
            </Badge>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-sm text-white">
              {selectedImage + 1} / {allImages.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 p-3 bg-card overflow-x-auto">
              {allImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage === i
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title & Location Header */}
      <div
        className={cn(
          "rounded-2xl border p-6 bg-gradient-to-br",
          status.bg,
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                {property.title}
              </h1>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-medium capitalize bg-gradient-to-r ${typeColors[property.type] ?? "from-muted to-muted"} border-muted-foreground/20`}
              >
                {property.type}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.address}, {property.city}, {property.state}{" "}
                {property.zipCode}
              </span>
            </div>
            {property.description && (
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                {property.description}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(property.rent)}
              <span className="text-base font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Security Deposit: {formatCurrency(property.securityDeposit)}
            </p>
          </div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            icon: Bed,
            label: "Bedrooms",
            value: property.bedrooms ?? "-",
          },
          {
            icon: Bath,
            label: "Bathrooms",
            value: property.bathrooms ?? "-",
          },
          {
            icon: Ruler,
            label: "Area",
            value: property.area ? `${property.area} ft²` : "-",
          },
          {
            icon: Calendar,
            label: "Year Built",
            value: property.yearBuilt ?? "-",
          },
          { icon: Users, label: "Occupancy", value: `${occupancyRate}%` },
          {
            icon: DollarSign,
            label: "Revenue/mo",
            value: formatCurrency(property.monthlyRevenue ?? 0),
          },
        ].map(({ icon: Icon, label, value }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Occupancy Bar */}
      {property.units > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Occupancy Tracking</h3>
              <p className="text-sm text-muted-foreground">
                {property.occupiedUnits} of {property.units} units occupied
              </p>
            </div>
            <span className="text-2xl font-bold">{occupancyRate}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancyRate}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                occupancyRate > 80
                  ? "bg-emerald-500"
                  : occupancyRate > 40
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
            />
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <PropertyDetailsTabs property={property} />
    </motion.div>
  );
}