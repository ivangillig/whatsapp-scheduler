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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronsUpDown,
  CalendarIcon,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function ScheduleMessage({ contacts, onSchedule }) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedContact || !message || !scheduledDate || !scheduledTime) {
      alert("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);

    const dateStr = format(scheduledDate, "yyyy-MM-dd");
    const scheduledAt = new Date(`${dateStr}T${scheduledTime}`).toISOString();

    const result = await onSchedule({
      contactJid: selectedContact.jid,
      contactName:
        selectedContact.name || selectedContact.notify || selectedContact.jid,
      message,
      scheduledAt,
    });

    setIsSubmitting(false);

    if (result) {
      setSuccess(true);
      setSelectedContact(null);
      setMessage("");
      setScheduledDate(null);
      setScheduledTime("");
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CalendarPlus className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle>Programar Mensaje</CardTitle>
            <CardDescription>Envía mensajes automáticamente</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-6 bg-emerald-50 border-emerald-200 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              ¡Mensaje programado correctamente!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector de contacto - Combobox */}
          <div className="space-y-2">
            <Label>Destinatario</Label>
            <Popover open={openContact} onOpenChange={setOpenContact}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openContact}
                  className="w-full justify-between font-normal h-10"
                >
                  {selectedContact ? (
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                        {(selectedContact.name ||
                          selectedContact.notify ||
                          "?")[0].toUpperCase()}
                      </div>
                      {selectedContact.name ||
                        selectedContact.notify ||
                        selectedContact.jid?.replace("@s.whatsapp.net", "")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Seleccionar contacto...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Buscar contacto..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-4 text-center">
                        <User className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No hay contactos
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Agrega contactos en la pestaña "Contactos"
                        </p>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact.jid}
                          value={contact.name || contact.notify || contact.jid}
                          onSelect={() => {
                            setSelectedContact(contact);
                            setOpenContact(false);
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              selectedContact?.jid === contact.jid
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          >
                            {(contact.name ||
                              contact.notify ||
                              "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {contact.name || contact.notify || "Sin nombre"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              +{contact.jid?.replace("@s.whatsapp.net", "")}
                            </div>
                          </div>
                          {selectedContact?.jid === contact.jid && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal h-10 ${
                      !scheduledDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate
                      ? format(scheduledDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      setScheduledDate(date);
                      setOpenCalendar(false);
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {message.length} caracteres
              </span>
              {selectedContact && (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedContact.name || selectedContact.notify}
                </span>
              )}
            </div>
          </div>

          {/* Botón enviar */}
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedContact ||
              !message ||
              !scheduledDate ||
              !scheduledTime
            }
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Programando...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Programar Mensaje
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ScheduleMessage;
