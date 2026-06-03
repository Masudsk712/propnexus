"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/forms/form-section";
import { FormStepper, type Step } from "@/components/forms/form-stepper";
import { FormActions } from "@/components/forms/form-actions";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { FormSuccessState } from "@/components/forms/form-success-state";
import { FileUpload } from "@/components/forms/file-upload";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES } from "@/constants";
import { properties } from "@/data/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Wrench,
  Building2,
  Home,
  FileText,
  ArrowLeft,
  AlertTriangle,
  Clock,
  SignalHigh,
  Flame,
  Shield,
  Paperclip,
  ShowerHead,
  Zap,
  Thermometer,
  Hammer,
  Monitor,
  Bug,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

// ── Validation ──────────────────────────────────────────────────────────

const schema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  unit: z.string().min(1, "Unit is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  category: z.string().min(1, "Select a category"),
  priority: z.string().min(1, "Select priority"),
});

type FormData = z.infer<typeof schema>;

// ── Category Icons ──────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  plumbing: <ShowerHead className="h-5 w-5" />,
  electrical: <Zap className="h-5 w-5" />,
  hvac: <Thermometer className="h-5 w-5" />,
  structural: <Hammer className="h-5 w-5" />,
  appliance: <Monitor className="h-5 w-5" />,
  pest: <Bug className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  plumbing: "text-blue-500 bg-blue-500/10",
  electrical: "text-amber-500 bg-amber-500/10",
  hvac: "text-cyan-500 bg-cyan-500/10",
  structural: "text-red-500 bg-red-500/10",
  appliance: "text-violet-500 bg-violet-500/10",
  pest: "text-emerald-500 bg-emerald-500/10",
  other: "text-muted-foreground bg-muted",
};

// ── Priority Card Config ────────────────────────────────────────────────

interface PriorityCardConfig {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClasses: {
    card: string;
    icon: string;
    selected: string;
  };
}

const PRIORITY_CARDS: PriorityCardConfig[] = [
  {
    value: "low",
    label: "Low",
    description: "Minor issue, no urgency",
    icon: <Clock className="h-5 w-5" />,
    colorClasses: {
      card: "hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]",
      icon: "text-emerald-500 bg-emerald-500/10",
      selected: "border-emerald-500 bg-emerald-500/[0.06] ring-1 ring-emerald-500/20",
    },
  },
  {
    value: "medium",
    label: "Medium",
    description: "Needs attention soon",
    icon: <SignalHigh className="h-5 w-5" />,
    colorClasses: {
      card: "hover:border-amber-500/50 hover:bg-amber-500/[0.03]",
      icon: "text-amber-500 bg-amber-500/10",
      selected: "border-amber-500 bg-amber-500/[0.06] ring-1 ring-amber-500/20",
    },
  },
  {
    value: "high",
    label: "High",
    description: "Urgent — address quickly",
    icon: <AlertTriangle className="h-5 w-5" />,
    colorClasses: {
      card: "hover:border-orange-500/50 hover:bg-orange-500/[0.03]",
      icon: "text-orange-500 bg-orange-500/10",
      selected: "border-orange-500 bg-orange-500/[0.06] ring-1 ring-orange-500/20",
    },
  },
  {
    value: "emergency",
    label: "Emergency",
    description: "Critical — immediate action required",
    icon: <Flame className="h-5 w-5" />,
    colorClasses: {
      card: "hover:border-destructive/50 hover:bg-destructive/[0.03]",
      icon: "text-destructive bg-destructive/10",
      selected: "border-destructive bg-destructive/[0.06] ring-1 ring-destructive/20",
    },
  },
];

// ── Step Definitions ────────────────────────────────────────────────────

const STEPS: Step[] = [
  { id: "property", label: "Property", description: "Select unit", icon: <Building2 className="h-4 w-4" /> },
  { id: "details", label: "Details", description: "Describe issue", icon: <FileText className="h-4 w-4" /> },
  { id: "category", label: "Category", description: "Issue type", icon: <Wrench className="h-4 w-4" /> },
  { id: "priority", label: "Priority", description: "Urgency", icon: <Flame className="h-4 w-4" /> },
  { id: "attachments", label: "Attachments", description: "Photos", icon: <Paperclip className="h-4 w-4" /> },
  { id: "review", label: "Review", description: "Confirm", icon: <Shield className="h-4 w-4" /> },
];

type StepKey = "property" | "details" | "category" | "priority" | "attachments" | "review";

const STEP_FIELDS: Record<StepKey, (keyof FormData)[]> = {
  property: ["propertyId", "unit"],
  details: ["title", "description"],
  category: ["category"],
  priority: ["priority"],
  attachments: [],
  review: [],
};

function getStepFields(step: StepKey): (keyof FormData)[] {
  return STEP_FIELDS[step];
}

// ── Page ────────────────────────────────────────────────────────────────

