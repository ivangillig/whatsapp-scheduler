import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Trash2,
} from "lucide-react";

function MessageList({ messages, onDelete, onRefresh }) {
  const getStatusInfo = (status) => {
    const info = {
      pending: {
        variant: "secondary",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Pendiente",
        icon: <Clock className="w-3 h-3" />,
      },
      sent: {
        variant: "secondary",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        label: "Enviado",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      failed: {
        variant: "destructive",
        className: "bg-red-100 text-red-700 border-red-200",
        label: "Fallido",
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    return info[status] || info.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const pendingMessages = messages.filter((m) => m.status === "pending");
  const sentMessages = messages.filter((m) => m.status === "sent");
  const failedMessages = messages.filter((m) => m.status === "failed");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Mensajes Programados</CardTitle>
              <CardDescription>
                {pendingMessages.length} pendientes · {sentMessages.length}{" "}
                enviados · {failedMessages.length} fallidos
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No hay mensajes programados</p>
            <p className="text-muted-foreground text-sm mt-1">
              Programa tu primer mensaje en la pestaña "Programar"
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const status = getStatusInfo(msg.status);
              return (
                <div
                  key={msg.id}
                  className="bg-slate-50 rounded-xl p-4 border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(msg.contact_name || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {msg.contact_name ||
                              msg.contact_jid?.replace("@s.whatsapp.net", "")}
                          </span>
                        </div>
                        <Badge
                          variant={status.variant}
                          className={status.className}
                        >
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>

                      <p className="text-muted-foreground text-sm mb-3 whitespace-pre-wrap line-clamp-3">
                        {msg.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(msg.scheduled_at)}
                        </span>
                        {msg.sent_at && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {formatDate(msg.sent_at)}
                          </span>
                        )}
                      </div>

                      {msg.error_message && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                          {msg.error_message}
                        </p>
                      )}
                    </div>

                    {msg.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            confirm("¿Estás seguro de eliminar este mensaje?")
                          ) {
                            onDelete(msg.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MessageList;
