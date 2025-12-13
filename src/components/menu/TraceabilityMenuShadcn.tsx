import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MENU_TREE, MenuNode } from "./menuData";

function highlight(text: string, q: string) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className={p.toLowerCase() === q.toLowerCase() ? "bg-yellow-200 rounded px-0.5" : ""}>{p}</span>
      ))}
    </>
  );
}

export default function TraceabilityMenuShadcn({ onPick }: { onPick?: (n: MenuNode)=>void }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return MENU_TREE;
    const match = (n: MenuNode) => n.label.toLowerCase().includes(q.toLowerCase());
    const clone = (n: MenuNode): MenuNode | null => {
      if (!n.children) return match(n) ? n : null;
      const kids = n.children.map(clone).filter(Boolean) as MenuNode[];
      if (kids.length || match(n)) return { ...n, children: kids };
      return null;
    };
    return MENU_TREE.map(clone).filter(Boolean) as MenuNode[];
  }, [q]);

  const leaf = (n: MenuNode) => (
    <div key={n.key}
      className="group flex items-center justify-between rounded-xl border px-3 py-2 hover:bg-muted cursor-pointer"
      onClick={() => { onPick?.(n); if (n.path) window.location.href = n.path; }}>
      <div className="text-sm font-medium">{highlight(n.label, q)}</div>
      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 text-xs">→</span>
    </div>
  );

  const section = (n: MenuNode) => (
    <Accordion type="single" collapsible key={n.key} defaultValue={n.key}>
      <AccordionItem value={n.key}>
        <AccordionTrigger className="text-left">
          <div className="font-semibold">{highlight(n.label, q)}</div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-2">{(n.children||[]).map(c => leaf(c))}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Traceability Suite <Badge variant="secondary">v1</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-2">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kiếm menu (EPCIS, UFLPA, DPP, …)" />
        </div>
        <ScrollArea className="h-[70vh] pr-2">
          <div className="grid gap-3">
            {filtered.map((n) => n.children ? section(n) : leaf(n))}
          </div>
        </ScrollArea>
        <Separator className="my-3" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Trợ giúp</Button>
        </div>
      </CardContent>
    </Card>
  );
}
