"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTenantSchema, type CreateTenantInput } from "@/validations";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormSection } from "@/components/forms/form-section";
import { FormStepper, type Step } from "@/components/forms/form-stepper";
import { FormActions } from "@/components/forms/form-actions";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSuccessState } from "@/components/forms/form-success-state";
import { FileUpload } from "@/components/forms/file-upload";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Home,
  CalendarDays,
  DollarSign,
  Shield,
  FileText,
  Camera,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "evicted", label: "Evicted" },
];

// ── Step Definitions ────────────────────────────────────────────────────

const STEPS: Step[] = [
  { id: "tenant-info", label: "Tenant Info", description: "Personal details", icon: <User className="h-4 w-4" /> },
  { id: "property", label: "Property & Unit", description: "Assignment", icon: <Home className="h-4 w-4" /> },
  { id: "lease", label: "Lease", description: "Dates & rent", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "documents", label: "Documents", description: "Files & ID", icon: <FileText className="h-4 w-4" /> },
  { id: "review", label: "Review", description: "Confirm", icon: <FileText className="h-4 w-4" /> },
];

// ── Step validation map ─────────────────────────────────────────────────

type StepKey = "tenant-info" | "property" | "lease" | "documents" | "review";

const STEP_FIELDS: Record<StepKey, (keyof CreateTenantInput)[]> = {
  "tenant-info": ["userId"],
  property: ["propertyId", "unit"],
  lease: ["leaseStart", "leaseEnd", "rentAmount", "securityDeposit", "status"],
  documents: [],
  review: [],
};

function getStepFields(step: StepKey): (keyof CreateTenantInput)[] {
  return STEP_FIELDS[step];
}

// ── Props ───────────────────────────────────────────────────────────────

interface TenantFormProps {
  defaultValues?: Partial<CreateTenantInput>;
  onSubmit: (data: CreateTenantInput) => Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
}

