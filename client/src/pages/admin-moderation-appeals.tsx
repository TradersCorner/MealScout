/**
 * Appeal Intake v1 — Read-Only Appeals Registry
 * 
 * CRITICAL GUARDRAIL:
 * Appeals do not alter moderation outcomes.
 * This is a compliance and transparency surface only.
 * 
 * NO FSM (static list + detail drawer).
 * NO mutations (read-only queries only).
 * NO messaging or aggregation.
 * 
 * All copy sourced from APPEAL_INTAKE_COPY.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { APPEAL_INTAKE_COPY as COPY } from '@/copy/appealIntake.copy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, FileText } from 'lucide-react';

// ============================================================================
// Domain Types (Read-Only Appeals)
// ============================================================================

interface AppealRecord {
  id: string;
  submittedAt: Date;
  status: 'received' | 'reviewed';
  appealingPartyId: string; // Redacted ID
  referencedDecision: {
    decisionId: string;
    date: Date;
    action: 'hide' | 'restore' | 'remove';
    reason: string | null;
  };
  evidenceLinks: string[];
}

// ============================================================================
// Components
// ============================================================================

function AppealsHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{COPY.page.title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{COPY.page.subtitle}</p>
    </div>
  );
}

interface StatusFilterProps {
  value: 'all' | 'received' | 'reviewed';
  onChange: (value: 'all' | 'received' | 'reviewed') => void;
}

function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <label className="text-sm font-medium">{COPY.filters.status.label}</label>
      <Select value={value} onValueChange={(v) => onChange(v as any)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{COPY.filters.status.all}</SelectItem>
          <SelectItem value="received">{COPY.filters.status.received}</SelectItem>
          <SelectItem value="reviewed">{COPY.filters.status.reviewed}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface AppealDetailDrawerProps {
  appeal: AppealRecord | null;
  onClose: () => void;
}

function AppealDetailDrawer({ appeal, onClose }: AppealDetailDrawerProps) {
  if (!appeal) return null;

  const statusColor = appeal.status === 'received' 
    ? 'bg-blue-100 text-blue-800' 
    : 'bg-gray-100 text-gray-800';

  const actionLabel = appeal.referencedDecision.action === 'hide'
    ? COPY.actions.hide
    : appeal.referencedDecision.action === 'restore'
    ? COPY.actions.restore
    : COPY.actions.remove;

  return (
    <Sheet open={!!appeal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{COPY.detail.title}</SheetTitle>
          <SheetDescription>{COPY.detail.disclaimer}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Appeal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appeal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.id}:</span>
                <span className="text-sm font-mono">{appeal.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.submittedAt}:</span>
                <span className="text-sm">{appeal.submittedAt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.status}:</span>
                <Badge className={statusColor}>
                  {appeal.status === 'received' ? COPY.status.received : COPY.status.reviewed}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.party}:</span>
                <span className="text-sm font-mono">{appeal.appealingPartyId}</span>
              </div>
            </CardContent>
          </Card>

          {/* Referenced Decision */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{COPY.detail.decision.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.decisionId}:</span>
                <span className="text-sm font-mono">{appeal.referencedDecision.decisionId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.date}:</span>
                <span className="text-sm">{appeal.referencedDecision.date.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.action}:</span>
                <span className="text-sm font-semibold">{actionLabel}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.reason}:</span>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {appeal.referencedDecision.reason || COPY.detail.decision.noReason}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attached Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{COPY.detail.evidence.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {appeal.evidenceLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">{COPY.detail.evidence.noEvidence}</p>
              ) : (
                <ul className="space-y-2">
                  {appeal.evidenceLinks.map((link, idx) => (
                    <li key={idx} className="text-sm">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {COPY.detail.evidence.link} {idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={onClose} className="w-full">
            {COPY.detail.close}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface AppealsListProps {
  appeals: AppealRecord[];
  onViewDetails: (appeal: AppealRecord) => void;
}

function AppealsList({ appeals, onViewDetails }: AppealsListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{COPY.list.appealId}</TableHead>
              <TableHead>{COPY.list.submittedAt}</TableHead>
              <TableHead>{COPY.list.status}</TableHead>
              <TableHead>{COPY.list.decisionDate}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appeals.map((appeal) => {
              const statusColor = appeal.status === 'received'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800';

              return (
                <TableRow key={appeal.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{appeal.id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-sm">{appeal.submittedAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColor}>
                      {appeal.status === 'received' ? COPY.status.received : COPY.status.reviewed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {appeal.referencedDecision.date.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(appeal)}
                    >
                      {COPY.list.viewDetails}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AppealsEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{COPY.page.empty}</p>
      </CardContent>
    </Card>
  );
}

function AppealsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <p className="text-muted-foreground">{COPY.page.error}</p>
        <Button onClick={onRetry}>{COPY.page.retry}</Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminModerationAppealsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'reviewed'>('all');
  const [selectedAppeal, setSelectedAppeal] = useState<AppealRecord | null>(null);

  // Fetch appeals (read-only, no mutations)
  const { data: appeals, isLoading, isError, refetch } = useQuery<AppealRecord[]>({
    queryKey: ['/api/admin/moderation-appeals', statusFilter],
    queryFn: async () => {
      // For v1, this would fetch from a dedicated appeals endpoint
      // For now, return mock structure to demonstrate the surface
      // In production, wire to existing audit/report tables
      
      // Mock data for demonstration (replace with actual API call)
      const mockAppeals: AppealRecord[] = [];
      
      return mockAppeals;
    },
  });

  const filteredAppeals = appeals || [];

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-background p-6">
      <AppealsHeader />

      <StatusFilter value={statusFilter} onChange={setStatusFilter} />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <span className="ml-3 text-muted-foreground">{COPY.page.loading}</span>
        </div>
      )}

      {isError && <AppealsError onRetry={handleRetry} />}

      {!isLoading && !isError && (
        <>
          {filteredAppeals.length === 0 ? (
            <AppealsEmpty />
          ) : (
            <AppealsList
              appeals={filteredAppeals}
              onViewDetails={setSelectedAppeal}
            />
          )}
        </>
      )}

      <AppealDetailDrawer
        appeal={selectedAppeal}
        onClose={() => setSelectedAppeal(null)}
      />
    </div>
  );
}
