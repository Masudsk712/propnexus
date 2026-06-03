"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPropertySchema, type CreatePropertyInput } from "@/validations";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormSection } from "@/components/forms/form-section";
import { FormStepper, type Step } from "@/components/forms/form-stepper";
import { FormActions } from "@/components/forms/form-actions";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSuccessState } from "@/components/forms/form-success-state";
import { ImageUpload } from "./image-upload";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Ruler,
  Warehouse,
  Layers,
  Home,
  List,
  Image as ImageIcon,
  Check,
  Wrench,
  FileText,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "commercial", label: "Commercial" },
  { value: "townhouse", label: "Townhouse" },
];

const STATUS_OPTIONS = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Under Maintenance" },
  { value: "listed", label: "Listed" },
];

const AMENITY_OPTIONS = [
  "Air Conditioning", "Balcony", "CCTV", "Clubhouse", "Covered Parking",
  "Dishwasher", "Elevator", "Fireplace", "Furnished", "Garden",
  "Gated Community", "Gym", "Heating", "In-unit Laundry", "Intercom",
  "Lawn", "Parking", "Patio", "Pet Friendly", "Playground",
  "Pool", "Power Backup", "Rooftop", "Security Guard", "Storage",
  "Swimming Pool", "Terrace", "Walk-in Closet", "Washer/Dryer", "WiFi",
];

// ── Step Definitions ────────────────────────────────────────────────────

const STEPS: Step[] = [
  { id: "info", label: "Property Info", description: "Basic details", icon: <Building2 className="h-4 w-4" /> },
  { id: "location", label: "Location", description: "Address", icon: <MapPin className="h-4 w-4" /> },
  { id: "financials", label: "Financials", description: "Rent & fees", icon: <DollarSign className="h-4 w-4" /> },
  { id: "details", label: "Details", description: "Rooms & area", icon: <Ruler className="h-4 w-4" /> },
  { id: "media", label: "Media & Extras", description: "Images & amenities", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "review", label: "Review", description: "Confirm", icon: <FileText className="h-4 w-4" /> },
];

// ── Props ───────────────────────────────────────────────────────────────

interface PropertyFormProps {
  defaultValues?: Partial<CreatePropertyInput>;
  onSubmit: (data: CreatePropertyInput) => Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
}

// ── Step validation map ─────────────────────────────────────────────────

type StepKey = "info" | "location" | "financials" | "details" | "media" | "review";

const STEP_FIELDS: Record<StepKey, (keyof CreatePropertyInput)[]> = {
  info: ["title", "name", "type", "status", "yearBuilt"],
  location: ["address", "city", "state", "zipCode"],
  financials: ["rent", "securityDeposit"],
  details: ["bedrooms", "bathrooms", "area", "squareFeet", "description", "units", "occupiedUnits", "monthlyRevenue"],
  media: ["images", "amenities"],
  review: [],
};

function getStepFields(step: StepKey): (keyof CreatePropertyInput)[] {
  return STEP_FIELDS[step];
}

// ── Component ───────────────────────────────────────────────────────────

