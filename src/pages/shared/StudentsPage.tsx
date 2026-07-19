










import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
  WalletIcon,
  DownloadIcon } from
'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StudentFormModal } from '../../components/shared/StudentFormModal';
import { StudentDetailModal } from '../../components/students/StudentDetailModal';
import { PaymentModal } from '../../components/shared/PaymentModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { useData, deriveFee } from '../../contexts/DataContext';
import {
  classNamesFor,
  formatCurrency,
  statusLabel } from
'../../lib/utils';
import { exportCSV } from '../../lib/export';
import type { Payment, Student } from '../../lib/types';

const PAGE_SIZE = 8;

export function StudentsPage({ canManage }: {canManage: boolean;}) {
  const { students, payments, deleteStudent } = useData();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [paying, setPaying] = useState<Student | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const classes = useMemo(
    () => Array.from(new Set(students.map((s) => s.className))),
    [students]
  );
  const sessions = useMemo(
    () => Array.from(new Set(students.map((s) => s.session))),
    [students]
  );

  // deep link focus from global search
  useEffect(() => {
    const focus = params.get('focus');
    if (focus) {
      const s = students.find((x) => x.id === focus);
      if (s) {
        setDetail(s);
        setQuery(s.id);
      }
      params.delete('focus');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const fee = deriveFee(s, payments);
      const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.mobile.toLowerCase().includes(q) ||
      s.parentMobile.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q);
      const matchesClass = classFilter === 'all' || s.className === classFilter;
      const matchesSession = sessionFilter === 'all' || s.session === sessionFilter;
      const matchesStatus =
      statusFilter === 'all' ||
      statusFilter === 'paid' && fee.status === 'paid' ||
      statusFilter === 'pending' && fee.status !== 'paid';
      return matchesQuery && matchesClass && matchesSession && matchesStatus;
    });
  }, [students, payments, query, classFilter, sessionFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [query, classFilter, sessionFilter, statusFilter]);

  const handleExport = () => {
    exportCSV(
      'students',
      filtered.map((s) => {
        const fee = deriveFee(s, payments);
        return {
          StudentID: s.id,
          Admission: s.admissionNumber,
          Name: s.name,
          Class: `${s.className}-${s.section}`,
          Mobile: s.mobile,
          TotalFee: fee.totalFee,
          Paid: fee.paid,
          Remaining: fee.remaining,
          Status: statusLabel(fee.status)
        };
      })
    );
    toast.success('Students exported to CSV.');
  };

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} students enrolled`}
        action={
        <>
            <Button variant="outline" onClick={handleExport}>
              <DownloadIcon className="h-4 w-4" /> Export
            </Button>
            {canManage &&
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}>
            
                <PlusIcon className="h-4 w-4" /> Add Student
              </Button>
          }
          </>
        } />
      

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search ID, name, mobile, admission…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9" />
            
          </div>
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">All Classes</option>
            {classes.map((c) =>
            <option key={c} value={c}>
                Class {c}
              </option>
            )}
          </Select>
          <Select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
            <option value="all">All Sessions</option>
            {sessions.map((s) =>
            <option key={s} value={s}>
                {s}
              </option>
            )}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending / Partial</option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {current.length === 0 ?
        <EmptyState
          icon={UsersIcon}
          title="No students found"
          description="Try adjusting your search or filters." /> :


        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3 font-semibold">Mobile</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                  <th className="px-6 py-3 text-right font-semibold">Remaining</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {current.map((s) => {
                const fee = deriveFee(s, payments);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {s.photo ?
                        <img src={s.photo} alt="" className="h-9 w-9 rounded-full object-cover" /> :

                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-500/15">
                              {s.name[0]}
                            </span>
                        }
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {s.name}
                            </p>
                            <p className="text-xs text-slate-400">{s.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {s.className}-{s.section}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{s.mobile}</td>
                      <td className="px-6 py-3.5 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(fee.totalFee)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(fee.remaining)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classNamesFor(fee.status)}`}>
                        
                          {statusLabel(fee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn label="View" onClick={() => setDetail(s)}>
                            <EyeIcon className="h-4 w-4" />
                          </IconBtn>
                          {fee.remaining > 0 &&
                        <IconBtn label="Accept payment" onClick={() => setPaying(s)}>
                              <WalletIcon className="h-4 w-4" />
                            </IconBtn>
                        }
                          {canManage &&
                        <>
                              <IconBtn
                            label="Edit"
                            onClick={() => {
                              setEditing(s);
                              setFormOpen(true);
                            }}>
                            
                                <PencilIcon className="h-4 w-4" />
                              </IconBtn>
                              <IconBtn label="Delete" danger onClick={() => setDeleteTarget(s)}>
                                <Trash2Icon className="h-4 w-4" />
                              </IconBtn>
                            </>
                        }
                        </div>
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
        <div className="border-t border-slate-100 dark:border-slate-800">
          <Pagination page={page} pageCount={pageCount} total={filtered.length} onPage={setPage} />
        </div>
      </Card>

      {/* Modals */}
      <StudentFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <StudentDetailModal
        student={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onPay={(s) => {
          setDetail(null);
          setPaying(s);
        }}
        onViewReceipt={(p) => setReceipt(p)} />
      
      <PaymentModal
        student={paying}
        open={!!paying}
        onClose={() => setPaying(null)}
        onDone={(p) => setReceipt(p)} />
      
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteStudent(deleteTarget.id);
            toast.success('Student deleted.');
          }
        }}
        title="Delete student?"
        message={`This will permanently remove ${deleteTarget?.name} and all their payment records. This action cannot be undone.`}
        confirmLabel="Delete Student" />
      
    </div>);

}

function IconBtn({
  children,
  label,
  onClick,
  danger





}: {children: React.ReactNode;label: string;onClick: () => void;danger?: boolean;}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
      danger ?
      'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10' :
      'text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800'}`
      }>
      
      {children}
    </button>);

}