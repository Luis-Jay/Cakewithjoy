import { Card } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  FileText,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ReportPreviewProps {
  reportType: string;
  dateRange: { from?: Date; to?: Date };
  sections: {
    summary: boolean;
    orders: boolean;
    revenue: boolean;
    inventory: boolean;
    staff: boolean;
  };
}

export function ReportPreview({ reportType, dateRange, sections }: ReportPreviewProps) {
  const formatDate = (date?: Date) => {
    return date ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  };

  const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + " Report";

  // Mock data for charts
  const dailySalesData = [
    { date: "Nov 1", sales: 15420, orders: 12 },
    { date: "Nov 2", sales: 18950, orders: 15 },
    { date: "Nov 3", sales: 12300, orders: 10 },
    { date: "Nov 4", sales: 22480, orders: 18 },
    { date: "Nov 5", sales: 19650, orders: 16 },
    { date: "Nov 6", sales: 25800, orders: 20 },
    { date: "Nov 7", sales: 21340, orders: 17 },
  ];

  const categoryBreakdown = [
    { name: "Custom Cakes", value: 45, revenue: 125400 },
    { name: "Standard Cakes", value: 30, revenue: 68200 },
    { name: "Cupcakes", value: 15, revenue: 28900 },
    { name: "Pastries", value: 10, revenue: 15600 },
  ];

  const COLORS = ["#FF6B9D", "#C084FC", "#60A5FA", "#34D399"];

  const topProducts = [
    { name: "Chocolate Decadence Cake", sold: 45, revenue: 45000 },
    { name: "Strawberry Dream Cake", sold: 38, revenue: 34200 },
    { name: "Vanilla Classic Cake", sold: 32, revenue: 28800 },
    { name: "Red Velvet Delight", sold: 28, revenue: 30800 },
    { name: "Caramel Swirl Cake", sold: 25, revenue: 26250 },
  ];

  const inventoryStatus = [
    { ingredient: "All-Purpose Flour", currentStock: "25 kg", used: "120 kg", status: "Good", trend: "+5%" },
    { ingredient: "Granulated Sugar", currentStock: "15 kg", used: "85 kg", status: "Good", trend: "+2%" },
    { ingredient: "Butter", currentStock: "8 kg", used: "65 kg", status: "Low", trend: "+12%" },
    { ingredient: "Eggs", currentStock: "150 pcs", used: "850 pcs", status: "Good", trend: "+8%" },
    { ingredient: "Cocoa Powder", currentStock: "3 kg", used: "18 kg", status: "Critical", trend: "+15%" },
  ];

  const staffPerformance = [
    { name: "Maria Santos", role: "Head Baker", ordersCompleted: 45, performance: "Excellent" },
    { name: "Juan Dela Cruz", role: "Pastry Chef", ordersCompleted: 38, performance: "Excellent" },
    { name: "Anna Reyes", role: "Decorator", ordersCompleted: 42, performance: "Excellent" },
    { name: "Carlos Mendoza", role: "Baker", ordersCompleted: 35, performance: "Good" },
    { name: "Sofia Garcia", role: "Decorator", ordersCompleted: 40, performance: "Excellent" },
  ];

  return (
    <div className="bg-white rounded-lg p-4 w-full">
      {/* Report Header */}
      <div className="border-b-2 border-primary pb-3 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-pink-600 mb-0.5">Cake with Joy</h2>
            <p className="text-sm text-muted-foreground">Bakery Management System</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Report Generated</p>
            <p className="text-sm">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        <h3 className="text-primary mb-1">{reportTitle}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            Period: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      {sections.summary && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <h4 className="text-primary">Executive Summary</h4>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded">
                  <ShoppingCart className="w-3 h-3 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <p className="text-lg text-blue-600">108</p>
            </Card>
            <Card className="p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 rounded">
                  <DollarSign className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-lg text-green-600">₱238,100</p>
            </Card>
            <Card className="p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-100 rounded">
                  <TrendingUp className="w-3 h-3 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground">Avg Order Value</p>
              </div>
              <p className="text-lg text-purple-600">₱2,204</p>
            </Card>
            <Card className="p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-100 rounded">
                  <CheckCircle className="w-3 h-3 text-orange-600" />
                </div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
              <p className="text-lg text-orange-600">96.3%</p>
            </Card>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm mb-1.5">
              <strong>Key Highlights:</strong>
            </p>
            <ul className="space-y-0.5 text-sm text-muted-foreground ml-4">
              <li>• Revenue increased by 12.5% compared to previous period</li>
              <li>• Custom cake orders represent 45% of total revenue</li>
              <li>• Peak order days: Fridays and Saturdays (60% of weekly orders)</li>
              <li>• Customer retention rate: 78% (returning customers)</li>
              <li>• Average order processing time: 2.5 days</li>
            </ul>
          </div>
        </div>
      )}

      {/* Order Details & Statistics */}
      {sections.orders && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h4 className="text-primary">Order Details & Statistics</h4>
          </div>
          
          <div className="mb-4">
            <p className="text-sm mb-2">Daily Order Trends</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#FF6B9D" name="Sales (₱)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#60A5FA" name="Orders" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm mb-2">Order Status Breakdown</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Count</TableHead>
                    <TableHead className="text-xs">Percentage</TableHead>
                    <TableHead className="text-right text-xs">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs py-2">Completed</TableCell>
                    <TableCell className="text-xs py-2">92</TableCell>
                    <TableCell className="text-xs py-2">85.2%</TableCell>
                    <TableCell className="text-right text-xs py-2">₱203,420</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs py-2">In Progress</TableCell>
                    <TableCell className="text-xs py-2">12</TableCell>
                    <TableCell className="text-xs py-2">11.1%</TableCell>
                    <TableCell className="text-right text-xs py-2">₱28,940</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs py-2">Pending</TableCell>
                    <TableCell className="text-xs py-2">4</TableCell>
                    <TableCell className="text-xs py-2">3.7%</TableCell>
                    <TableCell className="text-right text-xs py-2">₱5,740</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <p className="text-sm mb-2">Top 5 Best-Selling Products</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Product Name</TableHead>
                    <TableHead className="text-xs">Units Sold</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs py-2">{product.name}</TableCell>
                      <TableCell className="text-xs py-2">{product.sold}</TableCell>
                      <TableCell className="text-right text-xs py-2">₱{product.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue & Financial Analysis */}
      {sections.revenue && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-primary" />
            <h4 className="text-primary">Revenue & Financial Analysis</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm mb-2">Revenue by Category</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: '11px' }}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-sm mb-2">Revenue Breakdown</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Orders</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.map((cat, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs py-2">{cat.name}</TableCell>
                      <TableCell className="text-xs py-2">{cat.value}</TableCell>
                      <TableCell className="text-right text-xs py-2">₱{cat.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3 border">
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-lg text-green-600">₱238,100</p>
              <p className="text-xs text-muted-foreground">+12.5% from last period</p>
            </Card>
            <Card className="p-3 border">
              <p className="text-xs text-muted-foreground mb-1">Operating Costs</p>
              <p className="text-lg text-orange-600">₱89,450</p>
              <p className="text-xs text-muted-foreground">37.6% of revenue</p>
            </Card>
            <Card className="p-3 border">
              <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
              <p className="text-lg text-blue-600">₱148,650</p>
              <p className="text-xs text-muted-foreground">62.4% profit margin</p>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm mb-1.5">
              <strong>Financial Insights:</strong>
            </p>
            <ul className="space-y-0.5 text-sm text-muted-foreground ml-4">
              <li>• Custom cakes provide the highest profit margin at 68%</li>
              <li>• Weekend orders account for 55% of total revenue</li>
              <li>• Average transaction value increased by ₱180 this period</li>
              <li>• Payment completion rate: 98.5% (only 1.5% pending payments)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Inventory Usage & Stock Levels */}
      {sections.inventory && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h4 className="text-primary">Inventory Usage & Stock Levels</h4>
          </div>

          <div className="mb-4">
            <p className="text-sm mb-2">Ingredient Consumption & Status</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ingredient</TableHead>
                  <TableHead className="text-xs">Current Stock</TableHead>
                  <TableHead className="text-xs">Used This Period</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Usage Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryStatus.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs py-2">{item.ingredient}</TableCell>
                    <TableCell className="text-xs py-2">{item.currentStock}</TableCell>
                    <TableCell className="text-xs py-2">{item.used}</TableCell>
                    <TableCell className="text-xs py-2">
                      {item.status === "Critical" && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      )}
                      {item.status === "Low" && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          Low
                        </span>
                      )}
                      {item.status === "Good" && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Good
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs py-2">{item.trend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm mb-1.5">
              <strong>Inventory Recommendations:</strong>
            </p>
            <ul className="space-y-0.5 text-sm text-muted-foreground ml-4">
              <li>• <strong className="text-red-600">URGENT:</strong> Restock cocoa powder immediately (only 3 kg remaining)</li>
              <li>• <strong className="text-orange-600">WARNING:</strong> Butter stock is low (8 kg) - reorder recommended</li>
              <li>• Flour and sugar levels are healthy for the next 2 weeks</li>
              <li>• Egg consumption increased by 8% - consider bulk ordering</li>
              <li>• Total inventory value: ₱45,800</li>
            </ul>
          </div>
        </div>
      )}

      {/* Staff Performance & Activity */}
      {sections.staff && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h4 className="text-primary">Staff Performance & Activity</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm mb-2">Staff Productivity Summary</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Staff Name</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Orders Completed</TableHead>
                    <TableHead className="text-xs">Performance Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffPerformance.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs py-2">{staff.name}</TableCell>
                      <TableCell className="text-xs py-2">{staff.role}</TableCell>
                      <TableCell className="text-xs py-2">{staff.ordersCompleted}</TableCell>
                      <TableCell className="text-xs py-2">
                        {staff.performance === "Excellent" && (
                          <span className="text-green-600">{staff.performance}</span>
                        )}
                        {staff.performance === "Good" && (
                          <span className="text-blue-600">{staff.performance}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <p className="text-sm mb-2">Staff Performance Chart</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={staffPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="ordersCompleted" fill="#FF6B9D" name="Orders Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm mb-1.5">
              <strong>Staff Insights:</strong>
            </p>
            <ul className="space-y-0.5 text-sm text-muted-foreground ml-4">
              <li>• Team completed 200 orders this period with 96% on-time delivery</li>
              <li>• Maria Santos (Head Baker) maintains highest productivity at 45 orders</li>
              <li>• Average orders per staff member: 40 orders</li>
              <li>• No safety incidents or quality complaints this period</li>
              <li>• Staff satisfaction rate: 92% based on recent survey</li>
            </ul>
          </div>
        </div>
      )}

      {/* Report Footer */}
      <div className="border-t border-muted pt-3 mt-4">
        <div className="text-center text-xs text-muted-foreground">
          <p className="mb-0.5">This report is confidential and intended for internal use only.</p>
          <p>Cake with Joy Bakery Management System</p>
          <p>Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}