"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/stores/cart-store"
import { formatCurrency } from "@/lib/utils"

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    clearVendorCart,
    getSubtotal,
    getItemCount,
    getVendorCarts,
  } = useCartStore()

  const vendorCarts = useMemo(() => getVendorCarts(), [items, getVendorCarts])
  const totalPrice = getSubtotal()
  const totalItems = getItemCount()

  if (items.length === 0) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">Your cart is empty</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Add meals from one or more vendors, then return here to review everything before checkout.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link href="/shop">Browse vendors</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Your cart</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalItems} item{totalItems === 1 ? "" : "s"} from {vendorCarts.length} vendor
            {vendorCarts.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/shop">Continue shopping</Link>
          </Button>
          <Button
            variant="ghost"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={clearCart}
          >
            Clear cart
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {vendorCarts.map((vendorCart) => (
            <Card key={vendorCart.vendorId} className="overflow-hidden rounded-3xl border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Store className="h-3.5 w-3.5" />
                      Vendor order
                    </div>
                    <CardTitle className="mt-3 text-xl">{vendorCart.vendorName}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {vendorCart.items.length} item{vendorCart.items.length === 1 ? "" : "s"} • {formatCurrency(vendorCart.subtotal)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:text-destructive"
                    onClick={() => clearVendorCart(vendorCart.vendorId)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove vendor
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5">
                {vendorCart.items.map((item, index) => {
                  const unitPrice = item.unitPrice + (item.variant?.priceAdjustment ?? 0)
                  const optionsPrice = item.extras.reduce((sum, option) => sum + option.price, 0)
                  const itemPrice = (unitPrice + optionsPrice) * item.quantity

                  return (
                    <div key={item.key}>
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-semibold text-foreground">{item.productName}</h3>
                              {item.variant && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Variant: {item.variant.name} ({item.variant.option})
                                </p>
                              )}
                              {item.extras.length > 0 && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {item.extras.map((option) => option.name).join(", ")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="mt-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(itemPrice)}</p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-full border border-border bg-background p-1 shadow-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => updateQuantity(item.key, Math.max(0, item.quantity - 1))}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-10 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.key)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove item
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit rounded-3xl border-border/60 shadow-sm lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Vendors</span>
                <span>{vendorCarts.length}</span>
              </div>
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <Separator />

            <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              Delivery is calculated at checkout using the shortest route across all selected vendors and your drop-off location.
            </div>

            <Button asChild size="lg" className="w-full rounded-full">
              <Link href="/shop/checkout">Proceed to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}