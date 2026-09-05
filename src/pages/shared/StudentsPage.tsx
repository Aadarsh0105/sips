import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  EyeIcon,
  WalletIcon,
  PencilIcon,
  Trash2Icon,
  GraduationCapIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { CommonConfirmModal } from '../../components/ui/CommonConfirmModal';
import { StudentFormModal } from '../../components/shared/StudentFormModal';
import { StudentDetailModal } from '../../components/students/StudentDetailModal';
import { StudentPaymentHistoryModal } from '../../components/students/StudentPaymentHistoryModal';
import { PaymentModal } from '../../components/shared/PaymentModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { useData, deriveFee } from '../../contexts/DataContext';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useExclusiveMenu } from '../../hooks/useExclusiveMenu';
import { CLASS_OPTIONS } from '../../lib/classes';
import {
  deleteStudent as deleteStudentApi,
  fetchStudentById,
  fetchStudents,
  type StudentRecord,
} from '../../features/students/studentsSlice';
import { formatCurrency } from '../../lib/utils';
import type { Payment } from '../../lib/types';

const DEFAULT_PAGE_SIZE = 10;

export function StudentsPage({ canManage }: { canManage: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { payments } = useData();
  const students = useAppSelector((state) => state.students.items);
  const totalStudents = useAppSelector((state) => state.students.total);
  const totalPages = useAppSelector((state) => state.students.totalPages);
  const studentList = Array.isArray(students) ? students : [];
  const loading = useAppSelector((state) => state.students.loading);
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [detail, setDetail] = useState<StudentRecord | null>(null);
  const [historyStudent, setHistoryStudent] = useState<StudentRecord | null>(null);
  const [paying, setPaying] = useState<StudentRecord | null>(null);
  const [feeTarget, setFeeTarget] = useState<StudentRecord | null>(null);
  const [feeForm, setFeeForm] = useState({ examFee: 0, sportFee: 0, computerFee: 0 });
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<StudentRecord | null>(null);
  const [promoteForm, setPromoteForm] = useState({ toClass: '', section: 'A', remarks: '' });
  const [promoting, setPromoting] = useState(false);

  const classes = CLASS_OPTIONS;

  useEffect(() => {
    void dispatch(fetchStudents({
      page,
      limit: pageSize,
      includeDue: true,
      className: classFilter === 'all' ? null : classFilter,
    }));
  }, [classFilter, dispatch, page, pageSize]);

  useEffect(() => {
    const focus = params.get('focus');
    if (focus) {
      const student = studentList.find((item) => item._id === focus || item.studentId === focus);
      if (student) {
        setDetail(student);
        setQuery(student.studentId);
      }
      params.delete('focus');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studentList.filter((student) => {
      const matchesQuery =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.studentId.toLowerCase().includes(q) ||
        student.mobile.toLowerCase().includes(q) ||
        student.admissionNo.toLowerCase().includes(q);
      const matchesClass = classFilter === 'all' || student.className === classFilter;
      return matchesQuery && matchesClass;
    });
  }, [studentList, payments, query, classFilter]);

  const pageCount = Math.max(1, totalPages);
  const current = filtered;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => setPage(1), [query, classFilter, pageSize]);

  useEffect(() => {
    if (!detail) return;
    void dispatch(fetchStudentById(detail._id))
      .unwrap()
      .then((student) => setDetail(student))
      .catch(() => undefined);
  }, [dispatch, detail?._id]);

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${totalStudents} students enrolled`}
        action={
          <>
            {/* <Button variant="outline" onClick={handleExport}>
              <DownloadIcon className="h-4 w-4" /> Export
            </Button> */}
            {canManage ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4" /> Add Student
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search ID, name, mobile..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onChange={(e) => {
            setPage(1);
            setClassFilter(e.target.value);
          }}>
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select value={String(pageSize)} onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}>
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </Select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="px-6 py-10 text-sm text-slate-500">Loading students...</p>
        ) : current.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No students found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <div className="overflow-x-auto lg:overflow-visible">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-3 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 font-semibold">Admission No</th>
                  <th className="px-3 py-3 font-semibold">Admission Date</th>
                  <th className="px-3 py-3 font-semibold">Class</th>
                  <th className="px-3 py-3 text-right font-semibold">Monthly Fee</th>
                  <th className="px-3 py-3 text-right font-semibold">Paid Fee</th>
                  <th className="px-3 py-3 text-right font-semibold">Due Fee</th>
                  <th className="px-3 py-3 text-right font-semibold">Total Fee</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {current.map((student) => {
                  const legacy = toLegacyStudent(student);
                  const fee = deriveFee(legacy, payments);
                  return (
                    <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-500/15">
                            {student.name[0]}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500">{student.admissionNo || 'â€”'}</td>
                      <td className="px-3 py-3.5 text-slate-500">
                        {student.admissionDate ? student.admissionDate.slice(0, 10) : 'â€”'}
                      </td>
                      <td className="px-3 py-3.5 text-slate-500">
                        {student.className}-{student.section}
                      </td>
                      <td className="px-3 py-3.5 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(student.monthlyFee ?? 0)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(student.paidFee ?? fee.paid)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(student.dueFee ?? fee.remaining)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(student.paidFee + student.dueFee)}
                        {/* {formatCurrency(student.totalFee)} */}
                      </td>
                      <td className="px-3 py-3.5">
                        <ActionMenu
                          menuId={`students-action-menu-${student._id}`}
                          canManage={canManage}
                          canPay={(student.dueFee ?? fee.remaining) > 0 || isLumpSumAvailable(student)}
                          onView={() => navigate(`${location.pathname.startsWith('/reception') ? '/reception' : '/admin'}/student/${student._id}`)}
                          onHistory={() => setHistoryStudent(student)}
                          onPay={() => setPaying(student)}
                          onEdit={() => {
                            setEditing(student);
                            setFormOpen(true);
                          }}
                          onPromote={() => {
                            setPromoteTarget(student);
                            setPromoteForm({ toClass: '', section: student.section || 'A', remarks: '' });
                          }}
                          onDelete={() => setDeleteTarget(student)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <Pagination page={page} pageCount={pageCount} total={totalStudents} onPage={setPage} />
        </div>
      </Card>

      <StudentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing as any}
      />
      <StudentDetailModal
        student={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onViewReceipt={(payment) => setReceipt(payment)}
      />
      <StudentPaymentHistoryModal
        student={historyStudent}
        open={!!historyStudent}
        onClose={() => setHistoryStudent(null)}
        onViewReceipt={(payment) => setReceipt(payment)}
      />
      <PaymentModal
        student={paying}
        open={!!paying}
        onClose={() => setPaying(null)}
        onDone={(payment) => setReceipt(payment)}
      />
      <Modal
        open={!!feeTarget}
        onClose={() => setFeeTarget(null)}
        title="Student Fee Structure"
        subtitle={feeTarget ? `${feeTarget.name} Â· ${feeTarget.studentId}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setFeeTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!feeTarget) return;
                await api.put(`${API.FEE_STRUCTURES}/student/${feeTarget.studentId}`, feeForm);
                toast.success('Student fee structure updated.');
                setFeeTarget(null);
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Exam Fee">
            <Input type="number" value={feeForm.examFee} onChange={(e) => setFeeForm((f) => ({ ...f, examFee: Number(e.target.value) }))} />
          </Field>
          <Field label="Sport Fee">
            <Input type="number" value={feeForm.sportFee} onChange={(e) => setFeeForm((f) => ({ ...f, sportFee: Number(e.target.value) }))} />
          </Field>
          <Field label="Computer Fee">
            <Input type="number" value={feeForm.computerFee} onChange={(e) => setFeeForm((f) => ({ ...f, computerFee: Number(e.target.value) }))} />
          </Field>
        </div>
      </Modal>
      <ReceiptModal payment={receipt} student={historyStudent ?? detail} onClose={() => setReceipt(null)} />
      <Modal
        open={!!promoteTarget}
        onClose={() => setPromoteTarget(null)}
        title="Promote Student"
        subtitle={promoteTarget ? `${promoteTarget.name} · ${promoteTarget.studentId}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setPromoteTarget(null)}>Cancel</Button>
            <Button
              disabled={promoting}
              onClick={async () => {
                if (!promoteTarget) return;
                if (!promoteForm.toClass) {
                  toast.error('Please select the class to promote to.');
                  return;
                }
                if (!promoteForm.section) {
                  toast.error('Please select a section.');
                  return;
                }
                try {
                  setPromoting(true);
                  await api.post(`${API.STUDENTS}/promote`, {
                    studentId: promoteTarget.studentId,
                    toClass: promoteForm.toClass,
                    section: promoteForm.section,
                    remarks: promoteForm.remarks.trim(),
                  });
                  toast.success('Student promoted successfully.');
                  setPromoteTarget(null);
                  await dispatch(fetchStudents());
                } catch (error: any) {
                  toast.error(error?.response?.data?.message ?? 'Unable to promote student.');
                } finally {
                  setPromoting(false);
                }
              }}
            >
              {promoting ? 'Promoting...' : 'Promote Student'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Promote To Class" required>
            <Select value={promoteForm.toClass} onChange={(e) => setPromoteForm((form) => ({ ...form, toClass: e.target.value }))}>
              <option value="">Select Class</option>
              {CLASS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value} disabled={item.value === promoteTarget?.className}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Section" required>
            <Select value={promoteForm.section} onChange={(e) => setPromoteForm((form) => ({ ...form, section: e.target.value }))}>
              {['A', 'B', 'C', 'D'].map((section) => <option key={section} value={section}>{section}</option>)}
            </Select>
          </Field>
          <Field label="Remarks" className="sm:col-span-2">
            <Input
              type="text"
              placeholder="Promoted to the next class"
              value={promoteForm.remarks}
              onChange={(e) => setPromoteForm((form) => ({ ...form, remarks: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
      <CommonConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void dispatch(deleteStudentApi(deleteTarget._id)).then(() => dispatch(fetchStudents()));
            toast.success('Student deleted.');
          }
        }}
        title="Delete student?"
        message={`This will permanently remove ${deleteTarget?.name} and all their payment records. This action cannot be undone.`}
        confirmLabel="Delete Student"
      />
    </div>
  );
}

function ActionMenu({
  menuId,
  canManage,
  canPay,
  onView,
  onHistory,
  onPay,
  onEdit,
  onPromote,
  onDelete,
}: {
  menuId: string;
  canManage: boolean;
  canPay: boolean;
  onView: () => void;
  onHistory: () => void;
  onPay: () => void;
  onEdit: () => void;
  onPromote: () => void;
  onDelete: () => void;
}) {
  const { rootRef, open, toggle, close } = useExclusiveMenu(menuId);

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
        aria-label="Actions"
      >
        <MoreVerticalIcon className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <button
            onClick={() => {
              close();
              onView();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <EyeIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" /> View
          </button>
          {canPay ? (
            <button
              onClick={() => {
                close();
                onPay();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
              <WalletIcon className="h-4 w-4 text-emerald-500" /> Pay Fee
            </button>
          ) : null}
          <button
            onClick={() => {
              close();
              onHistory();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <WalletIcon className="h-4 w-4 text-indigo-500" /> Transactions
          </button>
          {/* <button
            onClick={onFeeStructure}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <PlusIcon className="h-4 w-4 text-violet-500" /> Fee Structure
          </button> */}
          {canManage ? (
            <>
              <button
                onClick={() => {
                  close();
                  onPromote();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                <GraduationCapIcon className="h-4 w-4 text-violet-500" /> Promote
              </button>
              <button
                onClick={() => {
                  close();
                  onEdit();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                <PencilIcon className="h-4 w-4 text-blue-500" /> Edit
              </button>
              <button
                onClick={() => {
                  close();
                  onDelete();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <Trash2Icon className="h-4 w-4 text-rose-500" /> Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function toLegacyStudent(student: StudentRecord) {
  return {
    id: student._id,
    admissionNumber: student.admissionNo,
    name: student.name,
    fatherName: student.fatherName,
    motherName: student.motherName,
    className: student.className,
    section: student.section,
    rollNumber: '',
    gender: student.gender.toLowerCase() as any,
    dob: student.dob,
    mobile: student.mobile,
    parentMobile: '',
    address: student.address,
    email: student.email,
    admissionDate: student.admissionDate ?? '',
    session: '',
    totalFee: student.totalFee,
    discount: 0,
    fine: 0,
    dueDate: '',
    createdAt: student.createdAt,
  };
}

function isLumpSumAvailable(student: StudentRecord) {
  return new Date().getMonth() + 1 <= 8 && (student.dueFee ?? 0) <= 0 && !student.lumpSumPaid;
}
