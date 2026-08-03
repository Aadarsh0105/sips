import { useEffect, useState } from 'react';
import { MoreVerticalIcon, PencilIcon, PlusIcon, Trash2Icon, Layers3Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useExclusiveMenu } from '../../hooks/useExclusiveMenu';
import {
  createFeeStructure,
  deleteFeeStructure,
  fetchFeeStructures,
  updateFeeStructure,
  type FeeStructureRecord,
} from '../../features/feeStructures/feeStructuresSlice';
import { FeeStructureModal } from '../../components/fee-structures/FeeStructureModal';
import { formatCurrency } from '../../lib/utils';

export function FeeStructuresPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.feeStructures.items);
  const loading = useAppSelector((state) => state.feeStructures.loading);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructureRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeStructureRecord | null>(null);

  useEffect(() => { void dispatch(fetchFeeStructures()); }, [dispatch]);

  return (
    <div>
      <PageHeader
        title="Fee Structures"
        subtitle={`${items.length} class fee templates`}
        action={<Button onClick={() => { setEditing(null); setOpen(true); }}><PlusIcon className="h-4 w-4" /> Add Structure</Button>}
      />

      <Card>
        {loading ? (
          <p className="px-6 py-10 text-sm text-slate-500">Loading fee structures...</p>
        ) : items.length === 0 ? (
          <EmptyState icon={Layers3Icon} title="No fee structures" description="Create class-wise fee templates." />
        ) : (
          <div className="overflow-x-auto lg:overflow-visible">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3 text-right font-semibold">Admission</th>
                  <th className="px-6 py-3 text-right font-semibold">Monthly</th>
                  <th className="px-6 py-3 text-right font-semibold">Exam</th>
                  <th className="px-6 py-3 text-right font-semibold">Sport</th>
                  <th className="px-6 py-3 text-right font-semibold">Computer</th>
                  <th className="px-6 py-3 text-right font-semibold">Function</th>
                  <th className="px-6 py-3 text-right font-semibold">Smart Class</th>
                  <th className="px-6 py-3 text-right font-semibold">Other</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                  {/* <th className="px-6 py-3 text-right font-semibold">Status</th> */}
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item._id} className="text-slate-900 dark:text-slate-100">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{item.className}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.admissionFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.monthlyFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.examFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.sportFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.computerFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.functionFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.smartClassFee)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.otherCharges)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalFee)}</td>
                    {/* <td className="px-6 py-3.5 text-right text-slate-900 dark:text-slate-100">{item.isActive ? 'Active' : 'Inactive'}</td> */}
                    <td className="px-6 py-3.5">
                      <FeeActionMenu
                        menuId={`fee-structures-action-menu-${item._id}`}
                        onEdit={() => { setEditing(item); setOpen(true); }}
                        onDelete={() => setDeleteTarget(item)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <FeeStructureModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSubmit={async (payload) => {
          if (editing) {
            await dispatch(updateFeeStructure({ id: editing._id, payload })).unwrap();
            toast.success('Fee structure updated.');
          } else {
            await dispatch(createFeeStructure(payload as any)).unwrap();
            toast.success('Fee structure created.');
          }
          await dispatch(fetchFeeStructures());
          setOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await dispatch(deleteFeeStructure(deleteTarget._id)).unwrap();
          await dispatch(fetchFeeStructures());
          toast.success('Fee structure deleted.');
          setDeleteTarget(null);
        }}
        title="Delete fee structure?"
        message={`This will permanently delete the fee structure for class ${deleteTarget?.className}.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function FeeActionMenu({
  menuId,
  onEdit,
  onDelete,
}: {
  menuId: string;
  onEdit: () => void;
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
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <PencilIcon className="h-4 w-4 text-blue-500" /> Edit
          </button>
          <button
            onClick={() => {
              close();
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-rose-50 dark:text-slate-100 dark:hover:bg-rose-500/10"
          >
            <Trash2Icon className="h-4 w-4 text-rose-500" /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
