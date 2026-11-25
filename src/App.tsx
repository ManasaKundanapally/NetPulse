import './App.css';
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, LayoutDashboard, Router, Shield, Bell, Search, Server,
  CheckCircle, XCircle, AlertTriangle, Moon, Sun, Wifi, Plus, Trash2,
  Download, Filter, X, RefreshCw, MapPin, Cpu, Clock, ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';

type Status = 'Online' | 'Offline' | 'Warning';
type Device = {
  id: number;
  name: string;
  type: string;
  ip: string;
  location: string;
  status: Status;
  uptime: number;
  cpu: number;
  lastSeen: string;
};
type AlertItem = {
  id: number;
  title: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info';
  time: string;
  device?: string;
};

const initialDevices: Device[] = [
  { id: 1, name: 'Core-Router-01', type: 'Router', ip: '192.168.1.1', location: 'Hyderabad', status: 'Online', uptime: 99.9, cpu: 34, lastSeen: 'Just now' },
  { id: 2, name: 'Switch-Floor-02', type: 'Switch', ip: '192.168.1.2', location: 'Bengaluru', status: 'Online', uptime: 98.7, cpu: 41, lastSeen: 'Just now' },
  { id: 3, name: 'Firewall-Main', type: 'Firewall', ip: '192.168.1.3', location: 'Mumbai', status: 'Warning', uptime: 94.2, cpu: 86, lastSeen: '1 min ago' },
  { id: 4, name: 'Branch-Router-04', type: 'Router', ip: '192.168.1.4', location: 'Chennai', status: 'Offline', uptime: 82.1, cpu: 0, lastSeen: '12 min ago' },
  { id: 5, name: 'Switch-Floor-05', type: 'Switch', ip: '192.168.1.5', location: 'Hyderabad', status: 'Online', uptime: 99.5, cpu: 28, lastSeen: 'Just now' },
];

const initialAlerts: AlertItem[] = [
  { id: 1, title: 'Device Offline', message: 'Branch-Router-04 is unreachable.', severity: 'Critical', time: '12 min ago', device: 'Branch-Router-04' },
  { id: 2, title: 'High CPU Usage', message: 'Firewall-Main CPU utilization is above 80%.', severity: 'Warning', time: '5 min ago', device: 'Firewall-Main' },
  { id: 3, title: 'Packet Loss Detected', message: 'Packet loss threshold exceeded on branch network.', severity: 'Warning', time: '18 min ago' },
  { id: 4, title: 'Configuration Updated', message: 'Switch-Floor-02 configuration was updated.', severity: 'Info', time: '1 hr ago', device: 'Switch-Floor-02' },
];

const trafficSeed = [
  { time: '00:00', download: 18, upload: 8 },
  { time: '03:00', download: 12, upload: 6 },
  { time: '06:00', download: 24, upload: 11 },
  { time: '09:00', download: 42, upload: 19 },
  { time: '12:00', download: 56, upload: 28 },
  { time: '15:00', download: 48, upload: 22 },
  { time: '18:00', download: 68, upload: 34 },
  { time: '21:00', download: 38, upload: 17 },
];

