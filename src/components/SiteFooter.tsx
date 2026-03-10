"use client";

import React from "react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--foreground)]/5 bg-[var(--background)] py-12 px-6">
      <div className="mx-auto max-w-[var(--container-width)] flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-base tracking-tighter">
            <div className="w-6 h-6 bg-[var(--accent-color)] rounded-sm flex items-center justify-center text-[var(--accent-foreground)] text-[10px]">
              O
            </div>
            <span>Studio Ordo</span>
          </div>
          <p className="text-[11px] font-medium opacity-40 leading-relaxed max-w-xs">
            Architecting high-performance systems for the intelligence era.
            Bridging the gap between Clean Architecture and LLM orchestration.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Platform</h4>
            <ul className="space-y-2 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity">
              <li><Link href="/books">Library</Link></li>
              <li><Link href="/training">Training</Link></li>
              <li><Link href="/studio">Studio</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Resources</h4>
            <ul className="space-y-2 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity">
              <li><Link href="/docs">Documentation</Link></li>
              <li><Link href="/patterns">Patterns</Link></li>
              <li><Link href="/api">API</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-30">Legal</h4>
            <ul className="space-y-2 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-[var(--container-width)] mt-12 pt-8 border-t border-[var(--foreground)]/5 flex justify-between items-center">
        <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">
          © 2026 Studio Ordo. All rights reserved.
        </span>
        <div className="flex gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
          <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Global Status: Optimal</span>
        </div>
      </div>
    </footer>
  );
}
