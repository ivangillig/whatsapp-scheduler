import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  CalendarPlus,
  Wifi,
  WifiOff,
  LogOut,
} from "lucide-react";
import WhatsAppStatus from "./components/WhatsAppStatus";
import ScheduleMessage from "./components/ScheduleMessage";
import MessageList from "./components/MessageList";
import ContactManager from "./components/ContactManager";
import Login from "./components/Login";

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({
    connected: false,
    qr: null,
    user: null,
  });
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  // Conectar socket solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("auth_token");
    const newSocket = io(API_URL || window.location.origin, {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
      if (err.message.includes("Autenticación")) {
        setIsAuthenticated(false);
      }
    });

    newSocket.on("whatsapp-status", (status) => {
      setWhatsappStatus(status);
      if (status.connected) {
        fetchContacts();
      }
    });

    newSocket.on("whatsapp-qr", (qr) => {
      setWhatsappStatus((prev) => ({ ...prev, qr, connected: false }));
    });

    newSocket.on("contacts-updated", () => {
      fetchContacts();
    });

    newSocket.on("message-updated", () => {
      fetchMessages();
    });

    fetchStatus();
    fetchContacts();
    fetchMessages();

    return () => newSocket.close();
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/auth/check`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      setUsername(data.username || "");
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = (user, token) => {
    localStorage.setItem("auth_token", token);
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleAppLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setUsername("");
    socket?.close();
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
      throw new Error("No autorizado");
    }
    return res;
  };

  const fetchStatus = async () => {
    try {
      const res = await fetchWithAuth("/api/whatsapp/status");
      const data = await res.json();
      setWhatsappStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetchWithAuth("/api/contacts");
      const data = await res.json();
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetchWithAuth("/api/messages");
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleWhatsAppLogout = async () => {
    try {
      await fetchWithAuth("/api/whatsapp/logout", { method: "POST" });
      setContacts([]);
    } catch (error) {
      console.error("Error logging out WhatsApp:", error);
    }
  };

  const handleScheduleMessage = async (messageData) => {
    try {
      const res = await fetchWithAuth("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      if (res.ok) {
        fetchMessages();
        return true;
      }
    } catch (error) {
      console.error("Error scheduling message:", error);
    }
    return false;
  };

  const handleDeleteMessage = async (id) => {
    try {
      await fetchWithAuth(`/api/messages/${id}`, { method: "DELETE" });
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleAddContact = async (contactData) => {
    try {
      const res = await fetchWithAuth("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });
      if (res.ok) {
        fetchContacts();
        return true;
      }
    } catch (error) {
      console.error("Error adding contact:", error);
    }
    return false;
  };

  const handleDeleteContact = async (jid) => {
    try {
      const res = await fetchWithAuth(
        `/api/contacts/${encodeURIComponent(jid)}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        fetchContacts();
        return true;
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
    return false;
  };

  // Mostrar loading mientras verifica auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const pendingCount = messages.filter((m) => m.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gorda's Schedule App</h1>
                <p className="text-xs text-muted-foreground">Hola genia!</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {whatsappStatus.connected ? (
                <>
                  <Badge
                    variant="default"
                    className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                  >
                    <Wifi className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                  {pendingCount > 0 && (
                    <Badge variant="secondary">{pendingCount} pendientes</Badge>
                  )}
                </>
              ) : (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-700 border-red-200"
                >
                  <WifiOff className="w-3 h-3 mr-1" />
                  Desconectado
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleAppLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Estado de WhatsApp */}
        <WhatsAppStatus
          status={whatsappStatus}
          onLogout={handleWhatsAppLogout}
          contactCount={contacts.length}
        />

        {/* Contenido principal */}
        {whatsappStatus.connected && (
          <Tabs defaultValue="schedule" className="mt-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="schedule" className="gap-2">
                <CalendarPlus className="w-4 h-4" />
                Programar
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Mensajes
                {messages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {messages.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <Users className="w-4 h-4" />
                Contactos
                {contacts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {contacts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              <ScheduleMessage
                contacts={contacts}
                onSchedule={handleScheduleMessage}
              />
            </TabsContent>

            <TabsContent value="messages">
              <MessageList
                messages={messages}
                onDelete={handleDeleteMessage}
                onRefresh={fetchMessages}
              />
            </TabsContent>

            <TabsContent value="contacts">
              <ContactManager
                contacts={contacts}
                onAddContact={handleAddContact}
                onDeleteContact={handleDeleteContact}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

export default App;
