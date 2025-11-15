import { useState, useEffect } from "react";
import { X, Plus, Trash2, Phone, User as UserIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-temp";
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
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^[+]?[\d\s\-()]+$/, 'Phone must contain only numbers, spaces, dashes, parentheses, and optional + prefix')
    .refine((val) => val.replace(/[\s\-()]/g, '').length >= 10, {
      message: 'Phone must have at least 10 digits',
    }),
  relationship: z.string().optional(),
});

const EmergencyContactsModal = ({ isOpen, onClose }: EmergencyContactsModalProps) => {
  console.log('🎨 EmergencyContactsModal rendered, isOpen:', isOpen);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const { toast } = useToast();

  console.log('📊 State:', { 
    isAdding, 
    editingId, 
    contactsCount: contacts.length,
    newContact 
  });

  useEffect(() => {
    if (isOpen) {
      console.log('📂 Modal opened, fetching contacts...');
      fetchContacts();
    }
  }, [isOpen]);

  const fetchContacts = async () => {
      // @ts-ignore - Database types will regenerate after migration deploys
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
    console.log('🚀 handleAdd called');
    console.log('📝 New contact data:', newContact);
    
    try {
      // Validate input
      console.log('✅ Validating contact data...');
      contactSchema.parse(newContact);
      console.log('✅ Validation passed');

      // Skip async auth check - let database RLS handle authentication
      // RLS will automatically use auth.uid() from the JWT token
      console.log('💾 Preparing to insert contact (RLS will handle auth)...');
      
      const contactData = {
        // Don't set user_id - let RLS handle it via auth.uid()
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship || null,
        is_primary: contacts.length === 0,
      };
      
      console.log('📦 Contact data:', contactData);
      console.log('🔄 Inserting into database...');

      // @ts-ignore - Database types will regenerate after migration deploys
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([contactData])
        .select();

      console.log('📨 Insert response:', { data, error });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Contact added successfully!');

      toast({
        title: "Contact Added",
        description: `${newContact.name} has been added to your emergency contacts.`,
      });

      setNewContact({ name: "", phone: "", relationship: "" });
      setIsAdding(false);
      fetchContacts();
    } catch (error) {
      console.error('❌❌❌ Error in handleAdd:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add contact';
        console.error('Error message:', errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship || "",
    });
    setIsAdding(true);
  };

  const handleUpdate = async () => {
    try {
      contactSchema.parse(newContact);

      // @ts-ignore - Database types will regenerate after migration deploys
      const { error } = await supabase
        .from('emergency_contacts')
        .update({
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship || null,
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "Contact Updated",
        description: `${newContact.name} has been updated.`,
      });

      setNewContact({ name: "", phone: "", relationship: "" });
      setIsAdding(false);
      setEditingId(null);
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
          description: "Failed to update contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    // @ts-ignore - Database types will regenerate after migration deploys
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

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewContact({ name: "", phone: "", relationship: "" });
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
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(contact)}
                  className="text-primary"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(contact.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {isAdding ? (
          <Card className="p-4 bg-card border-border space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newContact.name}
                onChange={(e) => {
                  console.log('📝 Name changed:', e.target.value);
                  setNewContact({ ...newContact, name: e.target.value });
                }}
                placeholder="Contact name"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => {
                  console.log('📱 Phone changed:', e.target.value);
                  setNewContact({ ...newContact, phone: e.target.value });
                }}
                placeholder="+1234567890"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship (Optional)</Label>
              <Input
                value={newContact.relationship}
                onChange={(e) => {
                  console.log('👥 Relationship changed:', e.target.value);
                  setNewContact({ ...newContact, relationship: e.target.value });
                }}
                placeholder="Friend, Family, etc."
                className="bg-background"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  console.log('🖱️🖱️🖱️ BUTTON CLICKED - Raw button event!', e);
                  console.log('Is editing?', !!editingId);
                  console.log('Current newContact:', newContact);
                  if (editingId) {
                    console.log('Calling handleUpdate...');
                    handleUpdate();
                  } else {
                    console.log('Calling handleAdd...');
                    handleAdd();
                  }
                }}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                {editingId ? "Update Contact" : "Save Contact"}
              </button>
              <Button 
                onClick={() => {
                  console.log('❌ Cancel clicked');
                  handleCancel();
                }}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            onClick={() => {
              console.log('➕ Add Emergency Contact button clicked');
              setIsAdding(true);
            }}
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