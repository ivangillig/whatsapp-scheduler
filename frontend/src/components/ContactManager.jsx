import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  X,
  Search,
  Phone,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function ContactManager({ contacts, onAddContact, onDeleteContact }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const filteredContacts = contacts.filter((contact) => {
    const name = (
      contact.name ||
      contact.notify ||
      contact.jid ||
      ""
    ).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    setIsAdding(true);
    const result = await onAddContact({
      phone: newPhone,
      name: newName || newPhone,
    });

    if (result) {
      setNewPhone("");
      setNewName("");
      setShowAddForm(false);
    }
    setIsAdding(false);
  };

  const handleDelete = async (jid, name) => {
    if (confirm(`¿Eliminar a ${name || "este contacto"}?`)) {
      await onDeleteContact(jid);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Contactos</CardTitle>
              <CardDescription>
                {contacts.length} contactos guardados
              </CardDescription>
            </div>
          </div>
          <Button
            variant={showAddForm ? "ghost" : "default"}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulario agregar contacto */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 p-4 bg-slate-50 rounded-xl border"
          >
            <h3 className="text-sm font-medium mb-4">Nuevo Contacto</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Número de teléfono</Label>
                <Input
                  type="text"
                  placeholder="5491155551234 (con código de país)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Sin espacios, sin + ni guiones
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nombre (opcional)</Label>
                <Input
                  type="text"
                  placeholder="Nombre del contacto"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!newPhone.trim() || isAdding}
                className="w-full"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Guardar Contacto
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de contactos */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">
              {contacts.length === 0 ? "No hay contactos" : "Sin resultados"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {contacts.length === 0
                ? "Agrega tu primer contacto"
                : "Prueba con otra búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.jid}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(contact.name || contact.notify || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {contact.name || contact.notify || "Sin nombre"}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      +{contact.jid?.replace("@s.whatsapp.net", "")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleDelete(contact.jid, contact.name || contact.notify)
                  }
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContactManager;
