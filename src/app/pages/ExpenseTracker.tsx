import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { 
  Wallet, 
  Plus, 
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ExpenseTracker: React.FC = () => {
  const { expenses, addExpense, deleteExpense, budget, setBudget } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(budget);
  
  const [formData, setFormData] = useState({
    category: 'transport' as 'transport' | 'food' | 'accommodation' | 'other',
    amount: '',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addExpense({
      ...formData,
      amount: parseFloat(formData.amount),
    });
    
    toast.success('Expense added successfully');
    setDialogOpen(false);
    setFormData({
      category: 'transport',
      amount: '',
      description: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleBudgetUpdate = () => {
    setBudget(newBudget);
    toast.success('Budget updated');
    setBudgetDialogOpen(false);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetPercentage = (totalExpenses / budget) * 100;

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    amount,
  }));

  const categoryColors: Record<string, string> = {
    Transport: '#3b82f6',
    Food: '#10b981',
    Accommodation: '#f59e0b',
    Other: '#8b5cf6',
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport': return '🚗';
      case 'food': return '🍽️';
      case 'accommodation': return '🏨';
      default: return '📌';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Tracker</h1>
          <p className="text-gray-600">Monitor your travel and event expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Budget</DialogTitle>
                <DialogDescription>Set your monthly budget limit</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget Amount ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(parseFloat(e.target.value))}
                    min="0"
                    step="10"
                  />
                </div>
                <Button onClick={handleBudgetUpdate} className="w-full">
                  Update Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="accommodation">Accommodation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="e.g., Taxi to airport"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date & Time *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{expenses.length} transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Budget Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${budget.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Monthly allocation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${budget - totalExpenses < 0 ? 'text-red-600' : ''}`}>
              ${(budget - totalExpenses).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {budgetPercentage > 100 ? 'Over budget' : `${(100 - budgetPercentage).toFixed(0)}% available`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alert */}
      {budgetPercentage >= 90 && (
        <Card className={`border-${budgetPercentage >= 100 ? 'red' : 'yellow'}-200 bg-${budgetPercentage >= 100 ? 'red' : 'yellow'}-50`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-5 w-5 text-${budgetPercentage >= 100 ? 'red' : 'yellow'}-600 mt-0.5`} />
              <div>
                <h3 className={`font-semibold text-${budgetPercentage >= 100 ? 'red' : 'yellow'}-900`}>
                  {budgetPercentage >= 100 ? 'Budget Exceeded' : 'Budget Alert'}
                </h3>
                <p className={`text-sm text-${budgetPercentage >= 100 ? 'red' : 'yellow'}-700 mt-1`}>
                  {budgetPercentage >= 100 
                    ? `You've exceeded your budget by $${(totalExpenses - budget).toFixed(2)}`
                    : `You've used ${budgetPercentage.toFixed(0)}% of your budget. Consider reducing expenses.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Budget Usage
          </CardTitle>
          <CardDescription>Current spending vs budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                ${totalExpenses.toFixed(2)} of ${budget.toFixed(2)}
              </span>
              <span className="font-semibold">{budgetPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(budgetPercentage, 100)} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Spending by Category Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending by Category
          </CardTitle>
          <CardDescription>Breakdown of your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                {chartData.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[item.category] }}
                      />
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <span className="font-semibold">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No expenses recorded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>All your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No expenses recorded</p>
              <p className="text-sm">Click "Add Expense" to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...expenses].reverse().map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize text-xs">
                          {expense.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(parseISO(expense.date), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">${expense.amount.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteExpense(expense.id);
                        toast.success('Expense deleted');
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
