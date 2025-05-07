import { requireAdmin } from "@/lib/auth-utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"

export default async function StatsPage() {
  // Check if the user is an admin - this will redirect if not authorized
  await requireAdmin();
  
  // Use the server client to bypass RLS
  const supabase = await createServerClient();
  
  // Get user stats
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
  
  // Get instructor stats
  // Use type assertion to bypass TypeScript filter constraint
  const { count: instructorCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
    .filter('role', 'eq', 'instructor' as any)
  
  // Get lesson stats
  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("*", { count: 'exact', head: true })
  
  // Simply query the purchases table directly
  const { data: purchasesData, error: purchasesError } = await supabase
    .from("purchases")
    .select("id, amount, is_free");
  
  if (purchasesError) {
    console.error("Admin Stats: Error fetching purchases:", purchasesError.message);
  }
  
  // Safely type our purchases data
  interface PurchaseData {
    id: string;
    amount: number;
    is_free: boolean;
  }
  
  // Type assertion on purchases data to avoid errors
  const purchases: PurchaseData[] = (purchasesData && !('error' in purchasesData)) 
    ? purchasesData as PurchaseData[]
    : [];
  
  console.log(`Admin Stats: Retrieved ${purchases.length} purchases directly from database`);
  
  // Log some purchase details to help diagnose
  if (purchases.length > 0) {
    console.log(`Admin Stats: First few purchases:`, 
      purchases.slice(0, 3).map(p => ({
        id: p.id,
        amount: p.amount,
        is_free: p.is_free
      }))
    );
  }
  
  // Calculate statistics from raw purchase data
  const totalPurchases = purchases.length;
  const freePurchases = purchases.filter(p => p.is_free === true).length;
  const paidPurchases = totalPurchases - freePurchases;
  
  // Calculate total revenue
  let totalRevenue = 0;
  purchases.forEach(p => {
    // Skip free purchases
    if (p.is_free === true) return;
    
    try {
      if (typeof p.amount === 'string' && p.amount) {
        const parsedAmount = parseFloat(p.amount);
        totalRevenue += parsedAmount;
        console.log(`Admin Stats: Parsed amount ${p.amount} as ${parsedAmount}`);
      } else if (typeof p.amount === 'number') {
        totalRevenue += p.amount;
      }
    } catch (e) {
      console.error(`Error parsing purchase amount (${p.amount}):`, e);
    }
  });
  
  console.log(`Admin Stats: Stats from RPC - ${totalPurchases} purchases (${freePurchases} free, ${paidPurchases} paid), $${totalRevenue} revenue`);
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Platform Statistics</h1>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {instructorCount || 0} instructors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessonCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available on the platform
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPurchases} paid, {freePurchases} free
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime revenue
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Button asChild>
          <Link href="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}