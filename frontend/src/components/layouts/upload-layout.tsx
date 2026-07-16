/**
 * Purpose: Centered Upload Layout Template for Structura
 * Centers and sizes upload pipeline components.
 */

import React from "react";
import { DashboardLayout } from "./dashboard-layout";

interface UploadLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function UploadLayout({ children, breadcrumbs = [] }: UploadLayoutProps) {
  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="flex justify-center w-full min-h-[calc(100vh-8rem)] items-center py-6">
        <div className="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-300">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