const statusColors = {
  Online: '#66a47c',
  Warning: '#e7a443',
  Offline: '#e26b6b'
};

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) as T : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [devices, setDevices] = useState<Device[]>(() => readStorage('netpulse-devices', initialDevices));
  const [alerts, setAlerts] = useState<AlertItem[]>(() => readStorage('netpulse-alerts', initialAlerts));
  const [dark, setDark] = useState<boolean>(() => readStorage('netpulse-dark', false));
  const [live, setLive] = useState(true);
  const [traffic, setTraffic] = useState(trafficSeed);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState('All');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selected, setSelected] = useState<Device | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'Router',
    ip: '',
    location: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    localStorage.setItem('netpulse-devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('netpulse-alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('netpulse-dark', JSON.stringify(dark));
  }, [dark]);

  // Simulated live traffic updates every 3 seconds
  useEffect(() => {
    if (!live) return;

    const timer = window.setInterval(() => {
      setTraffic(prev => [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          download: Math.round(20 + Math.random() * 65),
          upload: Math.round(8 + Math.random() * 35)
        }
      ]);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [live]);

  const online = devices.filter(d => d.status === 'Online').length;
  const offline = devices.filter(d => d.status === 'Offline').length;
  const warnings = devices.filter(d => d.status === 'Warning').length;

  const healthData = [
    { name: 'Online', value: online },
    { name: 'Warning', value: warnings },
    { name: 'Offline', value: offline }
  ].filter(x => x.value > 0);

  const filteredDevices = useMemo(
    () =>
      devices.filter(
        d =>
          (statusFilter === 'All' || d.status === statusFilter) &&
          `${d.name} ${d.ip} ${d.location} ${d.type}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [devices, statusFilter, search]
  );

  const filteredAlerts = alerts.filter(
    a => alertFilter === 'All' || a.severity === alertFilter
  );

  const addAlert = (
    title: string,
    message: string,
    severity: AlertItem['severity'],
    device?: string
  ) => {
    setAlerts(prev => [
      {
        id: Date.now(),
        title,
        message,
        severity,
        time: 'Just now',
        device
      },
      ...prev
    ]);
  };

  const changeStatus = (device: Device, status: Status) => {
    setDevices(prev =>
      prev.map(d =>
        d.id === device.id
          ? {
              ...d,
              status,
              lastSeen: 'Just now',
              cpu: status === 'Offline' ? 0 : d.cpu || 24
            }
          : d
      )
    );

    if (status !== device.status) {
      addAlert(
        `Status changed: ${device.name}`,
        `${device.name} status changed to ${status}.`,
        status === 'Offline'
          ? 'Critical'
          : status === 'Warning'
          ? 'Warning'
          : 'Info',
        device.name
      );
    }

    setSelected({ ...device, status });
  };

  const addDevice = () => {
    setFormError('');

    const ipPattern =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    if (
      !newDevice.name.trim() ||
      !newDevice.ip.trim() ||
      !newDevice.location.trim()
    ) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!ipPattern.test(newDevice.ip.trim())) {
      setFormError('Enter a valid IPv4 address (example: 192.168.1.10).');
      return;
    }

    if (
      devices.some(
        d => d.name.toLowerCase() === newDevice.name.trim().toLowerCase()
      )
    ) {
      setFormError('A device with this name already exists.');
      return;
    }

    if (devices.some(d => d.ip === newDevice.ip.trim())) {
      setFormError('This IP address is already registered.');
      return;
    }

    const created: Device = {
      id: Date.now(),
      ...newDevice,
      name: newDevice.name.trim(),
      ip: newDevice.ip.trim(),
      location: newDevice.location.trim(),
      status: 'Online',
      uptime: 100,
      cpu: 22,
      lastSeen: 'Just now'
    };

    setDevices(prev => [created, ...prev]);

    addAlert(
      'Device Added',
      `${created.name} was added to the device inventory.`,
      'Info',
      created.name
    );

    setNewDevice({
      name: '',
      type: 'Router',
      ip: '',
      location: ''
    });

    setShowAdd(false);
  };

  const removeDevice = (device: Device) => {
    if (!window.confirm(`Remove ${device.name} from NetPulse?`)) return;

    setDevices(prev => prev.filter(d => d.id !== device.id));
    setSelected(null);

    addAlert(
      'Device Removed',
      `${device.name} was removed from inventory.`,
      'Info',
      device.name
    );
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Type', 'IP Address', 'Location', 'Status', 'Uptime %', 'CPU %', 'Last Seen'],
      ...devices.map(d => [
        d.name,
        d.type,
        d.ip,
        d.location,
        d.status,
        d.uptime,
        d.cpu,
        d.lastSeen
      ])
    ];

    const csv = rows
      .map(row =>
        row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'netpulse-devices.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const goTo = (nav: string) => {
    setActiveNav(nav);

    const id =
      nav === 'Dashboard'
        ? 'dashboard'
        : nav === 'Devices'
        ? 'devices-section'
        : nav === 'Alerts'
        ? 'alerts-section'
        : 'traffic-section';

    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <div className={`app-shell ${dark ? 'dark-mode' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={21} />
          </div>
          <div>
            <strong>NetPulse</strong>
            <small>NETWORK MONITOR</small>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav>
          {[
            ['Dashboard', LayoutDashboard],
            ['Devices', Router],
            ['Alerts', Bell]
          ].map(([label, Icon]: any) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? 'active' : ''}`}
              onClick={() => goTo(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Alerts' && alerts.length > 0 && (
                <span className="nav-count">{alerts.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="pulse-dot" />
            <div>
              <b>System status</b>
              <small>Monitoring simulation active</small>
            </div>
          </div>
          <div className="sidebar-footer">
            NetPulse <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      <main className="main-area" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <div className="live-pill">
              <span className="pulse-dot" />
              {live ? 'Live simulation' : 'Paused'}
            </div>

            <button
              className="icon-button"
              aria-label="Toggle theme"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="icon-button alert-bell"
              onClick={() => goTo('Alerts')}
              aria-label="Go to alerts"
            >
              <Bell size={18} />
              {alerts.length > 0 && <span className="bell-dot" />}
            </button>

            <div className="avatar">MK</div>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <p className="eyebrow">NETWORK OVERVIEW</p>
              <h1>Dashboard</h1>
              <p className="page-subtitle">
                Monitor your network devices and keep track of infrastructure health.
              </p>
            </div>

            <div className="heading-buttons">
              <button className="secondary-btn" onClick={exportCSV}>
                <Download size={16} /> Export CSV
              </button>

              <button
                className="primary-btn"
                onClick={() => {
                  setShowAdd(true);
                  setFormError('');
                }}
              >
                <Plus size={17} /> Add Device
              </button>
            </div>
          </section>

          <section className="stats-grid">
            <StatCard
              title="Total Devices"
              value={devices.length}
              icon={<Server />}
              subtitle="Registered devices"
              tone="green"
            />

            <StatCard
              title="Online Devices"
              value={online}
              icon={<CheckCircle />}
              subtitle={`${devices.length ? Math.round(online / devices.length * 100) : 0}% operational`}
              tone="green"
            />

            <StatCard
              title="Warnings"
              value={warnings}
              icon={<AlertTriangle />}
              subtitle="Needs attention"
              tone="amber"
            />

            <StatCard
              title="Offline Devices"
              value={offline}
              icon={<XCircle />}
              subtitle="Connection lost"
              tone="red"
            />
          </section>

          <section className="charts-grid" id="traffic-section">
            <div className="panel traffic-panel">
              <div className="panel-header">
                <div>
                  <h2>Network Traffic</h2>
                  <p>Bandwidth utilization · Mbps</p>
                </div>

                <button
                  className={`live-toggle ${live ? 'on' : ''}`}
                  onClick={() => setLive(!live)}
                >
                  <span />
                  {live ? 'Live' : 'Paused'}
                </button>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend-download" /> Download
                </span>
                <span>
                  <i className="legend-upload" /> Upload
                </span>
                <small>
                  <RefreshCw size={12} />
                  {live ? 'Updates every 3 sec' : 'Updates paused'}
                </small>
              </div>

              <div className="traffic-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={traffic}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="download"
                      name="Download"
                      stroke="#668B73"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="upload"
                      name="Upload"
                      stroke="#9AB7A1"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel health-panel">
              <div className="panel-header">
                <div>
                  <h2>Device Health</h2>
                  <p>Current status distribution</p>
                </div>
                <Shield size={20} className="panel-icon" />
              </div>

              <div className="health-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={82}
                      paddingAngle={4}
                    >
                      {healthData.map(entry => (
                        <Cell
                          key={entry.name}
                          fill={statusColors[entry.name as Status]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="health-summary">
                <span><i className="online-dot" /> {online} Online</span>
                <span><i className="warning-dot" /> {warnings} Warning</span>
                <span><i className="offline-dot" /> {offline} Offline</span>
              </div>
            </div>
          </section>

          <section className="panel devices-panel" id="devices-section">
            <div className="panel-header devices-header">
              <div>
                <h2>Device Inventory</h2>
                <p>Manage and monitor registered network devices</p>
              </div>

              <div className="device-toolbar">
                <div className="search-box">
                  <Search size={15} />
                  <input
                    placeholder="Search name, IP, location..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="filter-select">
                  <Filter size={14} />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Online</option>
                    <option>Warning</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>DEVICE</th>
                    <th>IP ADDRESS</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                    <th>UPTIME</th>
                    <th>CPU</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredDevices.map(device => (
                    <tr
                      key={device.id}
                      onClick={() => setSelected(device)}
                      className="device-row"
                    >
                      <td>
                        <div className="device-name">
                          <div className="device-icon">
                            <Router size={16} />
                          </div>
                          <div>
                            <strong>{device.name}</strong>
                            <small>{device.type}</small>
                          </div>
                        </div>
                      </td>

                      <td className="mono">{device.ip}</td>

                      <td>
                        <span className="location">
                          <MapPin size={13} />
                          {device.location}
                        </span>
                      </td>

                      <td><StatusBadge status={device.status} /></td>

                      <td>
                        <span className="uptime-value">
                          {device.uptime.toFixed(1)}%
                        </span>
                      </td>

                      <td>
                        <div className="cpu-cell">
                          <span>{device.cpu}%</span>
                          <div className="cpu-track">
                            <i
                              style={{ width: `${device.cpu}%` }}
                              className={device.cpu > 80 ? 'high' : ''}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <button
                          className="row-more"
                          onClick={e => {
                            e.stopPropagation();
                            setSelected(device);
                          }}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDevices.length === 0 && (
                <div className="empty-state">
                  <Search size={26} />
                  <strong>No devices found</strong>
                  <p>Try changing your search or filter.</p>
                </div>
              )}
            </div>

            <div className="table-footer">
              Showing <b>{filteredDevices.length}</b> of <b>{devices.length}</b> devices
            </div>
          </section>

          <section className="panel alerts-panel" id="alerts-section">
            <div className="panel-header">
              <div>
                <h2>Recent Alerts</h2>
                <p>Events and notifications from your network</p>
              </div>

              <div className="alert-controls">
                <div className="filter-select">
                  <Filter size={14} />
                  <select
                    value={alertFilter}
                    onChange={e => setAlertFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Critical</option>
                    <option>Warning</option>
                    <option>Info</option>
                  </select>
                </div>

                {alerts.length > 0 && (
                  <button
                    className="text-btn danger-text"
                    onClick={() => {
                      if (window.confirm('Clear all alerts?')) setAlerts([]);
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="alerts-list">
              {filteredAlerts.map(alert => (
                <div className="alert-row" key={alert.id}>
                  <div className={`alert-icon ${alert.severity.toLowerCase()}`}>
                    {alert.severity === 'Critical'
                      ? <XCircle size={17} />
                      : alert.severity === 'Warning'
                      ? <AlertTriangle size={17} />
                      : <CheckCircle size={17} />}
                  </div>

                  <div className="alert-copy">
                    <div>
                      <strong>{alert.title}</strong>
                      <span className={`severity-label ${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </div>

                    <p>{alert.message}</p>
                    {alert.device && <small>{alert.device}</small>}
                  </div>

                  <span className="alert-time">
                    <Clock size={12} />
                    {alert.time}
                  </span>

                  <button
                    className="dismiss-btn"
                    title="Dismiss alert"
                    onClick={() =>
                      setAlerts(prev => prev.filter(a => a.id !== alert.id))
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {filteredAlerts.length === 0 && (
                <div className="empty-state">
                  <Bell size={24} />
                  <strong>No alerts</strong>
                  <p>There are no alerts in this category.</p>
                </div>
              )}
            </div>
          </section>

          <footer className="page-footer">
            <span>
              <Wifi size={14} /> NetPulse network monitoring dashboard
            </span>
            <span>Demo environment · Simulated monitoring data</span>
          </footer>
        </div>
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal device-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">DEVICE DETAILS</p>
                <h2>{selected.name}</h2>
              </div>

              <button className="icon-button" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-grid">
              <Detail label="Device type" value={selected.type} />
              <Detail label="IP address" value={selected.ip} />
              <Detail label="Location" value={selected.location} />
              <Detail label="Uptime" value={`${selected.uptime.toFixed(1)}%`} />
              <Detail label="CPU usage" value={`${selected.cpu}%`} />
              <Detail label="Last seen" value={selected.lastSeen} />
            </div>

            <div className="status-change">
              <label>Update device status</label>
              <select
                value={selected.status}
                onChange={e => changeStatus(selected, e.target.value as Status)}
              >
                <option>Online</option>
                <option>Warning</option>
                <option>Offline</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="danger-btn"
                onClick={() => removeDevice(selected)}
              >
                <Trash2 size={15} /> Remove Device
              </button>
              <button className="secondary-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div
            className="modal add-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">DEVICE INVENTORY</p>
                <h2>Add Network Device</h2>
              </div>

              <button className="icon-button" onClick={() => setShowAdd(false)}>
                <X size={18} />
              </button>
            </div>

            <p className="modal-intro">
              Enter device information to add it to your monitoring dashboard.
            </p>

            <div className="form-grid">
              <label>
                Device name *
                <input
                  value={newDevice.name}
                  onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="e.g. Branch-Router-06"
                />
              </label>

              <label>
                Device type *
                <select
                  value={newDevice.type}
                  onChange={e => setNewDevice({ ...newDevice, type: e.target.value })}
                >
                  <option>Router</option>
                  <option>Switch</option>
                  <option>Firewall</option>
                  <option>Access Point</option>
                  <option>Server</option>
                </select>
              </label>

              <label>
                IP address *
                <input
                  value={newDevice.ip}
                  onChange={e => setNewDevice({ ...newDevice, ip: e.target.value })}
                  placeholder="192.168.1.10"
                />
              </label>

              <label>
                Location *
                <input
                  value={newDevice.location}
                  onChange={e => setNewDevice({ ...newDevice, location: e.target.value })}
                  placeholder="e.g. Hyderabad"
                />
              </label>
            </div>

            {formError && (
              <div className="form-error">
                <AlertTriangle size={15} />
                {formError}
              </div>
            )}

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={addDevice}>
                <Plus size={16} /> Add Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  tone
}: {
  title: string;
  value: number;
  icon: ReactNode;
  subtitle: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className={`stat-icon ${tone}`}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}