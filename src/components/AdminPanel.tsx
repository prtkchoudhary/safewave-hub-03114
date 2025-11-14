import { useState, useEffect } from "react";
import { Shield, Users, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-temp";

type UserWithRole = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

const AdminPanel = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // @ts-ignore - Database types will regenerate after migration deploys
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email');

    if (profiles) {
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile: any) => {
          // @ts-ignore - Database types will regenerate after migration deploys
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .eq('role', 'admin')
            .maybeSingle();

          return {
            id: profile.id,
            email: profile.email,
            role: roleData ? 'admin' as const : 'user' as const,
          };
        })
      );

      setUsers(usersWithRoles);
    }
  };

  const toggleAdmin = async (userId: string, currentRole: 'admin' | 'user') => {
    try {
      if (currentRole === 'admin') {
        // Remove admin role
        // @ts-ignore - Database types will regenerate after migration deploys
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: "Admin Removed",
          description: "User is now a regular user.",
        });
      } else {
        // Add admin role
        // @ts-ignore - Database types will regenerate after migration deploys
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: 'admin' }]);

        if (error) throw error;

        toast({
          title: "Admin Added",
          description: "User is now an administrator.",
        });
      }

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Admin Panel</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Users className="w-4 h-4" />
          <span>{users.length} total users</span>
        </div>

        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
          >
            <div className="flex items-center gap-2">
              {user.role === 'admin' && <Crown className="w-4 h-4 text-accent" />}
              <span className="text-sm font-medium text-foreground">{user.email}</span>
            </div>
            <Button
              size="sm"
              variant={user.role === 'admin' ? 'destructive' : 'default'}
              onClick={() => toggleAdmin(user.id, user.role)}
              className="text-xs"
            >
              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AdminPanel;