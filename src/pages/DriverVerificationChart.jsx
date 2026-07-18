import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const FIELDS = [
  { key: "license_verified", label: "License Verified", group: "License" },
  { key: "has_exterior_photo", label: "Exterior Photo", group: "Vehicle Photos" },
  { key: "has_interior_photos", label: "Interior Photos", group: "Vehicle Photos" },
  { key: "has_insurance_photo", label: "Insurance Card", group: "Vehicle Photos" },
  { key: "vehicle_verified", label: "Vehicle Approved", group: "Admin Approval" },
  { key: "has_vehicle_make", label: "Vehicle Make", group: "Vehicle Details" },
  { key: "has_vehicle_model", label: "Vehicle Model", group: "Vehicle Details" },
  { key: "has_vehicle_year", label: "Vehicle Year", group: "Vehicle Details" },
  { key: "has_vehicle_color", label: "Vehicle Color", group: "Vehicle Details" },
  { key: "has_license_plate", label: "License Plate", group: "Vehicle Details" },
  { key: "has_phone", label: "Phone Number", group: "Contact" },
  { key: "has_email", label: "Email", group: "Contact" },
];

export default function DriverVerificationChart() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const allUsers = await base44.entities.User.list("-created_date", 500);
        const verified = allUsers
          .filter(
            (u) =>
              u.drivers_license_verified === true &&
              (u.preferred_island || "").toLowerCase().startsWith("kauai")
          )
          .sort((a, b) =>
            (a.full_name || a.email || "")
              .toLowerCase()
              .localeCompare((b.full_name || b.email || "").toLowerCase())
          )
          .map((u) => ({
            name: u.full_name || u.email,
            email: u.email,
            license_verified: !!u.drivers_license_verified,
            vehicle_verified: !!u.vehicle_verified,
            vehicle_pending_review: !!u.vehicle_pending_review,
            has_exterior_photo: !!u.vehicle_exterior_photo_url,
            has_interior_photos: !!(
              u.vehicle_interior_photo_urls &&
              u.vehicle_interior_photo_urls.length > 0
            ),
            has_insurance_photo: !!u.auto_policy_photo_url,
            has_vehicle_make: !!u.vehicle_make,
            has_vehicle_model: !!u.vehicle_model,
            has_vehicle_year: !!u.vehicle_year,
            has_vehicle_color: !!u.vehicle_color,
            has_license_plate: !!u.license_plate,
            has_phone: !!u.phone_number,
            has_email: !!u.email,
          }));
        setDrivers(verified);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading driver verification data…</p>
      </div>
    );
  }

  const fullyVerified = drivers.filter((d) => d.vehicle_verified).length;
  const missingVehicle = drivers.filter((d) => !d.vehicle_verified).length;

  // Per-field completion counts
  const fieldCounts = FIELDS.map((f) => ({
    ...f,
    completed: drivers.filter((d) => d[f.key]).length,
    total: drivers.length,
    pct: Math.round(
      (drivers.filter((d) => d[f.key]).length / drivers.length) * 100
    ),
  }));

  const exportCsv = () => {
    const headers = [
      "Name",
      "Email",
      ...FIELDS.map((f) => f.label),
      "Fully Verified",
    ];
    const rows = drivers.map((d) => [
      d.name,
      d.email,
      ...FIELDS.map((f) => (d[f.key] ? "Yes" : "No")),
      d.vehicle_verified ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kauai_driver_verification_audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Kauaʻi Driver Verification Audit
              </h1>
              <p className="text-sm text-gray-500">
                {drivers.length} users with verified license · sorted alphabetically
              </p>
            </div>
          </div>
          <Button onClick={exportCsv} variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified License</p>
                <p className="text-3xl font-bold text-gray-800">
                  {drivers.length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Admin-approved driver's license
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Fully Approved Drivers</p>
                <p className="text-3xl font-bold text-green-600">
                  {fullyVerified}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              License + vehicle photos + insurance all verified
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Missing Vehicle Info</p>
                <p className="text-3xl font-bold text-red-500">
                  {missingVehicle}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              License verified but vehicle not approved
            </p>
          </Card>
        </div>

        {/* Field completion bar chart */}
        <Card className="p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Field Completion Overview
          </h2>
          <div className="space-y-3">
            {fieldCounts.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <div className="w-40 shrink-0">
                  <p className="text-sm font-medium text-gray-700">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.group}</p>
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full flex items-center justify-end px-2 ${
                      f.pct >= 75
                        ? "bg-green-500"
                        : f.pct >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(f.pct, 3)}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {f.completed}/{f.total}
                    </span>
                  </div>
                </div>
                <div className="w-12 shrink-0 text-right">
                  <span className="text-sm font-semibold text-gray-600">
                    {f.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed table */}
        <Card className="p-5 overflow-x-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Driver-by-Driver Breakdown
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-700 sticky left-0 bg-white">
                  Driver
                </th>
                {FIELDS.map((f) => (
                  <th
                    key={f.key}
                    className="text-center py-2 px-1 font-medium text-gray-500 whitespace-nowrap"
                    title={f.label}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {f.group}
                      </span>
                      <span className="text-xs">{f.label}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, idx) => (
                <tr
                  key={d.email}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    idx % 2 === 1 ? "bg-gray-50/50" : ""
                  }`}
                >
                  <td className="py-2 px-2 sticky left-0 bg-inherit">
                    <p className="font-semibold text-gray-800 capitalize">
                      {d.name}
                    </p>
                    <p className="text-xs text-gray-400">{d.email}</p>
                  </td>
                  {FIELDS.map((f) => (
                    <td key={f.key} className="text-center py-2 px-1">
                      {d[f.key] ? (
                        <Check className="w-4 h-4 text-green-500 inline" />
                      ) : (
                        <X className="w-4 h-4 text-red-400 inline" />
                      )}
                    </td>
                  ))}
                  <td className="text-center py-2 px-2">
                    {d.vehicle_verified ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Fully Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        Incomplete
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Data reflects current admin verification status. License-verified users
          without approved vehicle photos/insurance cannot post rides.
        </p>
      </div>
    </div>
  );
}