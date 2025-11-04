import { useState, useEffect } from "react";
import { X, Plus, Trash2, Phone, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from 'zod';

type EmergencyContactsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
};

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  relationship: z.string().optional(),
});

const EmergencyContactsModal = ({ isOpen, onClose }: EmergencyContactsModalProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('is_primary', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } else {
      setContacts(data || []);
    }
  };

  const handleAdd = async () => {
    try {
      contactSchema.parse(newContact);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('emergency_contacts')
        .insert([{
          user_id: user.id,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship || null,
          is_primary: contacts.length === 0,
        }]);

      if (error) throw error;

      toast({
        title: "Contact Added",
        description: `${newContact.name} has been added to your emergency contacts.`,
      });

      setNewContact({ name: "", phone: "", relationship: "" });
      setIsAdding(false);
      fetchContacts();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contact Deleted",
        description: "Emergency contact has been removed.",
      });
      fetchContacts();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Emergency Contacts</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-140px)] space-y-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="p-4 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="flex gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{contact.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </p>
                  {contact.relationship && (
                    <p className="text-xs text-muted-foreground mt-1">{contact.relationship}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(contact.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {isAdding ? (
          <Card className="p-4 bg-card border-border space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Contact name"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1234567890"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship (Optional)</Label>
              <Input
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                placeholder="Friend, Family, etc."
                className="bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground">
                Save Contact
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full bg-primary text-primary-foreground"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Emergency Contact
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmergencyContactsModal;