import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CreditCard, Landmark, Bitcoin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Form schema
const depositFormSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 
    { message: "Amount must be a positive number" }
  ),
  method: z.string({
    required_error: "Please select a payment method",
  }),
  promotionId: z.string().optional(),
  usePromotion: z.boolean().default(false),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

// Types for promotion
interface Promotion {
  id: number;
  name: string;
  description: string;
  bonusType: string;
  bonusValue: string;
  minDeposit: string;
  maxBonus: string | null;
  turnoverRequirement: string;
  imageUrl?: string;
}

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPromotion: Promotion | null;
}

const DepositDialog = ({ isOpen, onClose, selectedPromotion }: DepositDialogProps) => {
  const [depositMethod, setDepositMethod] = useState("card");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch available promotions
  const { data: availablePromotions, isLoading: isLoadingPromotions } = useQuery({
    queryKey: ["/api/promotions/available"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/promotions/available");
      const data = await res.json();
      return data.promotions || [];
    },
    enabled: isOpen && !selectedPromotion, // Only fetch if dialog is open and no promotion selected
  });

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: "",
      method: "card",
      usePromotion: !!selectedPromotion,
      promotionId: selectedPromotion ? String(selectedPromotion.id) : undefined,
    },
  });

  // Reset form when dialog opens with a selected promotion
  useEffect(() => {
    if (isOpen && selectedPromotion) {
      form.reset({
        amount: "",
        method: "card",
        usePromotion: true,
        promotionId: String(selectedPromotion.id),
      });
    }
  }, [isOpen, selectedPromotion, form]);

  const depositMutation = useMutation({
    mutationFn: async (values: DepositFormValues) => {
      const payload = {
        amount: values.amount,
        method: values.method,
        promotionId: values.usePromotion && values.promotionId ? parseInt(values.promotionId) : undefined,
      };

      const response = await apiRequest("POST", "/api/deposits", payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Successful",
        description: data.message || "Your deposit has been processed successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/active"] });
      
      // Close the dialog
      onClose();
      
      // Reset the form
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "Failed to process your deposit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: DepositFormValues) => {
    depositMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make a Deposit</DialogTitle>
          <DialogDescription>
            Add funds to your account to start playing.
            {selectedPromotion && (
              <div className="mt-2">
                <span className="block text-primary font-medium">
                  {selectedPromotion.name} promotion will be applied to this deposit.
                </span>
                <div className="mt-2 text-sm rounded-lg border p-3">
                  <p className="text-muted-foreground mb-2">{selectedPromotion.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Bonus:</span> {selectedPromotion.bonusValue}%
                    </div>
                    <div>
                      <span className="font-medium">Min Deposit:</span> ${parseFloat(selectedPromotion.minDeposit).toFixed(2)}
                    </div>
                    {selectedPromotion.maxBonus && (
                      <div>
                        <span className="font-medium">Max Bonus:</span> ${parseFloat(selectedPromotion.maxBonus).toFixed(2)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Wagering:</span> {selectedPromotion.turnoverRequirement}x
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="card" onValueChange={setDepositMethod}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="card">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="bank">
                  <Landmark className="mr-2 h-4 w-4" />
                  Bank
                </TabsTrigger>
                <TabsTrigger value="crypto">
                  <Bitcoin className="mr-2 h-4 w-4" />
                  Crypto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input
                                placeholder="Enter amount"
                                {...field}
                                className="pl-9"
                              />
                            </div>
                          </FormControl>
                          {selectedPromotion && (
                            <FormDescription>
                              Minimum deposit: ${parseFloat(selectedPromotion.minDeposit).toFixed(2)}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Type</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select card type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="visa">Visa</SelectItem>
                            <SelectItem value="mastercard">Mastercard</SelectItem>
                            <SelectItem value="amex">American Express</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="bank">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input
                                placeholder="Enter amount"
                                {...field}
                                className="pl-9"
                              />
                            </div>
                          </FormControl>
                          {selectedPromotion && (
                            <FormDescription>
                              Minimum deposit: ${parseFloat(selectedPromotion.minDeposit).toFixed(2)}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Transfer Method</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transfer method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="wire">Wire Transfer</SelectItem>
                            <SelectItem value="instant_transfer">Instant Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="crypto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input
                                placeholder="Enter amount"
                                {...field}
                                className="pl-9"
                              />
                            </div>
                          </FormControl>
                          {selectedPromotion && (
                            <FormDescription>
                              Minimum deposit: ${parseFloat(selectedPromotion.minDeposit).toFixed(2)}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cryptocurrency</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cryptocurrency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                            <SelectItem value="usdt">Tether (USDT)</SelectItem>
                            <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Toggle for Promotion (if not coming from a selected promotion) */}
            {!selectedPromotion && (
              <FormField
                control={form.control}
                name="usePromotion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Apply Promotion</FormLabel>
                      <FormDescription>
                        Apply a promotion to this deposit
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Promotion selection (only shown if usePromotion is true) */}
            {form.watch("usePromotion") && !selectedPromotion && (
              <>
                <FormField
                  control={form.control}
                  name="promotionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Promotion</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a promotion" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingPromotions ? (
                            <SelectItem value="loading">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading promotions...
                            </SelectItem>
                          ) : availablePromotions && availablePromotions.length > 0 ? (
                            availablePromotions.map((promo) => (
                              <SelectItem key={promo.id} value={String(promo.id)}>
                                {promo.name} - {promo.bonusValue}%
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none">No promotions available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Selected promotion details */}
                {form.watch("promotionId") && availablePromotions && (
                  <div className="rounded-lg border p-4 mt-2">
                    {(() => {
                      const selectedPromoId = form.watch("promotionId");
                      const promo = availablePromotions.find(p => String(p.id) === selectedPromoId);
                      
                      if (!promo) return null;
                      
                      return (
                        <>
                          <h4 className="font-semibold text-primary">{promo.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Bonus:</span> {promo.bonusValue}%
                            </div>
                            <div>
                              <span className="font-medium">Min Deposit:</span> ${parseFloat(promo.minDeposit).toFixed(2)}
                            </div>
                            {promo.maxBonus && (
                              <div>
                                <span className="font-medium">Max Bonus:</span> ${parseFloat(promo.maxBonus).toFixed(2)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Wagering:</span> {promo.turnoverRequirement}x
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={depositMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={depositMutation.isPending}
                className="bg-primary"
              >
                {depositMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Deposit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;