export default function CreateMaintenancePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: "",
      unit: "",
      title: "",
      description: "",
      category: "",
      priority: "medium",
    },
  });

  const watchPriority = watch("priority");
  const watchCategory = watch("category");

  const stepKeys: StepKey[] = ["property", "details", "category", "priority", "attachments", "review"];

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

  const handleFormSubmit = async () => {
    const valid = await trigger();
    if (!valid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <FormSuccessState
        title="Request Submitted"
        description="Your maintenance request has been created successfully. We'll notify you when it's assigned."
        primaryAction={{
          label: "View All Requests",
          onClick: () => router.push("/maintenance"),
        }}
        secondaryAction={{
          label: "Create Another",
          onClick: () => window.location.reload(),
        }}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/maintenance">
          <Button variant="ghost" size="icon-sm" className="rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Maintenance Request</h1>
          <p className="text-muted-foreground mt-1">Submit a new maintenance request for a property</p>
        </div>
      </div>

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
          {/* Step 0: Property & Unit */}
          {currentStep === 0 && (
            <FormSection
              title="Property & Unit"
              description="Select the property and unit requiring maintenance"
              icon={<Building2 className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Property"
                  error={errors.propertyId?.message}
                  required
                >
                  <select
                    {...register("propertyId")}
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select property...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Unit Number"
                  error={errors.unit?.message}
                  required
                  hint="Apartment or unit number"
                >
                  <Input
                    placeholder="e.g., 12A"
                    icon={<Home className="h-4 w-4" />}
                    {...register("unit")}
                  />
                </FormFieldWrapper>
              </div>
            </FormSection>
          )}

          {/* Step 1: Issue Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <FormSection
                title="Issue Details"
                description="Describe the maintenance issue"
                icon={<Wrench className="h-5 w-5" />}
              >
                <FormFieldWrapper
                  label="Issue Title"
                  error={errors.title?.message}
                  required
                  hint="A brief summary of the problem"
                >
                  <Input
                    placeholder="e.g., Leaking kitchen faucet"
                    icon={<Wrench className="h-4 w-4" />}
                    {...register("title")}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Detailed Description"
                  error={errors.description?.message}
                  required
                  hint="Describe the issue in detail — location, severity, when it started"
                >
                  <textarea
                    {...register("description")}
                    placeholder="Describe the issue in detail..."
                    rows={5}
                    className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  />
                </FormFieldWrapper>
              </FormSection>
            </div>
          )}

          {/* Step 2: Category Selection */}
          {currentStep === 2 && (
            <FormSection
              title="Issue Category"
              description="Select the type of maintenance issue"
              icon={<Wrench className="h-5 w-5" />}
            >
              <FormFieldWrapper
                error={errors.category?.message}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MAINTENANCE_CATEGORIES.map((cat) => {
                    const isSelected = watchCategory === cat.value;
                    const icon = CATEGORY_ICONS[cat.value];
                    const colors = CATEGORY_COLORS[cat.value];

                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setValue("category", cat.value, { shouldDirty: true, shouldValidate: true })}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected
                            ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <div className={cn("rounded-lg p-2", colors)}>
                          {icon}
                        </div>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FormFieldWrapper>
            </FormSection>
          )}

          {/* Step 3: Priority Selection */}
          {currentStep === 3 && (
            <FormSection
              title="Priority Level"
              description="How urgent is this maintenance request?"
              icon={<Flame className="h-5 w-5" />}
            >
              <FormFieldWrapper
                error={errors.priority?.message}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRIORITY_CARDS.map((card) => {
                    const isSelected = watchPriority === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => setValue("priority", card.value, { shouldDirty: true, shouldValidate: true })}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected ? card.colorClasses.selected : card.colorClasses.card + " border-border"
                        )}
                      >
                        <div className={cn("rounded-lg p-2 flex-shrink-0", card.colorClasses.icon)}>
                          {card.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{card.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                        </div>
                        {isSelected && (
                          <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </FormFieldWrapper>
            </FormSection>
          )}

          {/* Step 4: Attachments */}
          {currentStep === 4 && (
            <FormSection
              title="Attachments"
              description="Upload photos or documents showing the issue"
              icon={<Paperclip className="h-5 w-5" />}
            >
              <FormFieldWrapper
                label="Upload Photos"
                hint="Photos help technicians understand and prepare for the issue"
              >
                <FileUpload
                  context="maintenance-images"
                  maxFiles={5}
                  maxFilesDisplay={5}
                  disabled={loading}
                  label="Upload Photos"
                  description="Drag & drop photos here. JPEG, PNG, WebP up to 5MB each."
                  uploadButtonText="Upload Photos"
                />
              </FormFieldWrapper>
            </FormSection>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <FormSection
              title="Review & Submit"
              description="Please review all details before submitting your request"
              icon={<Shield className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <ReviewItem
                  label="Property"
                  value={properties.find((p) => p.id === watch("propertyId"))?.name}
                />
                <ReviewItem label="Unit" value={watch("unit")} />
                <ReviewItem label="Title" value={watch("title")} fullWidth />
                <ReviewItem label="Description" value={watch("description")} fullWidth />
                <ReviewItem
                  label="Category"
                  value={MAINTENANCE_CATEGORIES.find((c) => c.value === watchCategory)?.label}
                />
                <ReviewItem
                  label="Priority"
                  value={MAINTENANCE_PRIORITIES.find((p) => p.value === watchPriority)?.label}
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
        onCancel={() => router.push("/maintenance")}
        isSubmitting={loading}
        isLastStep={currentStep === STEPS.length - 1}
        nextLabel={currentStep === STEPS.length - 1 ? "Submit Request" : "Continue"}
        isNextDisabled={loading}
        showPrevious={currentStep > 0}
      />
    </motion.div>
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