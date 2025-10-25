import { Alert, Card, Skeleton, Space, Tooltip, Typography } from "antd";
import { Server } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FC } from "react";

type TimeClockProps = {
    apiUrl: string; 
    timeZone?: string; 
    hour12?: boolean; 
    showSeconds?: boolean; 
    resyncMs?: number; 
    title?: string;
};
const AntdServerClock: FC<TimeClockProps> = ({
  apiUrl,
  timeZone,
  hour12 = false,
  showSeconds = true,
  resyncMs = 60000,
  title = "Server Time",
}) => {
  const [offsetMs, setOffsetMs] = useState<number | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const resyncRef = useRef<number | null>(null);

  const fetchOffset = async () => {
    try {
      setError(null);
      const t0 = Date.now();
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json(); // { utc: "2025-09-17T07:00:01.234Z" }
      const t1 = Date.now();
      const rttHalf = (t1 - t0) / 2;
      const serverUtcMs = new Date(json.utc).getTime();
      const clientUtcMs = t1;
      setOffsetMs(serverUtcMs + rttHalf - clientUtcMs); // hiệu chỉnh trễ mạng
    } catch (e: any) {
      setError(e?.message ?? "Fetch failed");
    }
  };

  useEffect(() => {
    fetchOffset();
    if (resyncMs > 0) {
      resyncRef.current = window.setInterval(fetchOffset, resyncMs) as unknown as number;
    }
    return () => {
      if (resyncRef.current) clearInterval(resyncRef.current);
    };
  }, [apiUrl, resyncMs]);

  useEffect(() => {
    // Căn đầu giây
    const start = () => {
      const delay = 1000 - (Date.now() % 1000);
      const t = window.setTimeout(() => {
        setNow(new Date());
        tickRef.current = window.setInterval(() => setNow(new Date()), 1000) as unknown as number;
      }, delay);
      return () => {
        clearTimeout(t);
        if (tickRef.current) clearInterval(tickRef.current);
      };
    };
    const cleanup = start();
    return cleanup;
  }, []);

  const formatter = useMemo(() => new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12,
    timeZone,
  }), [timeZone, hour12, showSeconds]);

  const displayDate = useMemo(() => {
    const base = offsetMs === null ? now : new Date(now.getTime() + offsetMs);
    return formatter.format(base);
  }, [now, offsetMs, formatter]);

  const dateTimeIso = useMemo(() => {
    const base = offsetMs === null ? now : new Date(now.getTime() + offsetMs);
    return base.toISOString();
  }, [now, offsetMs]);

  return (
    <Card
      size="small"
      bordered
      title={<Space><Server />{title}</Space>}
      style={{ width: 300, borderRadius: 12 }}
      extra={timeZone ? <Typography.Text type="secondary">{timeZone}</Typography.Text> : null}
    >
      {offsetMs === null ? (
        <Skeleton active paragraph={false} title />
      ) : (
        <>
          <Tooltip title={timeZone ?? "Converted from server UTC"}>
            <Typography.Title level={2} style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {displayDate}
            </Typography.Title>
          </Tooltip>
        </>
      )}

      {error && (
        <div style={{ marginTop: 8 }}>
          <Alert type="warning" showIcon message="Cannot sync with server" description={error} />
        </div>
      )}
    </Card>
  );
};

export default AntdServerClock;