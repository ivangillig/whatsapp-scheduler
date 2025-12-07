import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Loader2, CheckCircle2 } from "lucide-react";

function WhatsAppStatus({ status, onLogout, contactCount }) {
  const { connected, qr, user } = status;

  if (connected) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {user?.name ||
                    user?.id?.split(":")[0] ||
                    "WhatsApp Conectado"}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {contactCount} contactos
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8">
        {qr ? (
          <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Vincular WhatsApp</h2>
              <p className="text-muted-foreground">
                Escanea el código QR con tu teléfono
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-white p-4 rounded-2xl shadow-lg border">
                <img src={qr} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 border rounded-xl max-w-sm">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-foreground">
                  ¿Cómo vincular?
                </span>
                <br />
                Abre WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular
                dispositivo
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-6 text-lg">Conectando con WhatsApp...</p>
            <p className="text-muted-foreground text-sm mt-2">
              Esto puede tomar unos segundos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WhatsAppStatus;
