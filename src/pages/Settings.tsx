import React, { useState } from "react";
import { Save, Building, Users, Bell, Shield, Plus, Mail, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useBusinessSettings, BusinessSettings } from "@/hooks/useBusinessSettings";

export default function Settings() {
  const { users, assignRole, inviteUser, deleteUser, isSuperAdmin, fetchUsers } = useUserRoles();
  const { settings: businessSettings, loading: settingsLoading, saveSettings } = useBusinessSettings();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "user" as 'super_admin' | 'admin' | 'user'
  });
  
  // Local state for business settings form
  const [localBusinessSettings, setLocalBusinessSettings] = useState<BusinessSettings>({
    businessName: "",
    address: "",
    phone: "",
    email: "",
    taxRate: 0,
    currency: "NGN",
    lowStockThreshold: 20,
  });

  // Update local state when business settings are loaded
  React.useEffect(() => {
    if (!settingsLoading) {
      setLocalBusinessSettings(businessSettings);
    }
  }, [businessSettings, settingsLoading]);

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    creditOverdueAlerts: true,
    dailySummaryEmail: false,
    salesNotifications: true,
  });

  const handleSaveBusinessSettings = async () => {
    const { error } = await saveSettings(localBusinessSettings);
    if (error) {
      console.error('Error saving business settings:', error);
    }
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notifications updated!",
      description: "Notification preferences have been saved.",
    });
  };

  const handleRoleChange = async (userId: string, newRole: 'super_admin' | 'admin' | 'user') => {
    const { error } = await assignRole(userId, newRole);
    if (!error) {
      await fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
  };

  const handleInviteUser = async () => {
    if (!newInvite.email || !newInvite.role) {
      toast({
        title: "Missing information",
        description: "Please provide email and role.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await inviteUser(newInvite.email, newInvite.role);
    if (!error) {
      setNewInvite({ email: "", role: "user" });
      setIsInviteDialogOpen(false);
      await fetchUsers();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your business settings and preferences</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>Configure your business details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={localBusinessSettings.businessName}
                    onChange={(e) => setLocalBusinessSettings({ ...localBusinessSettings, businessName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={localBusinessSettings.currency} 
                    onValueChange={(value) => setLocalBusinessSettings({ ...localBusinessSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={localBusinessSettings.address}
                  onChange={(e) => setLocalBusinessSettings({ ...localBusinessSettings, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-phone">Phone Number</Label>
                  <Input
                    id="business-phone"
                    value={localBusinessSettings.phone}
                    onChange={(e) => setLocalBusinessSettings({ ...localBusinessSettings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="business-email">Email Address</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={localBusinessSettings.email}
                    onChange={(e) => setLocalBusinessSettings({ ...localBusinessSettings, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={localBusinessSettings.taxRate}
                    onChange={(e) => setLocalBusinessSettings({ ...localBusinessSettings, taxRate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="stock-threshold"
                    type="number"
                    min="0"
                    value={localBusinessSettings.lowStockThreshold}
                    onChange={(e) => setLocalBusinessSettings({ ...localBusinessSettings, lowStockThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBusinessSettings} className="bg-gradient-primary">
                  <Save className="mr-2 h-4 w-4" />
                  Save Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          {isSuperAdmin ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    User Management
                  </div>
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Invite User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                          Send an invitation email with temporary login credentials.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address *</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={newInvite.email}
                            onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role *</Label>
                          <Select 
                            value={newInvite.role} 
                            onValueChange={(value: 'super_admin' | 'admin' | 'user') => setNewInvite({ ...newInvite, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteUser} className="bg-gradient-primary">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invitation
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select 
                            value={user.role} 
                            onValueChange={(newRole: 'super_admin' | 'admin' | 'user') => handleRoleChange(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Badge variant={
                              user.role === "super_admin" ? "default" : 
                              user.role === "admin" ? "secondary" : "outline"
                            }>
                              {user.role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{user.full_name || user.email}"? 
                                    This action cannot be undone and will permanently remove the user from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Only super administrators can manage users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">You don't have permission to view this section.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when product stock falls below threshold
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, lowStockAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Credit Overdue Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for overdue customer credits
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.creditOverdueAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, creditOverdueAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Summary Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily sales and inventory summary via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailySummaryEmail}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, dailySummaryEmail: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sales Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications for new sales
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.salesNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, salesNotifications: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings} className="bg-gradient-primary">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security & Audit
              </CardTitle>
              <CardDescription>Security settings and audit trail configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Password Policy</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">• Minimum 8 characters</p>
                    <p className="text-sm text-muted-foreground">• At least 1 uppercase letter</p>
                    <p className="text-sm text-muted-foreground">• At least 1 number</p>
                    <p className="text-sm text-muted-foreground">• At least 1 special character</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Session Settings</h3>
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Select defaultValue="60">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Audit Trail</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Track all user actions and changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div>
                  <Label htmlFor="log-retention">Log Retention Period</Label>
                  <Select defaultValue="365">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-gradient-primary">
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
