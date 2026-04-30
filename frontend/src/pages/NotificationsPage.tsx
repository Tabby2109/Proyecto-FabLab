import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, NotificationItem } from "../lib/api";

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("es-CL");
}

export function NotificationsPage() {
  const { refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      const response = await api.getNotifications();
      setNotifications(response.items);
      await refreshNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones.");
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function markRead(notificationId: string) {
    await api.markNotificationRead(notificationId, true);
    await loadNotifications();
  }

  if (error) {
    return <div className="content-card feedback-error">{error}</div>;
  }

  return (
    <div className="portal-page notifications-page">
      <div className="breadcrumb">Inicio &gt; notificaciones</div>
      <h1 className="page-title">Notificaciones</h1>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <article key={notification.id} className={notification.readAt ? "content-card notification-card" : "content-card notification-card notification-card-unread"}>
              <div className="notification-head">
                <div className="notification-title">
                  <Bell size={18} />
                  <strong>{notification.title}</strong>
                </div>
                {!notification.readAt ? (
                  <button type="button" className="secondary-button" onClick={() => void markRead(notification.id)}>
                    <CheckCheck size={16} />
                    <span>Marcar leida</span>
                  </button>
                ) : null}
              </div>
              <p>{notification.body}</p>
              <div className="notification-meta">
                <span>{formatDateTime(notification.createdAt)}</span>
                {notification.linkUrl ? <Link to={notification.linkUrl}>Abrir detalle</Link> : null}
              </div>
            </article>
          ))
        ) : (
          <div className="content-card">No hay notificaciones registradas.</div>
        )}
      </div>
    </div>
  );
}