export function TenantForm({
  defaultValues,
  onSubmit,
  submitLabel = "Add Tenant",
  isEdit = false,
}: TenantFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTenantSchema) as any,
    defaultValues: {
      userId: "",
      propertyId: "",
      unit: "",
      leaseStart: new Date(),
      leaseEnd: new Date(),
      rentAmount: 0,
      securityDeposit: 0,
      status: "active",
      ...defaultValues,
    },
  });

  const stepKeys: StepKey[] = ["tenant-info", "property", "lease", "documents", "review"];

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

  const handleFormSubmit = async (data: CreateTenantInput) => {
    const valid = await trigger();
    if (!valid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(data);
      setIsSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <FormSuccessState
        title={isEdit ? "Tenant Updated!" : "Tenant Added!"}
        description={
          isEdit
            ? "The tenant information has been updated successfully."
            : "The tenant has been added and assigned to a property."
        }
        primaryAction={{
          label: "View All Tenants",
          onClick: () => router.push("/tenants"),
        }}
        secondaryAction={
          !isEdit
            ? { label: "Add Another", onClick: () => window.location.reload() }
            : undefined
        }
      />
    );
  }

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
          {/* Step 0: Tenant Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <FormSection
                title="Profile Photo"
                description="Upload a profile picture for the tenant"
                icon={<Camera className="h-5 w-5" />}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground/50" />
                      )}
                    </div>
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90 transition-colors"
                      aria-label="Upload profile photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfileImage(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the camera icon to upload a photo
                  </p>
                </div>
              </FormSection>

              <FormSection
                title="Tenant Information"
                description="Basic information about the tenant"
                icon={<User className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormFieldWrapper
                      label="User ID"
                      error={errors.userId?.message}
                      required
                      hint="Select an existing user or enter their ID"
                    >
                      <Input
                        placeholder="Enter user ID..."
                        icon={<User className="h-4 w-4" />}
                        {...register("userId")}
                      />
                    </FormFieldWrapper>
                  </div>
                </div>
              </FormSection>
            </div>
          )}

          {/* Step 1: Property & Unit */}
          {currentStep === 1 && (
            <FormSection
              title="Property Assignment"
              description="Assign the tenant to a property and unit"
              icon={<Home className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Property"
                  error={errors.propertyId?.message}
                  required
                  hint="Select the property this tenant will live in"
                >
                  <Input
                    placeholder="Enter property ID..."
                    icon={<Home className="h-4 w-4" />}
                    {...register("propertyId")}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Unit Number"
                  error={errors.unit?.message}
                  required
                  hint="Apartment/unit number"
                >
                  <Input
                    placeholder="e.g., 12A"
                    {...register("unit")}
                  />
                </FormFieldWrapper>
              </div>
            </FormSection>
          )}

          {/* Step 2: Lease Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <FormSection
                title="Lease Period"
                description="Lease start and end dates"
                icon={<CalendarDays className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper
                    label="Lease Start Date"
                    error={errors.leaseStart?.message}
                    required
                  >
                    <Input
                      type="date"
                      {...register("leaseStart", {
                        setValueAs: (v) => (v ? new Date(v) : new Date()),
                      })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    label="Lease End Date"
                    error={errors.leaseEnd?.message}
                    required
                  >
                    <Input
                      type="date"
                      {...register("leaseEnd", {
                        setValueAs: (v) => (v ? new Date(v) : new Date()),
                      })}
                    />
                  </FormFieldWrapper>
                </div>
              </FormSection>

              <FormSection
                title="Financial Details"
                description="Rent and security deposit"
                icon={<DollarSign className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper
                    label="Monthly Rent"
                    error={errors.rentAmount?.message}
                    required
                    hint="Amount in USD"
                  >
                    <Input
                      type="number"
                      placeholder="e.g., 2500"
                      icon={<DollarSign className="h-4 w-4" />}
                      {...register("rentAmount", { valueAsNumber: true })}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    label="Security Deposit"
                    error={errors.securityDeposit?.message}
                    hint="Typically one month's rent"
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

              <FormSection
                title="Lease Status"
                icon={<Shield className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper
                    label="Tenant Status"
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
                </div>
              </FormSection>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <FormSection
              title="Documents"
              description="Upload lease agreements, ID proofs, and other documents"
              icon={<FileText className="h-5 w-5" />}
            >
              <FormFieldWrapper
                label="Tenant Documents"
                hint="Upload lease agreements, identity proofs, or any relevant files"
              >
                <FileUpload
                  context="tenant-documents"
                  maxFiles={10}
                  maxFilesDisplay={10}
                  disabled={submitting}
                  label="Upload Documents"
                  description="Drag & drop files here. Supports images, PDFs, and documents up to 10MB."
                  uploadButtonText="Upload Documents"
                />
              </FormFieldWrapper>
            </FormSection>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <FormSection
              title="Review & Confirm"
              description="Please review all tenant details before submitting"
              icon={<FileText className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <ReviewItem label="User ID" value={watch("userId")} />
                <ReviewItem label="Property" value={watch("propertyId")} />
                <ReviewItem label="Unit" value={watch("unit")} />
                <ReviewItem label="Status" value={STATUS_OPTIONS.find((s) => s.value === watch("status"))?.label} />
                <ReviewItem label="Lease Start" value={watch("leaseStart")?.toLocaleDateString()} />
                <ReviewItem label="Lease End" value={watch("leaseEnd")?.toLocaleDateString()} />
                <ReviewItem label="Monthly Rent" value={`$${watch("rentAmount")?.toLocaleString()}`} />
                <ReviewItem label="Security Deposit" value={`$${watch("securityDeposit")?.toLocaleString()}`} />
                <ReviewItem
                  label="Profile Photo"
                  value={profileImage ? "Uploaded" : "Not provided"}
                  fullWidth
                />
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
            ? isEdit ? "Update Tenant" : submitLabel
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