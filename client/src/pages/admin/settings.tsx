import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, 
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  Users,
  Key,
  ShieldCheck,
  Globe,
  Mail,
  Database,
  Copy
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/admin-context";

// Mock settings data
const generalSettings = {
  siteName: "LuckyPunt Casino",
  siteDescription: "The ultimate online slots casino experience",
  supportEmail: "support@luckypunt.com",
  logoUrl: "/logo.png",
  maintenanceMode: false,
  currency: "USD",
  defaultLanguage: "en",
};

const securitySettings = {
  sessionTimeout: "60", // minutes
  maxLoginAttempts: "5",
  requireEmailVerification: true,
  twoFactorAuthentication: false,
  passwordMinLength: "8",
  passwordRequireSpecialChars: true,
  passwordRequireNumbers: true,
  passwordRequireUppercase: true,
};

const gameSettings = {
  defaultRTP: "96", // percentage
  maxJackpot: "100000", // in currency
  minBet: "0.10", // in currency
  maxBet: "500", // in currency
  defaultAutoplayRounds: "10",
  showRTP: true,
  showJackpotHistory: true,
  disabledGames: ["game123", "game456"],
};

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  lastLogin: string;
  active: boolean;
}

// Mock admin users for the user management tab
const mockAdminUsers: AdminUser[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@luckypunt.com",
    role: "admin",
    lastLogin: "2025-05-12T08:45:00Z",
    active: true
  },
  {
    id: 2,
    username: "moderator",
    email: "moderator@luckypunt.com",
    role: "moderator",
    lastLogin: "2025-05-10T14:30:00Z",
    active: true
  },
  {
    id: 3,
    username: "support",
    email: "support@luckypunt.com",
    role: "support",
    lastLogin: "2025-05-11T09:15:00Z",
    active: true
  }
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { admin } = useAdmin();
  const [activeTab, setActiveTab] = useState("general");
  
  // Form state for each settings section
  const [formGeneral, setFormGeneral] = useState(generalSettings);
  const [formSecurity, setFormSecurity] = useState(securitySettings);
  const [formGame, setFormGame] = useState(gameSettings);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("support");
  
  // In a real implementation, we would fetch these from the API
  const { data: adminUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => Promise.resolve(mockAdminUsers),
  });

  // Handle form input change for general settings
  const handleGeneralChange = (field: keyof typeof generalSettings, value: any) => {
    setFormGeneral(prev => ({ ...prev, [field]: value }));
  };

  // Handle form input change for security settings
  const handleSecurityChange = (field: keyof typeof securitySettings, value: any) => {
    setFormSecurity(prev => ({ ...prev, [field]: value }));
  };

  // Handle form input change for game settings
  const handleGameChange = (field: keyof typeof gameSettings, value: any) => {
    setFormGame(prev => ({ ...prev, [field]: value }));
  };

  // Save settings - would actually send to API in real implementation
  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section.charAt(0).toUpperCase() + section.slice(1)} settings have been updated successfully.`,
    });
  };

  // Send invite - would actually send to API in real implementation
  const handleSendInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${inviteEmail} for the ${inviteRole} role.`,
    });
    
    setInviteEmail("");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="users">Admin Users</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic site settings and appearance options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={formGeneral.siteName}
                      onChange={(e) => handleGeneralChange("siteName", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={formGeneral.supportEmail}
                      onChange={(e) => handleGeneralChange("supportEmail", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={formGeneral.siteDescription}
                    onChange={(e) => handleGeneralChange("siteDescription", e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formGeneral.currency}
                      onValueChange={(value) => handleGeneralChange("currency", value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Default Language</Label>
                    <Select
                      value={formGeneral.defaultLanguage}
                      onValueChange={(value) => handleGeneralChange("defaultLanguage", value)}
                    >
                      <SelectTrigger id="defaultLanguage">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the site will display a maintenance message to all users.
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={formGeneral.maintenanceMode}
                    onCheckedChange={(checked) => handleGeneralChange("maintenanceMode", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  className="gap-2"
                  onClick={() => handleSaveSettings("general")}
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security options for user accounts and authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={formSecurity.sessionTimeout}
                      onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={formSecurity.maxLoginAttempts}
                      onChange={(e) => handleSecurityChange("maxLoginAttempts", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Password Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={formSecurity.passwordMinLength}
                        onChange={(e) => handleSecurityChange("passwordMinLength", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-4 pt-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="passwordRequireSpecialChars"
                          checked={formSecurity.passwordRequireSpecialChars}
                          onCheckedChange={(checked) => handleSecurityChange("passwordRequireSpecialChars", checked)}
                        />
                        <Label htmlFor="passwordRequireSpecialChars">Require special characters</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="passwordRequireNumbers"
                          checked={formSecurity.passwordRequireNumbers}
                          onCheckedChange={(checked) => handleSecurityChange("passwordRequireNumbers", checked)}
                        />
                        <Label htmlFor="passwordRequireNumbers">Require numbers</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="passwordRequireUppercase"
                          checked={formSecurity.passwordRequireUppercase}
                          onCheckedChange={(checked) => handleSecurityChange("passwordRequireUppercase", checked)}
                        />
                        <Label htmlFor="passwordRequireUppercase">Require uppercase letters</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireEmailVerification">Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email verification before new users can log in.
                    </p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={formSecurity.requireEmailVerification}
                    onCheckedChange={(checked) => handleSecurityChange("requireEmailVerification", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="twoFactorAuthentication">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require two-factor authentication for all admin users.
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuthentication"
                    checked={formSecurity.twoFactorAuthentication}
                    onCheckedChange={(checked) => handleSecurityChange("twoFactorAuthentication", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  className="gap-2"
                  onClick={() => handleSaveSettings("security")}
                >
                  <ShieldCheck size={16} />
                  <span>Save Security Settings</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Games Settings Tab */}
          <TabsContent value="games" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>
                  Configure settings for games and gameplay features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRTP">Default RTP (%)</Label>
                    <Input
                      id="defaultRTP"
                      type="number"
                      value={formGame.defaultRTP}
                      onChange={(e) => handleGameChange("defaultRTP", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxJackpot">Maximum Jackpot</Label>
                    <Input
                      id="maxJackpot"
                      type="number"
                      value={formGame.maxJackpot}
                      onChange={(e) => handleGameChange("maxJackpot", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minBet">Minimum Bet</Label>
                    <Input
                      id="minBet"
                      type="number"
                      step="0.01"
                      value={formGame.minBet}
                      onChange={(e) => handleGameChange("minBet", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxBet">Maximum Bet</Label>
                    <Input
                      id="maxBet"
                      type="number"
                      value={formGame.maxBet}
                      onChange={(e) => handleGameChange("maxBet", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultAutoplayRounds">Default Autoplay Rounds</Label>
                  <Select
                    value={formGame.defaultAutoplayRounds}
                    onValueChange={(value) => handleGameChange("defaultAutoplayRounds", value)}
                  >
                    <SelectTrigger id="defaultAutoplayRounds">
                      <SelectValue placeholder="Select default rounds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 rounds</SelectItem>
                      <SelectItem value="10">10 rounds</SelectItem>
                      <SelectItem value="20">20 rounds</SelectItem>
                      <SelectItem value="50">50 rounds</SelectItem>
                      <SelectItem value="100">100 rounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showRTP">Show RTP Information</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the Return to Player percentage on game information.
                    </p>
                  </div>
                  <Switch
                    id="showRTP"
                    checked={formGame.showRTP}
                    onCheckedChange={(checked) => handleGameChange("showRTP", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showJackpotHistory">Show Jackpot History</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the history of jackpot wins to players.
                    </p>
                  </div>
                  <Switch
                    id="showJackpotHistory"
                    checked={formGame.showJackpotHistory}
                    onCheckedChange={(checked) => handleGameChange("showJackpotHistory", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  className="gap-2"
                  onClick={() => handleSaveSettings("game")}
                >
                  <Save size={16} />
                  <span>Save Game Settings</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Admin Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>
                  Manage admin accounts and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-3 font-medium">ID</th>
                        <th className="text-left pb-3 font-medium">Username</th>
                        <th className="text-left pb-3 font-medium">Email</th>
                        <th className="text-left pb-3 font-medium">Role</th>
                        <th className="text-left pb-3 font-medium">Last Login</th>
                        <th className="text-left pb-3 font-medium">Status</th>
                        <th className="text-right pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!isLoadingUsers && adminUsers && adminUsers.length > 0 ? (
                        adminUsers.map((user) => (
                          <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800">
                            <td className="py-3">{user.id}</td>
                            <td className="py-3">{user.username}</td>
                            <td className="py-3">{user.email}</td>
                            <td className="py-3 capitalize">{user.role}</td>
                            <td className="py-3">{formatDate(user.lastLogin)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {user.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={user.id === admin?.id}
                              >
                                {user.active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-4 text-center">
                            {isLoadingUsers ? "Loading..." : "No admin users found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Invite New Admin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="inviteEmail" className="sr-only">Email Address</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="inviteRole" className="sr-only">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={setInviteRole}
                      >
                        <SelectTrigger id="inviteRole">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    className="gap-2"
                    onClick={handleSendInvite}
                  >
                    <Mail size={16} />
                    <span>Send Invitation</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  View system details and perform maintenance tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Database</h3>
                    <p className="text-sm text-muted-foreground">Connected to PostgreSQL via Supabase</p>
                    <p className="text-sm text-muted-foreground">Last backup: May 11, 2025, 03:00 AM UTC</p>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                      >
                        <Database size={14} />
                        <span>Backup Now</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                      >
                        <FileText size={14} />
                        <span>View Logs</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Cache</h3>
                    <p className="text-sm text-muted-foreground">Game cache: 245 items</p>
                    <p className="text-sm text-muted-foreground">User cache: 128 items</p>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                      >
                        <RefreshCw size={14} />
                        <span>Clear Cache</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-2">API Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="apiKey"
                          type="password"
                          value="••••••••••••••••••••••••••••••••"
                          disabled
                        />
                        <Button 
                          variant="outline" 
                          className="shrink-0"
                          onClick={() => {
                            toast({
                              title: "API key copied",
                              description: "The API key has been copied to your clipboard.",
                            });
                          }}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <Button 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => {
                          toast({
                            title: "API key regenerated",
                            description: "A new API key has been generated.",
                          });
                        }}
                      >
                        <Key size={16} />
                        <span>Regenerate Key</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="gap-1"
                      >
                        <Globe size={16} />
                        <span>API Docs</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}