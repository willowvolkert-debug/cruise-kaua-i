import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatHST } from "@/lib/formatHST";
import { MessageSquare, Mail, AlertCircle, Info, ChevronRight } from "lucide-react";

const messageTypeConfig = {
  warning: { badge: "bg-red-100 text-red-700", icon: AlertCircle, label: "warning" },
  info: { badge: "bg-blue-100 text-blue-700", icon: Info, label: "info" },
  action_required: { badge: "bg-orange-100 text-orange-700", icon: AlertCircle, label: "action required" },
};

export default function AdminMessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const allMessages = await base44.entities.AdminMessage.list("-created_date", 200);
      setMessages(allMessages);
    } catch (e) {
      console.error("Error loading admin messages:", e);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading messages...</div>;

  const unread = messages.filter(m => !m.is_read);
  const warnings = messages.filter(m => m.message_type === "warning");
  const actionRequired = messages.filter(m => m.message_type === "action_required");

  return (
    <Card className="shadow-md bg-white border-gray-200 rounded-3xl">
      <CardHeader>
        <CardTitle className="text-xl text-secondary flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          admin messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs md:text-sm py-2">
              all ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs md:text-sm py-2">
              unread ({unread.length})
            </TabsTrigger>
            <TabsTrigger value="warnings" className="text-xs md:text-sm py-2">
              warnings ({warnings.length})
            </TabsTrigger>
            <TabsTrigger value="action" className="text-xs md:text-sm py-2">
              action req. ({actionRequired.length})
            </TabsTrigger>
          </TabsList>

          {["all", "unread", "warnings", "action"].map(tab => {
            const filtered = tab === "all" ? messages
              : tab === "unread" ? unread
              : tab === "warnings" ? warnings
              : actionRequired;

            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No messages to show.</p>
                  ) : (
                    filtered.map(msg => {
                      const config = messageTypeConfig[msg.message_type] || messageTypeConfig.info;
                      const Icon = config.icon;
                      const isExpanded = expandedId === msg.id;

                      return (
                        <div key={msg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <Mail className={`w-4 h-4 shrink-0 ${msg.is_read ? "text-gray-300" : "text-primary"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-secondary text-sm truncate">{msg.subject}</p>
                                <Badge className={`text-xs ${config.badge}`}>{config.label}</Badge>
                                {!msg.is_read && (
                                  <Badge className="text-xs bg-primary text-white">new</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                to: {msg.recipient_name} ({msg.recipient_email || "no email"}) · {msg.created_date ? formatHST(msg.created_date, "MMM d, h:mm a") + " HST" : ""}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                              <div className="mt-3 p-3 bg-gray-50 rounded-xl whitespace-pre-wrap text-sm text-gray-800">
                                {msg.message}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span>ID: {msg.id}</span>
                                {msg.recipient_id && <span>User: {msg.recipient_id.substring(0, 10)}…</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}