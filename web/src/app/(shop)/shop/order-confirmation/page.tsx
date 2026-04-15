"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock3, Receipt, Store } from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMyErrands } from "@/lib/hooks/use-user"
import { formatCurrency } from "@/lib/utils"

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const singleId = searchParams.get("id")
  const manyIds = searchParams.get("ids")

  const orderIds = useMemo(() => {
    const values = manyIds
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    if (values && values.length > 0) {
      return values
    }

    return singleId ? [singleId] : []
  }, [manyIds, singleId])

  const { data: ordersResponse, isLoading } = useMyErrands({
    page: 1,
    pageSize: 100,
  })

  const orders = useMemo(() => {
    const allOrders = ordersResponse?.data || []
    return allOrders.filter((order) => orderIds.includes(order.id))
  }, [orderIds, ordersResponse])

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0)

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-24 animate-pulse rounded-3xl bg-muted" />
          <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden rounded-3xl border-border/60 shadow-sm">
          <CardContent className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">Order confirmed</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {orders.length > 1
                ? "Your checkout has been split into separate vendor orders. Each vendor will prepare and fulfil their portion independently."
                : "Your order has been placed successfully. The vendor has received it and preparation should begin shortly."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/dashboard/errands">Track orders</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="rounded-3xl border-border/60 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <Store className="h-3.5 w-3.5" />
                        {order.vendorName || "Vendor order"}
                      </div>
                      <CardTitle className="mt-3 text-xl">Order reference</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">{order.id}</p>
                    </div>

                    <StatusBadge status={order.status} kind="errand" className="rounded-full px-3 py-1" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pickup</p>
                      <p className="mt-2 text-sm text-foreground">{order.pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery address</p>
                      <p className="mt-2 text-sm text-foreground">{order.dropoffAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Placed</p>
                      <p className="mt-2 text-sm text-foreground">
                        {new Date(order.createdAt).toLocaleString("en-NG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned rider</p>
                      <p className="mt-2 text-sm text-foreground">{order.riderName || "Waiting for assignment"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {orders.length === 0 && (
              <Card className="rounded-3xl border-border/60 shadow-sm">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No matching order summary was found. You can still review your latest activity from the orders page.
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="h-fit rounded-3xl border-border/60 shadow-sm lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Checkout summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Orders placed</span>
                <span>{orders.length}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Grand total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>

              <Separator />

              <p className="text-muted-foreground">
                If you placed a multi-vendor checkout, each vendor order will progress independently in tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}