export function PropertyForm({
  defaultValues,
  onSubmit,
  submitLabel = "Add Property",
  isEdit = false,
}: PropertyFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreatePropertyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPropertySchema) as any,
    defaultValues: {
      title: "",
      name: "",
      description: "",
      type: "apartment",
      status: "vacant",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      rent: 0,
      securityDeposit: 0,
      bedrooms: undefined,
      bathrooms: undefined,
      area: undefined,
      squareFeet: undefined,
      amenities: [],
      images: [],
      image: "",
      units: 1,
      occupiedUnits: 0,
      monthlyRevenue: 0,
      yearBuilt: undefined,
      ...defaultValues,
    },
  });

  const watchAmenities = watch("amenities") ?? [];
  const watchImages = watch("images") ?? [];

  const stepKeys: StepKey[] = ["info", "location", "financials", "details", "media", "review"];

  // Compute which steps have errors
  const stepErrors = useMemo(() => {
    const result: Partial<Record<StepKey, boolean>> = {};
    for (const key of stepKeys) {
      const fields = getStepFields(key);
      result[key] = fields.some((f) => !!errors[f]);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const stepsWithErrors = useMemo(() => {
    return STEPS.map((s, i) => ({
      ...s,
      hasError: stepErrors[stepKeys[i]] ?? false,
    }));
  }, [stepErrors, stepKeys]);

  const handleStepClick = (index: number) => {
    // Allow going back to previous steps
    if (index < currentStep) {
      setDirection("backward");
      setCurrentStep(index);
    }
  };

  const goNext = async () => {
    const currentStepKey = stepKeys[currentStep];
    const fields = getStepFields(currentStepKey);

    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) {
        toast.error("Please fix the errors before continuing");
        return;
      }
    }

    if (currentStep < STEPS.length - 1) {
      setDirection("forward");
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrevious = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFormSubmit = async (data: CreatePropertyInput) => {
    // Final validation of all fields
    const valid = await trigger();
    if (!valid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const formattedData = {
        ...data,
        image: data.images && data.images.length > 0 ? data.images[0] : undefined,
        description: data.description || undefined,
      };
      await onSubmit(formattedData);
      setIsSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
      setSubmitting(false);
    }
  };

  const toggleAmenity = useCallback(
    (amenity: string) => {
      const current = watch("amenities") ?? [];
      if (current.includes(amenity)) {
        setValue("amenities", current.filter((a) => a !== amenity), { shouldDirty: true });
      } else {
        setValue("amenities", [...current, amenity], { shouldDirty: true });
      }
    },
    [watch, setValue]
  );

  // Success state
  if (isSuccess) {
    return (
      <FormSuccessState
        title={isEdit ? "Property Updated!" : "Property Created!"}
        description={
          isEdit
            ? "The property has been updated successfully."
            : "Your new property has been added to the system."
        }
        primaryAction={{
          label: "View All Properties",
          onClick: () => router.push("/properties"),
        }}
        secondaryAction={
          !isEdit
            ? { label: "Add Another", onClick: () => window.location.reload() }
            : undefined
        }
      />
    );
  }

  // Step animation variants
  const slideVariants = {
    enter: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <FormStepper
          steps={stepsWithErrors}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowNavigation={false}
        />
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Step 0: Property Information */}
          {currentStep === 0 && (
            <FormSection
              title="Property Information"
              description="Basic details about the property"
              icon={<Building2 className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormFieldWrapper
                    label="Property Title"
                    error={errors.title?.message}
                    required
                    hint="A descriptive title for the property listing"
                  >
                    <Input
                      placeholder="e.g., Luxurious 3BHK Apartment in Downtown"
                      icon={<Home className="h-4 w-4" />}
                      {...register("title")}
                    />
                  </FormFieldWrapper>
                </div>

                <FormFieldWrapper
                  label="Property Name"
                  error={errors.name?.message}
                  required
                >
                  <Input
                    placeholder="e.g., Skyline Residency"
                    icon={<Building2 className="h-4 w-4" />}
                    {...register("name")}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Property Type"
                  error={errors.type?.message}
                  required
                >
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={PROPERTY_TYPES}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.type?.message}
                      />
                    )}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Availability Status"
                  error={errors.status?.message}
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={STATUS_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.status?.message}
                      />
                    )}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper label="Year Built" error={errors.yearBuilt?.message}>
                  <Input
                    type="number"
                    placeholder="e.g., 2022"
                    icon={<Warehouse className="h-4 w-4" />}
                    {...register("yearBuilt", { valueAsNumber: true })}
                  />
                </FormFieldWrapper>
              </div>
            </FormSection>
          )}

          {/* Step 1: Location */}
          {currentStep === 1 && (
            <FormSection
              title="Location Details"
              description="Property address information"
              icon={<MapPin className="h-5 w-5" />}
              variant="highlight"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormFieldWrapper
                    label="Street Address"
                    error={errors.address?.message}
                    required
                  >
                    <Input
                      placeholder="e.g., 123 Main Street"
                      icon={<MapPin className="h-4 w-4" />}
                      {...register("address")}
                    />
                  </FormFieldWrapper>
                </div>
                <FormFieldWrapper label="City" error={errors.city?.message} required>
                  <Input placeholder="e.g., New York" {...register("city")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="State" error={errors.state?.message} required>
                  <Input placeholder="e.g., NY" {...register("state")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="ZIP Code" error={errors.zipCode?.message} required>
                  <Input placeholder="e.g., 10001" {...register("zipCode")} />
                </FormFieldWrapper>
              </div>
            </FormSection>
          )}

          {/* Step 2: Financials */}
          {currentStep === 2 && (
            <FormSection
              title="Financial Details"
              description="Rent and security deposit information"
              icon={<DollarSign className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Monthly Rent"
                  error={errors.rent?.message}
                  required
                  hint="Amount in USD"
                >
                  <Input
                    type="number"
                    placeholder="e.g., 2500"
                    icon={<DollarSign className="h-4 w-4" />}
                    {...register("rent", { valueAsNumber: true })}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Security Deposit"
                  error={errors.securityDeposit?.message}
                  hint="Typically equal to one month's rent"
                >
                  <Input
                    type="number"
                    placeholder="e.g., 2500"
                    icon={<DollarSign className="h-4 w-4" />}
                    {...register("securityDeposit", { valueAsNumber: true })}
                  />
                </FormFieldWrapper>
              </div>
            </FormSection>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <FormSection
                title="Rooms & Area"
                description="Property dimensions and rooms"
                icon={<Ruler className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper label="Bedrooms" error={errors.bedrooms?.message}>
                    <Input
                      type="number"
                      placeholder="e.g., 3"
                      icon={<Bed className="h-4 w-4" />}
                      {...register("bedrooms", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper label="Bathrooms" error={errors.bathrooms?.message}>
                    <Input
                      type="number"
                      placeholder="e.g., 2"
                      step="0.5"
                      icon={<Bath className="h-4 w-4" />}
                      {...register("bathrooms", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper label="Area (sq. ft.)" error={errors.area?.message}>
                    <Input
                      type="number"
                      placeholder="e.g., 1200"
                      icon={<Ruler className="h-4 w-4" />}
                      {...register("area", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper label="Square Feet" error={errors.squareFeet?.message}>
                    <Input
                      type="number"
                      placeholder="e.g., 1200"
                      icon={<Ruler className="h-4 w-4" />}
                      {...register("squareFeet", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                </div>
              </FormSection>

              <FormSection
                title="Units & Occupancy"
                description="Manage units and occupancy tracking"
                icon={<Layers className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormFieldWrapper label="Total Units">
                    <Input
                      type="number"
                      placeholder="1"
                      icon={<Layers className="h-4 w-4" />}
                      {...register("units", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper label="Occupied Units">
                    <Input
                      type="number"
                      placeholder="0"
                      icon={<Building2 className="h-4 w-4" />}
                      {...register("occupiedUnits", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper label="Monthly Revenue">
                    <Input
                      type="number"
                      placeholder="0"
                      icon={<DollarSign className="h-4 w-4" />}
                      {...register("monthlyRevenue", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                </div>
              </FormSection>

              <FormSection
                title="Description"
                description="Detailed description of the property"
                icon={<FileText className="h-5 w-5" />}
              >
                <FormFieldWrapper
                  label="Property Description"
                  error={errors.description?.message}
                  hint="Include features, nearby landmarks, and accessibility details"
                >
                  <textarea
                    className="flex min-h-[140px] w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    placeholder="Describe the property in detail..."
                    {...register("description")}
                  />
                </FormFieldWrapper>
              </FormSection>
            </div>
          )}

          {/* Step 4: Media & Amenities */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <FormSection
                title="Property Images"
                description="Upload high-quality images of the property"
                icon={<ImageIcon className="h-5 w-5" />}
              >
                <Controller
                  name="images"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value ?? []}
                      onChange={field.onChange}
                      maxFiles={10}
                      disabled={submitting}
                      label={`Images (${watchImages.length}/10)`}
                    />
                  )}
                />
              </FormSection>

              <FormSection
                title="Amenities"
                description="Select all amenities available at this property"
                icon={<List className="h-5 w-5" />}
              >
                <p className="text-sm text-muted-foreground mb-4">
                  {watchAmenities.length} amenity{watchAmenities.length !== 1 ? "ies" : ""} selected
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const isSelected = watchAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        {isSelected ? (
                          <div className="rounded-full bg-primary p-0.5 flex-shrink-0">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className="truncate">{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </FormSection>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <FormSection
              title="Review & Confirm"
              description="Please review all details before submitting"
              icon={<FileText className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <ReviewItem label="Title" value={watch("title")} />
                <ReviewItem label="Name" value={watch("name")} />
                <ReviewItem label="Type" value={PROPERTY_TYPES.find((t) => t.value === watch("type"))?.label} />
                <ReviewItem label="Status" value={STATUS_OPTIONS.find((s) => s.value === watch("status"))?.label} />
                <ReviewItem label="Address" value={watch("address")} />
                <ReviewItem label="City" value={watch("city")} />
                <ReviewItem label="State" value={watch("state")} />
                <ReviewItem label="ZIP Code" value={watch("zipCode")} />
                <ReviewItem label="Monthly Rent" value={`$${watch("rent")?.toLocaleString()}`} />
                <ReviewItem label="Security Deposit" value={`$${watch("securityDeposit")?.toLocaleString()}`} />
                <ReviewItem label="Bedrooms" value={watch("bedrooms")?.toString()} />
                <ReviewItem label="Bathrooms" value={watch("bathrooms")?.toString()} />
                <ReviewItem label="Area" value={watch("area") ? `${watch("area")} sq. ft.` : undefined} />
                <ReviewItem label="Year Built" value={watch("yearBuilt")?.toString()} />
                <ReviewItem label="Images" value={watchImages.length > 0 ? `${watchImages.length} image(s)` : "None"} />
                <ReviewItem label="Amenities" value={watchAmenities.length > 0 ? watchAmenities.join(", ") : "None"} fullWidth />
              </div>
            </FormSection>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Form Actions */}
      <FormActions
        onPrevious={currentStep > 0 ? goPrevious : undefined}
        onNext={currentStep < STEPS.length - 1 ? goNext : handleSubmit(handleFormSubmit)}
        onCancel={() => router.back()}
        isSubmitting={submitting}
        isLastStep={currentStep === STEPS.length - 1}
        nextLabel={
          currentStep === STEPS.length - 1
            ? isEdit ? "Update Property" : submitLabel
            : "Continue"
        }
        isNextDisabled={submitting}
        showPrevious={currentStep > 0}
      />
    </div>
  );
}

// ── Review Item Helper ──────────────────────────────────────────────────

function ReviewItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground/50 italic">Not provided</span>}
      </dd>
    </div>
  );
}